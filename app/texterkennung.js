// Buchscanner – F05: Texterkennung im Hintergrund (Tesseract.js, läuft in einem eigenen Worker-Thread).
// Warteschlange über alle Buch-Scans: zuerst der offene Scan, dann nach Änderungsdatum.
// Pausiert bei offener Kamera und im Hintergrund; hält den Bildschirm wach, solange sie arbeitet.
'use strict';
const Texterkennung = (() => {
  const SPRACHEN = { deu: 'Deutsch', eng: 'Englisch', spa: 'Spanisch' };
  const BASIS = new URL('vendor/tesseract/', location.href).href;
  const CACHE = 'texterkennung-7.0.0';
  const KERNE = ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'];

  let vorbereiten = null; // (original: Blob) → Promise<Canvas> (Fassung „Dokument“)
  let melden = () => {}; // ({ art, scanId, sprache })
  let gespeichert = () => {}; // (scanId, eintrag)
  let vorrang = null; // ID des offenen Scans
  let kameraOffen = false;
  let laeuft = false;
  let wecker = null; // weckt die wartende Schleife
  let worker = null;
  let workerSprache = null;
  let wachSperre = null;
  const fehlversuche = new Map(); // Seiten-ID → Anzahl

  // ---------- Steuerung von außen ----------

  function einrichten(o) {
    ({ vorbereiten, melden, gespeichert } = o);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') anstossen(); else wachLassen();
    });
    window.addEventListener('online', anstossen);
    alteTexteBereinigen().finally(anstossen);
  }

  function anstossen() {
    if (wecker) { const w = wecker; wecker = null; w(); } else if (!laeuft) schleife();
  }

  function kamera(offen) {
    kameraOffen = offen;
    if (offen) wachLassen(); else anstossen();
  }

  function vorrangSetzen(scanId) {
    vorrang = scanId;
    anstossen();
  }

  // ---------- Schleife ----------

  const warten = (ms) => new Promise((ok) => {
    wecker = ok;
    if (ms) setTimeout(() => { if (wecker === ok) { wecker = null; ok(); } }, ms);
  });

  async function naechste() {
    const [scans, texte] = await Promise.all([Speicher.alleScans(), Speicher.alleTexte()]);
    const vorhanden = new Map(texte.map((t) => [t.id, t]));
    const buecher = scans.filter((s) => s.art === 'buch')
      .sort((a, b) => (b.id === vorrang) - (a.id === vorrang) || b.geaendert - a.geaendert);
    for (const s of buecher) {
      const sprache = s.sprache || 'deu';
      const id = s.seiten.find((p) => {
        const t = vorhanden.get(p);
        // Ohne Text, andere Sprache, oder unsicher aus Version 0.5.0 (noch ohne Dreh- und Glätt-Versuche)
        const alt = t && !t.vonHand && t.drehung === undefined && t.sicherheit < 70;
        return (!t || (!t.vonHand && t.sprache !== sprache) || alt) && (fehlversuche.get(p) || 0) < 2;
      });
      if (id) return { scanId: s.id, seitenId: id, sprache };
    }
    return null;
  }

  async function spracheDa(sprache) {
    if (!('caches' in window)) return true;
    try {
      const cache = await caches.open(CACHE);
      const lang = await cache.match(`${BASIS}lang/${sprache}.traineddata.gz`);
      const kern = (await Promise.all(KERNE.map((k) => cache.match(`${BASIS}core/${k}`)))).some(Boolean);
      return Boolean(lang && kern);
    } catch {
      return true;
    }
  }

  function skriptLaden() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise((ok, fehler) => {
      const s = document.createElement('script');
      s.src = `${BASIS}tesseract.min.js`;
      s.onload = ok;
      s.onerror = () => fehler(new Error('Texterkennung konnte nicht geladen werden'));
      document.head.append(s);
    });
  }

  async function workerFuer(sprache) {
    if (!worker) {
      await skriptLaden();
      worker = await Tesseract.createWorker(sprache, 1, {
        workerPath: `${BASIS}worker.min.js`,
        corePath: `${BASIS}core`,
        langPath: `${BASIS}lang`,
        cacheMethod: 'none', // der Service Worker hält die Dateien
        workerBlobURL: false,
      });
      workerSprache = sprache;
    } else if (workerSprache !== sprache) {
      await worker.reinitialize(sprache, 1);
      workerSprache = sprache;
    }
  }

  async function schleife() {
    laeuft = true;
    try {
      for (;;) {
        if (kameraOffen || document.visibilityState !== 'visible') { wachLassen(); await warten(); continue; }
        const auftrag = await naechste();
        if (!auftrag) { wachLassen(); melden({ art: 'ruhe' }); await warten(); continue; }
        const { scanId, seitenId, sprache } = auftrag;

        if (!worker || workerSprache !== sprache) {
          if (!(await spracheDa(sprache))) {
            if (!navigator.onLine) { wachLassen(); melden({ art: 'offline', scanId, sprache }); await warten(); continue; }
            melden({ art: 'lade', scanId, sprache });
          }
        }
        wachHalten();
        try {
          await workerFuer(sprache);
          melden({ art: 'laeuft', scanId, sprache });
          const daten = await Speicher.seiteLaden(seitenId);
          if (!daten || kameraOffen) continue; // Seite weg oder Kamera inzwischen offen
          const best = await erkennen(daten.original);
          if (!best) continue; // Kamera wurde geöffnet: später noch einmal
          const eintrag = { id: seitenId, text: aufbereiten(best.data.blocks), sicherheit: Math.round(best.sicherheit), vonHand: false, sprache, drehung: best.drehung };
          if (await Speicher.textSetzen(eintrag)) gespeichert(scanId, eintrag);
          fehlversuche.delete(seitenId);
        } catch (fehler) {
          console.warn('Texterkennung:', fehler);
          const n = (fehlversuche.get(seitenId) || 0) + 1;
          fehlversuche.set(seitenId, n);
          if (n >= 2) {
            // Seite lässt sich nicht erkennen: leer speichern, sie gilt dann als unsicher
            const eintrag = { id: seitenId, text: '', sicherheit: 0, vonHand: false, sprache };
            try { if (await Speicher.textSetzen(eintrag)) gespeichert(scanId, eintrag); } catch { /* egal */ }
          }
          if (worker) { try { await worker.terminate(); } catch { /* egal */ } }
          worker = null;
          workerSprache = null;
          if (!navigator.onLine) melden({ art: 'offline', scanId, sprache });
          await warten(3000);
        }
      }
    } finally {
      laeuft = false;
    }
  }

  // Erst normal erkennen. Ist das Ergebnis unsicher (unter 70 %), weitere Versuche in dieser Reihenfolge:
  // um 90° bzw. 270° gedreht (iPhone quer gehalten bei Hochformat-Sperre), geglättet gegen Rasterpunkte
  // von Farbflächen, auf dem Kopf. Das sicherste Ergebnis gewinnt. Fast leere Seiten: kein weiterer Versuch.
  const VERSUCHE = [{ drehung: 0 }, { drehung: 90 }, { drehung: 270 }, { glaetten: 0.35 }, { drehung: 180 }];
  async function erkennen(original) {
    let best = null;
    for (const v of VERSUCHE) {
      if (kameraOffen) return null;
      const art = { drehung: v.glaetten ? best.drehung : v.drehung, glaetten: v.glaetten || 0 };
      const bild = await vorbereiten(original, art);
      const { data } = await worker.recognize(bild, {}, { text: true, blocks: true });
      bild.width = 1; bild.height = 1;
      const sicherheit = data.confidence || 0;
      if (!best || sicherheit > best.sicherheit) best = { data, sicherheit, drehung: art.drehung };
      if (best.sicherheit >= 70) break;
      if (!best.data.text || best.data.text.trim().split(/\s+/).length < 3) break; // (fast) leere Seite
    }
    return best;
  }

  // ---------- Text aufbereiten ----------

  // Absätze bleiben (Leerzeile), Zeilen eines Absatzes werden verbunden, Trennstriche am Zeilenende
  // zusammengezogen; unsichere Wörter (unter 50 %) als „[?Wort]“.
  function aufbereiten(bloecke) {
    const absaetze = [];
    for (const block of bloecke || []) {
      for (const absatz of block.paragraphs || []) {
        const woerter = [];
        for (const zeile of absatz.lines || []) {
          const ws = (zeile.words || []).filter((w) => w.text && w.text.trim());
          ws.forEach((w, k) => woerter.push({ text: w.text.trim(), unsicher: w.confidence < 50, ende: k === ws.length - 1 }));
        }
        const teile = [];
        for (let i = 0; i < woerter.length; i++) {
          let w = woerter[i];
          while (w.ende && /\p{L}-$/u.test(w.text) && i + 1 < woerter.length) {
            const n = woerter[++i];
            const klein = /^\p{Ll}/u.test(n.text);
            w = { text: klein ? w.text.slice(0, -1) + n.text : w.text + n.text, unsicher: w.unsicher || n.unsicher, ende: n.ende };
          }
          teile.push(w.unsicher ? `[?${w.text}]` : w.text);
        }
        const text = teile.join(' ').trim();
        if (text) absaetze.push(text);
      }
    }
    return bereinigen(absaetze.join('\n\n'));
  }

  // Störzeichen entfernen: einzelne senkrechte Striche (Seitenrand, Bundsteg) und unsichere
  // „Wörter“ ganz ohne Buchstaben (Satzzeichen, Symbole, Ziffern aus Schmutz oder Rändern).
  function bereinigen(text) {
    const stoerend = (t) => /^[|¦]+$/.test(t) || (/^\[\?[^\]]*\]$/.test(t) && !/\p{L}/u.test(t.slice(2, -1)));
    return text.split('\n\n')
      .map((absatz) => absatz.split(' ').filter((t) => t && !stoerend(t)).join(' ').trim())
      .filter(Boolean)
      .join('\n\n');
  }

  // Einmalig: schon gespeicherte, nicht von Hand geänderte Texte ebenso bereinigen
  async function alteTexteBereinigen() {
    try {
      for (const t of await Speicher.alleTexte()) {
        if (t.vonHand) continue;
        const sauber = bereinigen(t.text || '');
        if (sauber !== t.text) await Speicher.textSetzen({ ...t, text: sauber });
      }
    } catch (fehler) { console.warn('Bereinigen:', fehler); }
  }

  // ---------- Bildschirm wach halten ----------

  async function wachHalten() {
    if (wachSperre || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wachSperre = await navigator.wakeLock.request('screen');
      wachSperre.addEventListener('release', () => { wachSperre = null; });
    } catch { /* nicht erlaubt: dann eben ohne */ }
  }

  function wachLassen() {
    if (wachSperre) { wachSperre.release().catch(() => {}); wachSperre = null; }
  }

  return { SPRACHEN, einrichten, kamera, vorrangSetzen, anstossen, aufbereiten, bereinigen };
})();
