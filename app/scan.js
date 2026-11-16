// Buchscanner – F02: Seiten aufnehmen.
// Live-Kamera (Buch), iPhone-Kamera (normaler Scan), Übersicht, Großansicht, Kontrast.
// Die Seiten liegen nur im Arbeitsspeicher (dauerhaftes Speichern kommt mit F03).
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const ANSICHTEN = ['ansicht-start', 'ansicht-kamera', 'ansicht-uebersicht', 'ansicht-gross'];
  const ARTEN = { buch: 'Buch / Dokument', normal: 'Normaler Scan' };
  const VORSCHAU = 300; // Kantenlänge der Vorschaubilder in px
  const GROSS = 1600; // Kantenlänge der Großansicht in px

  let scan = null; // { art: 'buch'|'normal', kontrast: 'farbe'|'grau'|'dokument', seiten: [] }
  let naechsteId = 1;
  let aktuell = 0; // Seite in der Großansicht (Index)
  let ersetzen = null; // Seite, die gerade neu aufgenommen wird (Index) oder null
  let fotoZiel = null; // was ein Foto der iPhone-Kamera bewirkt: 'neu' | 'anhaengen' | 'ersetzen'
  let fotoIndex = 0; // bei 'ersetzen': welche Seite

  function zeige(id) {
    ANSICHTEN.forEach((a) => { $(a).hidden = a !== id; });
    window.scrollTo(0, 0);
  }
  const seitenText = (n) => (n === 1 ? '1 Seite' : `${n} Seiten`);

  // ---------- Bildfunktionen ----------

  function neuesCanvas(b, h) {
    const c = document.createElement('canvas');
    c.width = b; c.height = h;
    return c;
  }

  function verkleinert(quelle, b, h, max) {
    const f = Math.min(1, max / Math.max(b, h));
    const c = neuesCanvas(Math.max(1, Math.round(b * f)), Math.max(1, Math.round(h * f)));
    c.getContext('2d').drawImage(quelle, 0, 0, c.width, c.height);
    return c;
  }

  function alsBlob(c, qualitaet) {
    return new Promise((ok, fehler) => {
      c.toBlob((b) => (b ? ok(b) : fehler(new Error('Bild konnte nicht erzeugt werden'))), 'image/jpeg', qualitaet);
    });
  }

  function ladeBild(blob) {
    return new Promise((ok, fehler) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); ok(img); };
      img.onerror = () => { URL.revokeObjectURL(url); fehler(new Error('Bild konnte nicht gelesen werden')); };
      img.src = url;
    });
  }

  const grauwert = (d, j) => (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;

  // Schwarz- und Weißpunkt für „Dokument“: dunkelste 2 % → schwarz, Papier (Median) → weiß
  function berechneWerte(c) {
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
    const verlauf = new Uint32Array(256);
    for (let j = 0; j < d.length; j += 4) verlauf[grauwert(d, j)]++;
    const n = d.length / 4;
    const perzentil = (p) => {
      let summe = 0;
      for (let v = 0; v < 256; v++) { summe += verlauf[v]; if (summe >= n * p) return v; }
      return 255;
    };
    const schwarz = perzentil(0.02);
    const weiss = Math.min(255, Math.max(perzentil(0.5), schwarz + 40));
    return [schwarz, weiss];
  }

  function filtere(ctx, b, h, modus, werte) {
    if (modus === 'farbe') return;
    const bild = ctx.getImageData(0, 0, b, h);
    const d = bild.data;
    let tabelle = null;
    if (modus === 'dokument') {
      const [schwarz, weiss] = werte;
      tabelle = new Uint8ClampedArray(256);
      for (let v = 0; v < 256; v++) {
        const t = Math.min(1, Math.max(0, (v - schwarz) / (weiss - schwarz)));
        tabelle[v] = Math.round(255 * t ** 1.5);
      }
    }
    for (let j = 0; j < d.length; j += 4) {
      const g = tabelle ? tabelle[grauwert(d, j)] : grauwert(d, j);
      d[j] = g; d[j + 1] = g; d[j + 2] = g;
    }
    ctx.putImageData(bild, 0, 0);
  }

  // ---------- Seiten ----------

  // quelle: etwas Zeichenbares (Canvas, Bild); original: Blob oder Promise auf Blob
  function seiteAnlegen(quelle, breite, hoehe, original) {
    const klein = verkleinert(quelle, breite, hoehe, VORSCHAU);
    const seite = { id: naechsteId++, breite, hoehe, werte: berechneWerte(klein), original: null, bilder: {}, laden: {} };
    seite.bereit = Promise.all([original, alsBlob(klein, 0.8)]).then(([o, v]) => {
      seite.original = o;
      seite.vorschauBlob = v;
      seite.bilder.farbe = URL.createObjectURL(v);
      return seite;
    });
    return seite;
  }

  function seiteFreigeben(seite) {
    Object.values(seite.bilder).forEach((url) => URL.revokeObjectURL(url));
    seite.bilder = {};
  }

  // Vorschaubild einer Seite in einem Kontrast-Modus (wird zwischengespeichert)
  function vorschauUrl(seite, modus) {
    if (!seite.laden[modus]) {
      seite.laden[modus] = seite.bereit.then(async () => {
        if (seite.bilder[modus]) return seite.bilder[modus];
        const img = await ladeBild(seite.vorschauBlob);
        const c = neuesCanvas(img.naturalWidth, img.naturalHeight);
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        filtere(ctx, c.width, c.height, modus, seite.werte);
        const url = URL.createObjectURL(await alsBlob(c, 0.85));
        seite.bilder[modus] = url;
        return url;
      });
    }
    return seite.laden[modus];
  }

  function seiteEinfuegen(seite) {
    if (ersetzen !== null && scan.seiten[ersetzen]) {
      seiteFreigeben(scan.seiten[ersetzen]);
      scan.seiten[ersetzen] = seite;
    } else {
      scan.seiten.push(seite);
    }
  }

  function seiteEntfernen(seite) {
    const i = scan ? scan.seiten.indexOf(seite) : -1;
    if (i >= 0) scan.seiten.splice(i, 1);
    seiteFreigeben(seite);
  }

  function scanVerwerfen() {
    if (scan) scan.seiten.forEach(seiteFreigeben);
    scan = null;
    ersetzen = null;
    zeige('ansicht-start');
  }

  // ---------- Live-Kamera (Buch / Dokument) ----------

  const video = $('video');
  const ausloeser = $('ausloeser');
  const puffer = [neuesCanvas(1, 1), neuesCanvas(1, 1)]; // zwei wechselnde Aufnahme-Flächen
  const belegt = [false, false];
  let strom = null;

  function kameraOeffnen() {
    zeige('ansicht-kamera');
    $('kamera-fertig').textContent = ersetzen !== null ? 'Abbrechen' : 'Fertig';
    zaehlerAktualisieren();
    const letzte = ersetzen === null ? scan.seiten[scan.seiten.length - 1] : null;
    $('letzte').hidden = true;
    if (letzte) letzte.bereit.then(() => { $('letzte').src = letzte.bilder.farbe; $('letzte').hidden = false; }).catch(() => {});
    kameraStarten();
  }

  async function kameraStarten() {
    $('kamera-fehler').hidden = true;
    if (strom) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { kameraFehler(); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
      });
      // Inzwischen weggegangen? Dann gleich wieder abschalten.
      if ($('ansicht-kamera').hidden || document.visibilityState !== 'visible' || strom) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      strom = s;
      video.srcObject = s;
      await video.play().catch(() => {});
    } catch (fehler) {
      console.warn('Kamera:', fehler);
      kameraFehler();
    }
  }

  function kameraStoppen() {
    if (strom) strom.getTracks().forEach((t) => t.stop());
    strom = null;
    video.srcObject = null;
  }

  function kameraFehler() {
    kameraStoppen();
    $('kamera-fehler').hidden = false;
  }

  function zaehlerAktualisieren() {
    $('zaehler').textContent = ersetzen !== null ? `Seite ${ersetzen + 1} neu aufnehmen` : seitenText(scan.seiten.length);
  }

  function ausloeserAktualisieren() {
    ausloeser.disabled = !belegt.includes(false);
  }

  function blitz() {
    const b = $('blitz');
    b.classList.remove('an');
    void b.offsetWidth; // Animation neu starten
    b.classList.add('an');
  }

  function ausloesen() {
    if (!strom || !video.videoWidth || !scan) return;
    const nr = belegt.indexOf(false);
    if (nr < 0) return; // beide Flächen noch beim Umwandeln: Tipp zählt nicht
    belegt[nr] = true;
    ausloeserAktualisieren();

    const c = puffer[nr];
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    blitz();

    const original = alsBlob(c, 0.9).finally(() => {
      c.width = 1; c.height = 1; // Speicher sofort freigeben
      belegt[nr] = false;
      ausloeserAktualisieren();
    });
    const seite = seiteAnlegen(c, c.width, c.height, original);
    const warErsetzen = ersetzen !== null;
    seiteEinfuegen(seite);
    seite.bereit.then(() => {
      if (!$('ansicht-kamera').hidden) { $('letzte').src = seite.bilder.farbe; $('letzte').hidden = false; }
    }).catch(() => {
      seiteEntfernen(seite);
      zaehlerAktualisieren();
      zeigeHinweis('Aufnahme fehlgeschlagen – bitte noch einmal');
    });

    if (warErsetzen) {
      kameraStoppen();
      ersetzen = null;
      zeigeGross();
    } else {
      zaehlerAktualisieren();
    }
  }

  function kameraFertig() {
    kameraStoppen();
    if (ersetzen !== null) { ersetzen = null; zeigeGross(); return; }
    if (!scan || scan.seiten.length === 0) { scanVerwerfen(); return; }
    zeigeUebersicht();
  }

  ausloeser.addEventListener('click', ausloesen);
  $('kamera-fertig').addEventListener('click', kameraFertig);
  $('kamera-zurueck').addEventListener('click', kameraFertig);

  // Im Hintergrund Kamera abschalten, beim Zurückkehren wieder einschalten
  document.addEventListener('visibilitychange', () => {
    if ($('ansicht-kamera').hidden) return;
    if (document.visibilityState === 'visible') kameraStarten();
    else kameraStoppen();
  });

  // ---------- iPhone-Kamera (normaler Scan) ----------

  const fotoEingabe = $('foto-eingabe');

  function fotoAufnehmen(ziel, index = 0) {
    fotoZiel = ziel;
    fotoIndex = index;
    fotoEingabe.value = '';
    fotoEingabe.click();
  }

  fotoEingabe.addEventListener('change', async () => {
    const datei = fotoEingabe.files && fotoEingabe.files[0];
    const ziel = fotoZiel;
    fotoZiel = null;
    fotoEingabe.value = '';
    if (!datei || !ziel) return;
    let seite;
    try {
      const img = await ladeBild(datei);
      seite = seiteAnlegen(img, img.naturalWidth, img.naturalHeight, datei);
      await seite.bereit;
    } catch (fehler) {
      console.warn(fehler);
      zeigeHinweis('Foto konnte nicht gelesen werden');
      return;
    }
    if (ziel === 'neu') {
      scanVerwerfen();
      scan = { art: 'normal', kontrast: 'farbe', seiten: [] };
    }
    if (!scan) return;
    ersetzen = ziel === 'ersetzen' ? fotoIndex : null;
    seiteEinfuegen(seite);
    if (ziel === 'ersetzen') { ersetzen = null; zeigeGross(); } else zeigeUebersicht();
  });

  // ---------- Startseite ----------

  $('start-buch').addEventListener('click', () => {
    scan = { art: 'buch', kontrast: 'dokument', seiten: [] };
    ersetzen = null;
    kameraOeffnen();
  });

  // Die Kamera öffnet sich sofort; erst ein Foto führt zur Übersicht (Abbrechen ändert nichts)
  $('start-normal').addEventListener('click', () => fotoAufnehmen('neu'));

  // ---------- Übersicht ----------

  let rasterLauf = 0;

  function zeigeUebersicht() {
    zeige('ansicht-uebersicht');
    $('ueb-art').textContent = ARTEN[scan.art];
    $('ueb-anzahl').textContent = seitenText(scan.seiten.length);
    $('ueb-plus').textContent = scan.art === 'buch' ? '+ Seiten' : '+ Seite';
    document.querySelectorAll('[data-kontrast]').forEach((k) => {
      k.setAttribute('aria-pressed', String(k.dataset.kontrast === scan.kontrast));
    });
    rasterAufbauen();
  }

  async function rasterAufbauen() {
    const lauf = ++rasterLauf;
    const raster = $('raster');
    const modus = scan.kontrast;
    const bilder = scan.seiten.map((seite, i) => {
      const kachel = document.createElement('button');
      kachel.type = 'button';
      kachel.className = 'kachel';
      kachel.setAttribute('aria-label', `Seite ${i + 1}`);
      const img = new Image();
      img.alt = '';
      if (seite.bilder[modus]) img.src = seite.bilder[modus];
      const nr = document.createElement('span');
      nr.className = 'kachel-nr';
      nr.textContent = String(i + 1);
      kachel.append(img, nr);
      kachel.addEventListener('click', () => { aktuell = i; zeigeGross(); });
      return [seite, img, kachel];
    });
    raster.replaceChildren(...bilder.map((b) => b[2]));
    for (const [seite, img] of bilder) {
      if (img.src) continue;
      try {
        const url = await vorschauUrl(seite, modus);
        if (lauf !== rasterLauf) return; // inzwischen neu aufgebaut
        img.src = url;
      } catch { /* Seite fehlgeschlagen, wird entfernt */ }
    }
  }

  document.querySelectorAll('[data-kontrast]').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      if (!scan || scan.kontrast === knopf.dataset.kontrast) return;
      scan.kontrast = knopf.dataset.kontrast;
      zeigeUebersicht();
    });
  });

  $('ueb-plus').addEventListener('click', () => {
    if (scan.art === 'buch') kameraOeffnen();
    else fotoAufnehmen('anhaengen');
  });

  $('ueb-schliessen').addEventListener('click', async () => {
    if (await frage('Scan verwerfen? Die Seiten werden noch nicht gespeichert.', 'Verwerfen')) scanVerwerfen();
  });

  // ---------- Großansicht ----------

  let grossLauf = 0;

  function zeigeGross() {
    if (!scan || scan.seiten.length === 0) { scanVerwerfen(); return; }
    aktuell = Math.min(aktuell, scan.seiten.length - 1);
    zeige('ansicht-gross');
    const seite = scan.seiten[aktuell];
    $('gross-titel').textContent = `Seite ${aktuell + 1} von ${scan.seiten.length}`;
    $('gross-masse').textContent = `${seite.breite} × ${seite.hoehe}`;
    $('gross-vor').disabled = aktuell === 0;
    $('gross-nach').disabled = aktuell === scan.seiten.length - 1;
    zeichneGross(seite);
  }

  async function zeichneGross(seite) {
    const lauf = ++grossLauf;
    const cv = $('gross-canvas');
    try {
      await seite.bereit;
      const img = await ladeBild(seite.original);
      if (lauf !== grossLauf) return;
      const f = Math.min(1, GROSS / Math.max(img.naturalWidth, img.naturalHeight));
      cv.width = Math.round(img.naturalWidth * f);
      cv.height = Math.round(img.naturalHeight * f);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      filtere(ctx, cv.width, cv.height, scan.kontrast, seite.werte);
    } catch (fehler) {
      console.warn(fehler);
    }
  }

  function tausche(ziel) {
    const s = scan.seiten;
    if (ziel < 0 || ziel >= s.length) return;
    [s[aktuell], s[ziel]] = [s[ziel], s[aktuell]];
    aktuell = ziel;
    zeigeGross();
  }

  $('gross-zurueck').addEventListener('click', () => { grossLauf++; zeigeUebersicht(); });
  $('gross-vor').addEventListener('click', () => tausche(aktuell - 1));
  $('gross-nach').addEventListener('click', () => tausche(aktuell + 1));

  $('gross-neu').addEventListener('click', () => {
    if (scan.art === 'buch') {
      ersetzen = aktuell;
      kameraOeffnen();
    } else {
      // Bei Abbruch bleibt die alte Seite; ersetzt wird nur, wenn wirklich ein Foto kommt
      fotoAufnehmen('ersetzen', aktuell);
    }
  });

  $('gross-loeschen').addEventListener('click', async () => {
    if (!(await frage(`Seite ${aktuell + 1} löschen?`, 'Löschen'))) return;
    seiteEntfernen(scan.seiten[aktuell]);
    if (scan.seiten.length === 0) { scanVerwerfen(); return; }
    zeigeUebersicht();
  });

  // ---------- Rückfrage ----------

  function frage(text, jaText) {
    return new Promise((ok) => {
      const d = $('frage');
      $('frage-text').textContent = text;
      $('frage-ja').textContent = jaText;
      d.returnValue = '';
      d.addEventListener('close', () => ok(d.returnValue === 'ja'), { once: true });
      d.showModal();
    });
  }
})();
