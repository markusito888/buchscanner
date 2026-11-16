// Buchscanner – F02/F03: Seiten aufnehmen und dauerhaft speichern.
// Live-Kamera (Buch), iPhone-Kamera (normaler Scan), Übersicht, Großansicht, Kontrast,
// Liste „Meine Scans“. Jede Änderung wird sofort gespeichert (speicher.js).
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const ANSICHTEN = ['ansicht-start', 'ansicht-kamera', 'ansicht-uebersicht', 'ansicht-gross'];
  const ARTEN = { buch: 'Buch / Dokument', normal: 'Normaler Scan' };
  const VORSCHAU = 300; // Kantenlänge der Vorschaubilder in px
  const GROSS = 1600; // Kantenlänge der Großansicht in px

  // Offener Scan: { id, art: 'buch'|'normal', name, kontrast: 'farbe'|'grau'|'dokument', angelegt, geaendert,
  //   seiten: [], zuLoeschen: [Seiten-IDs], inDb, lauf: Promise, wartet, geloescht }
  let scan = null;
  let zaehlerId = 0;
  let letzteSicherung = Promise.resolve();
  let aktuell = 0; // Seite in der Großansicht (Index)
  let ersetzen = null; // Seite, die gerade neu aufgenommen wird (Index) oder null
  let fotoZiel = null; // was ein Foto der iPhone-Kamera bewirkt: 'neu' | 'anhaengen' | 'ersetzen'
  let fotoIndex = 0; // bei 'ersetzen': welche Seite

  function zeige(id) {
    ANSICHTEN.forEach((a) => { $(a).hidden = a !== id; });
    window.scrollTo(0, 0);
  }
  const seitenText = (n) => (n === 1 ? '1 Seite' : `${n} Seiten`);
  const neueId = () => `${Date.now().toString(36)}-${(zaehlerId++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const zwei = (z) => String(z).padStart(2, '0');
  const datum = (ms) => { const d = new Date(ms); return `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()}`; };

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

  // Kleine Blöcke mitteln (glättet Bildrauschen). Ergebnis: Mittelwerte, Blöcke je Zeile/Spalte
  function blockMittel(grau, b, h, block) {
    const bb = Math.ceil(b / block), bh = Math.ceil(h / block);
    const summe = new Float32Array(bb * bh), zahl = new Uint32Array(bb * bh);
    for (let y = 0; y < h; y++) {
      const zy = ((y / block) | 0) * bb;
      for (let x = 0; x < b; x++) { const k = zy + ((x / block) | 0); summe[k] += grau[y * b + x]; zahl[k]++; }
    }
    for (let k = 0; k < summe.length; k++) summe[k] /= zahl[k];
    return { mittel: summe, bb, bh };
  }

  // 3 × 3-Mittelwert über ein Feld-Raster
  function glaette(quelle, fb, fh) {
    const ziel = new Float32Array(fb * fh);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fb; x++) {
      let wert = 0, anzahl = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || xx < 0 || yy >= fh || xx >= fb) continue;
        wert += quelle[yy * fb + xx]; anzahl++;
      }
      ziel[y * fb + x] = wert / anzahl;
    }
    return ziel;
  }

  // Wert eines Feld-Rasters an Bildpunkt (x, y), zwischen den Feldmitten weich übergehend
  function zwischen(raster, fb, fh, feld, x, y) {
    const fy = Math.min(fh - 1, Math.max(0, (y + 0.5) / feld - 0.5));
    const y0 = fy | 0, y1 = Math.min(fh - 1, y0 + 1), ty = fy - y0;
    const fx = Math.min(fb - 1, Math.max(0, (x + 0.5) / feld - 0.5));
    const x0 = fx | 0, x1 = Math.min(fb - 1, x0 + 1), tx = fx - x0;
    const oben = raster[y0 * fb + x0] * (1 - tx) + raster[y0 * fb + x1] * tx;
    const unten = raster[y1 * fb + x0] * (1 - tx) + raster[y1 * fb + x1] * tx;
    return oben * (1 - ty) + unten * ty;
  }

  // Feld (Spalte, Zeile) eines Blocks
  const feldVon = (bx, block, feld, max) => Math.min(max - 1, ((bx * block) / feld) | 0);

  // Papierhelligkeit je Feld = hellster gemittelter Block im Feld, zweimal geglättet.
  // umgekehrt: dasselbe für das umgekehrte Bild (hellster Block = dunkelster im Original)
  function papierRaster(bm, block, feld, fb, fh, umgekehrt) {
    const { mittel, bb, bh } = bm;
    const raster = new Float32Array(fb * fh);
    for (let y = 0; y < bh; y++) {
      const fy = feldVon(y, block, feld, fh);
      for (let x = 0; x < bb; x++) {
        const k = fy * fb + feldVon(x, block, feld, fb);
        const m = umgekehrt ? 255 - mittel[y * bb + x] : mittel[y * bb + x];
        if (m > raster[k]) raster[k] = m;
      }
    }
    return glaette(glaette(raster, fb, fh), fb, fh);
  }

  // Wo ist der Grund dunkler als die Schrift (heller Text auf dunklem oder farbigem Grund)?
  // Je Feld (mit seinen Nachbarn): Liegt der Median der Blöcke nahe am dunkelsten Block,
  // ist der Grund dunkel. Felder ohne Schrift übernehmen die Entscheidung ihrer Nachbarn.
  // Ergebnis: Gewicht je Feld (0 = normal, 1 = umkehren, dazwischen = Rand) oder null.
  function umkehrRaster(bm, block, feld, fb, fh) {
    const { mittel, bb, bh } = bm;
    const n = fb * fh;
    // Je Feld: dunkelster und hellster Block sowie ein Histogramm der Blöcke (32 Stufen) für den Median
    const fMin = new Float32Array(n).fill(255), fMax = new Float32Array(n), hist = new Uint16Array(n * 32);
    for (let y = 0; y < bh; y++) {
      const fy = feldVon(y, block, feld, fh);
      for (let x = 0; x < bb; x++) {
        const k = fy * fb + feldVon(x, block, feld, fb), m = mittel[y * bb + x];
        if (m < fMin[k]) fMin[k] = m;
        if (m > fMax[k]) fMax[k] = m;
        hist[k * 32 + Math.min(31, (m / 8) | 0)]++;
      }
    }
    let wahl = new Int8Array(n); // 1 = umkehren, 0 = normal, -1 = unklar
    let irgendwo = false;
    const summe = new Uint32Array(32);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fb; x++) {
      // Feld mit seinen Nachbarn: Spanne und Median aller Blöcke
      let min = 255, max = 0, anzahl = 0;
      summe.fill(0);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || xx < 0 || yy >= fh || xx >= fb) continue;
        const k = yy * fb + xx;
        if (fMin[k] < min) min = fMin[k];
        if (fMax[k] > max) max = fMax[k];
        for (let s = 0; s < 32; s++) { summe[s] += hist[k * 32 + s]; anzahl += hist[k * 32 + s]; }
      }
      const k = y * fb + x;
      if (max - min < 40) { wahl[k] = -1; continue; }
      let median = 0;
      for (let s = 0, z = 0; s < 32; s++) { z += summe[s]; if (z * 2 >= anzahl) { median = s * 8 + 4; break; } }
      wahl[k] = (median - min) / (max - min) < 0.5 ? 1 : 0;
      if (wahl[k] === 1) irgendwo = true;
    }
    if (!irgendwo) return null;
    // Unklare Felder nach der Mehrheit der Nachbarn füllen (von außen nach innen)
    for (let runde = 0; runde < 60; runde++) {
      let offen = 0;
      const neu = wahl.slice();
      for (let y = 0; y < fh; y++) for (let x = 0; x < fb; x++) {
        const k = y * fb + x;
        if (wahl[k] !== -1) continue;
        let ja = 0, nein = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy < 0 || xx < 0 || yy >= fh || xx >= fb) continue;
          const w = wahl[yy * fb + xx];
          if (w === 1) ja++; else if (w === 0) nein++;
        }
        if (ja + nein) neu[k] = ja > nein ? 1 : 0; else offen++;
      }
      wahl = neu;
      if (!offen) break;
    }
    const gewicht = new Float32Array(n);
    for (let k = 0; k < n; k++) gewicht[k] = wahl[k] === 1 ? 1 : 0;
    return glaette(gewicht, fb, fh);
  }

  // Graustufen; bei „Dokument“ zusätzlich Schatten ausgleichen und Kontrast verstärken:
  // 1. Bereiche mit hellem Text auf dunklem Grund finden; dort wird die Helligkeit umgekehrt,
  // 2. Papierhelligkeit je Feld schätzen und jeden Punkt dadurch teilen (Papier → weiß, auch im Schatten),
  // 3. Tonwerte spreizen: Papier → weiß, Schrift → schwarz, Mitteltöne etwas dunkler.
  function filtere(ctx, b, h, modus) {
    if (modus === 'farbe') return;
    const bild = ctx.getImageData(0, 0, b, h);
    const d = bild.data;
    const n = b * h;
    const grau = new Uint8ClampedArray(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) grau[i] = grauwert(d, j);

    if (modus === 'dokument') {
      const feld = Math.max(8, Math.round(Math.max(b, h) / 40));
      const block = Math.max(2, Math.round(feld / 4));
      const fb = Math.ceil(b / feld), fh = Math.ceil(h / feld);
      const bm = blockMittel(grau, b, h, block);
      const papier = papierRaster(bm, block, feld, fb, fh, false);
      const umkehr = umkehrRaster(bm, block, feld, fb, fh);
      const papierUm = umkehr && papierRaster(bm, block, feld, fb, fh, true);
      // Am Rand eines dunklen Bereichs je Block entscheiden: Median der Umgebung (5 × 5 Blöcke)
      // näher am dunklen Grund → umkehren. Der Median folgt Kanten und übersieht einzelne Schriftzüge.
      let blockUm = null;
      if (umkehr) {
        const { mittel, bb, bh } = bm;
        blockUm = new Uint8Array(bb * bh);
        const werte = [];
        for (let y = 0; y < bh; y++) for (let x = 0; x < bb; x++) {
          const px = Math.min(b - 1, x * block + (block >> 1)), py = Math.min(h - 1, y * block + (block >> 1));
          const w = zwischen(umkehr, fb, fh, feld, px, py);
          if (w <= 0.02) continue;
          if (w > 0.98) { blockUm[y * bb + x] = 1; continue; }
          werte.length = 0;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy >= 0 && xx >= 0 && yy < bh && xx < bb) werte.push(mittel[yy * bb + xx]);
          }
          werte.sort((p, q) => p - q);
          const hell = zwischen(papier, fb, fh, feld, px, py), dunkel = 255 - zwischen(papierUm, fb, fh, feld, px, py);
          blockUm[y * bb + x] = werte[werte.length >> 1] < (hell + dunkel) / 2 ? 1 : 0;
        }
      }

      const verlauf = new Uint32Array(256);
      for (let y = 0; y < h; y++) {
        const zeile = ((y / block) | 0) * bm.bb;
        for (let x = 0; x < b; x++) {
          const i = y * b + x;
          const v = blockUm && blockUm[zeile + ((x / block) | 0)]
            ? Math.min(255, ((255 - grau[i]) * 255) / Math.max(8, zwischen(papierUm, fb, fh, feld, x, y))) | 0
            : Math.min(255, (grau[i] * 255) / Math.max(8, zwischen(papier, fb, fh, feld, x, y))) | 0;
          grau[i] = v;
          verlauf[v]++;
        }
      }
      const perzentil = (p) => {
        let summe = 0;
        for (let v = 0; v < 256; v++) { summe += verlauf[v]; if (summe >= n * p) return v; }
        return 255;
      };
      // Papier liegt jetzt bei etwa 255; leichte Schwankungen (Rest-Schatten, Rauschen) werden ganz weiß.
      // Schwarzpunkt höchstens bei halber Papierhelligkeit, damit wenig Text kein Rauschen verstärkt.
      const weiss = Math.max(60, Math.round(perzentil(0.5) * 0.9));
      const schwarz = Math.min(perzentil(0.02), Math.round(weiss * 0.5));
      const tabelle = new Uint8ClampedArray(256);
      for (let v = 0; v < 256; v++) {
        const t = Math.min(1, Math.max(0, (v - schwarz) / (weiss - schwarz)));
        tabelle[v] = Math.round(255 * t ** 1.5);
      }
      for (let i = 0; i < n; i++) grau[i] = tabelle[grau[i]];
    }

    for (let i = 0, j = 0; i < n; i++, j += 4) { d[j] = grau[i]; d[j + 1] = grau[i]; d[j + 2] = grau[i]; }
    ctx.putImageData(bild, 0, 0);
  }

  // ---------- Seiten ----------

  // quelle: etwas Zeichenbares (Canvas, Bild); original: Blob oder Promise auf Blob
  function seiteAnlegen(quelle, breite, hoehe, original) {
    const klein = verkleinert(quelle, breite, hoehe, VORSCHAU);
    const seite = { id: neueId(), breite, hoehe, original: null, bilder: {}, laden: {}, fertig: false, inDb: false };
    seite.bereit = Promise.all([original, alsBlob(klein, 0.8)]).then(([o, v]) => {
      seite.original = o;
      seite.vorschauBlob = v;
      seite.bilder.farbe = URL.createObjectURL(v);
      seite.fertig = true;
      return seite;
    });
    return seite;
  }

  // Seite aus dem Speicher (schon fertig)
  function seiteAusSpeicher(d) {
    const seite = {
      id: d.id, breite: d.breite, hoehe: d.hoehe, original: d.original, vorschauBlob: d.vorschau,
      bilder: { farbe: URL.createObjectURL(d.vorschau) }, laden: {}, fertig: true, inDb: true,
    };
    seite.bereit = Promise.resolve(seite);
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
        filtere(ctx, c.width, c.height, modus);
        const url = URL.createObjectURL(await alsBlob(c, 0.85));
        seite.bilder[modus] = url;
        return url;
      });
    }
    return seite.laden[modus];
  }

  // Neue Seite in den Scan; gespeichert wird, sobald sie fertig ist
  function seiteEinfuegen(seite) {
    const s = scan;
    if (ersetzen !== null && s.seiten[ersetzen]) {
      const alt = s.seiten[ersetzen];
      s.zuLoeschen.push(alt.id);
      seiteFreigeben(alt);
      s.seiten[ersetzen] = seite;
    } else {
      s.seiten.push(seite);
    }
    seite.bereit.then(() => sichern(s), () => {});
  }

  function seiteEntfernen(seite, s = scan) {
    const i = s ? s.seiten.indexOf(seite) : -1;
    if (i >= 0) s.seiten.splice(i, 1);
    if (s) s.zuLoeschen.push(seite.id);
    seiteFreigeben(seite);
  }

  function neuerScan(art) {
    const jetzt = Date.now();
    const d = new Date(jetzt);
    return {
      id: neueId(), art, kontrast: art === 'buch' ? 'dokument' : 'farbe',
      name: `${art === 'buch' ? 'Buch' : 'Scan'} ${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}. ${zwei(d.getHours())}:${zwei(d.getMinutes())}`,
      angelegt: jetzt, geaendert: jetzt, seiten: [], zuLoeschen: [], inDb: false,
    };
  }

  // Scan schließen (bleibt gespeichert) und zur Startseite
  function scanSchliessen() {
    if (scan) scan.seiten.forEach(seiteFreigeben);
    scan = null;
    ersetzen = null;
    grossLauf++;
    rasterLauf++;
    zeige('ansicht-start');
    listeAufbauen();
  }

  // ---------- Speichern ----------

  // Speichert den Scan; läuft je Scan nur einmal gleichzeitig, Aufrufe dazwischen werden zusammengefasst
  function sichern(s = scan) {
    if (!s || s.geloescht) return Promise.resolve();
    if (s.wartet) return s.lauf;
    s.wartet = true;
    s.lauf = (s.lauf || Promise.resolve()).then(() => { s.wartet = false; return sichernJetzt(s); });
    letzteSicherung = s.lauf;
    return s.lauf;
  }

  async function sichernJetzt(s) {
    if (s.geloescht) return;
    const neu = s.seiten.filter((p) => p.fertig && !p.inDb);
    const bleiben = s.seiten.filter((p) => p.inDb || neu.includes(p));
    const loeschen = s.zuLoeschen.splice(0);
    if (!bleiben.length && !s.inDb) return; // leerer Scan: nichts speichern
    s.geaendert = Date.now();
    const eintrag = {
      id: s.id, art: s.art, name: s.name, kontrast: s.kontrast, angelegt: s.angelegt, geaendert: s.geaendert,
      seiten: bleiben.map((p) => p.id),
      bytes: bleiben.reduce((summe, p) => summe + p.original.size + p.vorschauBlob.size, 0),
    };
    try {
      Speicher.dauerhaftAnfragen();
      await Speicher.sichern({
        scan: eintrag,
        neu: neu.map((p) => ({ id: p.id, breite: p.breite, hoehe: p.hoehe, original: p.original, vorschau: p.vorschauBlob })),
        loeschen,
      });
      neu.forEach((p) => { p.inDb = true; });
      s.inDb = bleiben.length > 0;
    } catch (fehler) {
      console.warn('Speichern:', fehler);
      s.zuLoeschen.unshift(...loeschen);
      if (fehler && fehler.name === 'QuotaExceededError' && neu.length) {
        // Neue Seiten passen nicht mehr: wieder entfernen, Rest erneut speichern
        neu.forEach((p) => seiteEntfernen(p, s));
        zeigeHinweis('Speicher voll – Seite nicht gespeichert. Bitte alte Scans löschen.');
        ansichtAktualisieren(s);
        await sichernJetzt(s);
      } else {
        zeigeHinweis('Speichern fehlgeschlagen');
      }
    }
  }

  // Nach dem Entfernen von Seiten wegen vollem Speicher die sichtbare Ansicht anpassen
  function ansichtAktualisieren(s) {
    if (s !== scan) return;
    if (!$('ansicht-kamera').hidden) {
      zaehlerAktualisieren();
      const letzte = s.seiten[s.seiten.length - 1];
      if (letzte && letzte.bilder.farbe) $('letzte').src = letzte.bilder.farbe; else $('letzte').hidden = true;
    } else if (!s.seiten.length) {
      scanSchliessen();
    } else if (!$('ansicht-uebersicht').hidden) {
      zeigeUebersicht();
    } else if (!$('ansicht-gross').hidden) {
      zeigeGross();
    }
  }

  // ---------- Live-Kamera (Buch / Dokument) ----------

  const video = $('video');
  const ausloeser = $('ausloeser');
  const puffer = [neuesCanvas(1, 1), neuesCanvas(1, 1)]; // zwei wechselnde Aufnahme-Flächen
  const belegt = [false, false];
  let strom = null;

  function kameraOeffnen() {
    rasterLauf++; // Vorschaubilder der Übersicht nicht weiterrechnen, Auslöser bleibt frei
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

  // Rückmeldung beim Auslösen: kurzes Aufhellen, Ränder leuchten auf, Zähler hüpft
  function blitz() {
    ['blitz', 'rahmen', 'zaehler'].forEach((id) => {
      const el = $(id);
      el.classList.remove('an');
      void el.offsetWidth; // Animation neu starten
      el.classList.add('an');
    });
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
    if (!scan || scan.seiten.length === 0) { scanSchliessen(); return; }
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
      if (scan) scan.seiten.forEach(seiteFreigeben);
      scan = neuerScan('normal');
    }
    if (!scan) return;
    ersetzen = ziel === 'ersetzen' ? fotoIndex : null;
    seiteEinfuegen(seite);
    if (ziel === 'ersetzen') { ersetzen = null; zeigeGross(); } else zeigeUebersicht();
  });

  // ---------- Startseite ----------

  $('start-buch').addEventListener('click', () => {
    scan = neuerScan('buch');
    ersetzen = null;
    kameraOeffnen();
  });

  // Die Kamera öffnet sich sofort; erst ein Foto führt zur Übersicht (Abbrechen ändert nichts)
  $('start-normal').addEventListener('click', () => fotoAufnehmen('neu'));

  // ---------- Übersicht ----------

  let rasterLauf = 0;

  function zeigeUebersicht() {
    zeige('ansicht-uebersicht');
    $('ueb-name').textContent = scan.name;
    const teil = (t) => { const e = document.createElement('span'); e.className = 'ganz'; e.textContent = t; return e; };
    $('ueb-anzahl').replaceChildren(teil(ARTEN[scan.art]), ' · ', teil(seitenText(scan.seiten.length)));
    $('ueb-plus').textContent = scan.art === 'buch' ? '+ Seiten' : '+ Seite';
    $('ueb-speichern').hidden = scan.art !== 'normal';
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
      if (lauf !== rasterLauf) return;
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
      sichern();
      zeigeUebersicht();
    });
  });

  $('ueb-plus').addEventListener('click', () => {
    if (scan.art === 'buch') kameraOeffnen();
    else fotoAufnehmen('anhaengen');
  });

  // Zurück zur Liste: alles ist schon gespeichert
  $('ueb-zurueck').addEventListener('click', scanSchliessen);

  // Umbenennen
  const umbenennen = $('umbenennen');
  const namensFeld = $('name-feld');
  $('ueb-name').addEventListener('click', () => {
    if (!scan) return;
    namensFeld.value = scan.name;
    $('name-sichern').disabled = false;
    umbenennen.returnValue = '';
    umbenennen.showModal();
    namensFeld.select();
  });
  namensFeld.addEventListener('input', () => { $('name-sichern').disabled = !namensFeld.value.trim(); });
  namensFeld.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (namensFeld.value.trim()) umbenennen.close('ja');
  });
  umbenennen.addEventListener('close', () => {
    const name = namensFeld.value.trim().slice(0, 80);
    if (umbenennen.returnValue !== 'ja' || !name || !scan) return;
    scan.name = name;
    $('ueb-name').textContent = name;
    sichern();
  });

  // Ganzen Scan löschen
  $('scan-loeschen').addEventListener('click', async () => {
    const s = scan;
    if (!s || !(await frage(`„${s.name}“ mit ${seitenText(s.seiten.length)} löschen?`, 'Löschen'))) return;
    s.geloescht = true;
    try { await s.lauf; } catch { /* egal, wird ohnehin gelöscht */ }
    try {
      await Speicher.scanLoeschen(s.id, [...s.seiten.map((p) => p.id), ...s.zuLoeschen]);
    } catch (fehler) {
      console.warn(fehler);
      zeigeHinweis('Löschen fehlgeschlagen');
    }
    scanSchliessen();
  });

  // ---------- Großansicht ----------

  let grossLauf = 0;

  function zeigeGross() {
    if (!scan || scan.seiten.length === 0) { scanSchliessen(); return; }
    aktuell = Math.min(aktuell, scan.seiten.length - 1);
    rasterLauf++;
    zeige('ansicht-gross');
    const seite = scan.seiten[aktuell];
    $('gross-titel').textContent = `Seite ${aktuell + 1} von ${scan.seiten.length}`;
    $('gross-masse').textContent = `${seite.breite} × ${seite.hoehe}`;
    $('gross-vor').disabled = aktuell === 0;
    $('gross-nach').disabled = aktuell === scan.seiten.length - 1;
    $('gross-sichern').hidden = scan.art !== 'normal';
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
      filtere(ctx, cv.width, cv.height, scan.kontrast);
    } catch (fehler) {
      console.warn(fehler);
    }
  }

  function tausche(ziel) {
    const s = scan.seiten;
    if (ziel < 0 || ziel >= s.length) return;
    [s[aktuell], s[ziel]] = [s[ziel], s[aktuell]];
    aktuell = ziel;
    sichern();
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
    sichern();
    if (scan.seiten.length === 0) { scanSchliessen(); return; }
    zeigeUebersicht();
  });

  // ---------- Speichern als PDF oder Bilder (normaler Scan) ----------

  const EXPORT_MAX = 3000; // lange Seite der gespeicherten Bilder in px
  let exportLauf = 0;
  let exportDateien = null;
  const fortschritt = $('fortschritt');

  // Unerlaubte Zeichen im Dateinamen durch „-“ ersetzen
  const dateiname = (t) => t.replace(/[\\/:*?"<>|]/g, '-').trim() || 'Scan';

  // Seite in der gewählten Kontrast-Stufe als JPEG (höchstens 3000 px, ohne Foto-Metadaten)
  async function seiteAlsJpeg(seite, modus) {
    await seite.bereit;
    const img = await ladeBild(seite.original);
    const f = Math.min(1, EXPORT_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = neuesCanvas(Math.max(1, Math.round(img.naturalWidth * f)), Math.max(1, Math.round(img.naturalHeight * f)));
    const ctx = c.getContext('2d', { willReadFrequently: modus !== 'farbe' });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    filtere(ctx, c.width, c.height, modus);
    const blob = await alsBlob(c, 0.85);
    c.width = 1; c.height = 1; // Speicher freigeben
    return blob;
  }

  // art: 'pdf' | 'bilder'; nummern: Seiten (Index), die gespeichert werden
  async function speichern(art, nummern) {
    const s = scan;
    const lauf = ++exportLauf;
    exportDateien = null;
    $('fortschritt-teilen').hidden = true;
    $('fortschritt-abbrechen').hidden = false;
    fortschritt.showModal();
    const name = dateiname(s.name);
    const modus = s.kontrast;
    try {
      const jpegs = [];
      for (let k = 0; k < nummern.length; k++) {
        $('fortschritt-text').textContent = `Wird erstellt … Seite ${k + 1} von ${nummern.length}`;
        await new Promise((ok) => setTimeout(ok, 30)); // Anzeige aktualisieren, Abbrechen zulassen
        if (lauf !== exportLauf) return;
        jpegs.push(await seiteAlsJpeg(s.seiten[nummern[k]], modus));
      }
      if (lauf !== exportLauf) return;
      if (art === 'pdf') {
        const daten = await Promise.all(jpegs.map((b) => b.arrayBuffer().then((a) => new Uint8Array(a))));
        exportDateien = [new File([PDF.erzeugen(daten, s.name)], `${name}.pdf`, { type: 'application/pdf' })];
      } else {
        exportDateien = jpegs.map((b, k) => new File([b], `${name} – Seite ${nummern[k] + 1}.jpg`, { type: 'image/jpeg' }));
      }
      if (lauf !== exportLauf) return;
      $('fortschritt-text').textContent = art === 'pdf' ? 'PDF ist fertig.' : (exportDateien.length === 1 ? 'Bild ist fertig.' : `${exportDateien.length} Bilder sind fertig.`);
      $('fortschritt-teilen').hidden = false;
    } catch (fehler) {
      console.warn('Speichern:', fehler);
      if (lauf !== exportLauf) return;
      exportLauf++;
      fortschritt.close();
      zeigeHinweis('Speichern fehlgeschlagen – bitte noch einmal versuchen');
    }
  }

  function herunterladen(dateien) {
    dateien.forEach((datei, k) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(datei);
        a.download = datei.name;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      }, k * 300);
    });
  }

  $('fortschritt-teilen').addEventListener('click', async () => {
    const dateien = exportDateien;
    exportDateien = null;
    fortschritt.close();
    if (!dateien) return;
    if (navigator.canShare && navigator.canShare({ files: dateien })) {
      try {
        await navigator.share({ files: dateien });
      } catch (fehler) {
        if (fehler.name !== 'AbortError') { console.warn('Teilen:', fehler); zeigeHinweis('Teilen fehlgeschlagen – bitte noch einmal versuchen'); }
      }
    } else {
      herunterladen(dateien);
    }
  });

  // Abbrechen (Knopf oder Escape): Erzeugen beenden, nichts weiter tun
  $('fortschritt-abbrechen').addEventListener('click', () => fortschritt.close());
  fortschritt.addEventListener('close', () => { exportLauf++; $('fortschritt-teilen').hidden = true; });

  $('ueb-speichern').addEventListener('click', () => {
    if (!scan || !scan.seiten.length) return;
    const wahl = $('speichern-wahl');
    wahl.returnValue = '';
    wahl.addEventListener('close', () => {
      if (!scan) return;
      const alle = scan.seiten.map((_, k) => k);
      if (wahl.returnValue === 'pdf') speichern('pdf', alle);
      else if (wahl.returnValue === 'bilder') speichern('bilder', alle);
    }, { once: true });
    wahl.showModal();
  });

  $('gross-sichern').addEventListener('click', () => { if (scan) speichern('bilder', [aktuell]); });

  // ---------- Startseite: Meine Scans ----------

  let listenLauf = 0;
  let listenUrls = [];

  async function listeAufbauen() {
    const lauf = ++listenLauf;
    try { await letzteSicherung; } catch { /* Fehler wurde schon gemeldet */ }
    let alle;
    try {
      alle = await Speicher.alleScans();
    } catch (fehler) {
      console.warn('Liste:', fehler);
      alle = [];
    }
    if (lauf !== listenLauf) return;
    alle.sort((a, b) => b.geaendert - a.geaendert);
    listenUrls.forEach((u) => URL.revokeObjectURL(u));
    listenUrls = [];

    $('meine-leer').hidden = alle.length > 0;
    const bytes = alle.reduce((summe, a) => summe + (a.bytes || 0), 0);
    $('belegt').textContent = bytes < 1e6 ? 'Belegt: unter 1 MB' : `Belegt: ${Math.round(bytes / 1e6)} MB`;

    const zeilen = alle.map((eintrag) => {
      const zeile = document.createElement('button');
      zeile.type = 'button';
      zeile.className = 'scan-zeile';
      const img = new Image();
      img.alt = '';
      const text = document.createElement('span');
      text.className = 'scan-text';
      const name = document.createElement('strong');
      name.textContent = eintrag.name;
      const art = document.createElement('span');
      art.textContent = ARTEN[eintrag.art];
      const info = document.createElement('span');
      info.textContent = `${seitenText(eintrag.seiten.length)} · ${datum(eintrag.geaendert)}`;
      text.append(name, art, info);
      zeile.append(img, text);
      zeile.addEventListener('click', () => scanOeffnen(eintrag.id));
      return [eintrag, img, zeile];
    });
    $('meine-liste').replaceChildren(...zeilen.map((z) => z[2]));

    for (const [eintrag, img] of zeilen) {
      try {
        const d = await Speicher.seiteLaden(eintrag.seiten[0]);
        if (lauf !== listenLauf) return;
        if (!d) continue;
        const url = URL.createObjectURL(d.vorschau);
        listenUrls.push(url);
        img.src = url;
      } catch { /* kein Vorschaubild */ }
    }
  }

  async function scanOeffnen(id) {
    let d;
    try {
      d = await Speicher.scanLaden(id);
    } catch (fehler) {
      console.warn(fehler);
    }
    if (!d) { zeigeHinweis('Scan konnte nicht geöffnet werden'); listeAufbauen(); return; }
    scan = {
      id: d.id, art: d.art, name: d.name, kontrast: d.kontrast, angelegt: d.angelegt, geaendert: d.geaendert,
      seiten: d.seitenDaten.map(seiteAusSpeicher), zuLoeschen: [], inDb: true,
    };
    ersetzen = null;
    zeigeUebersicht();
  }

  listeAufbauen();

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
