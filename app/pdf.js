// Buchscanner – F04: kleines PDF aus JPEG-Bildern (eine A4-Seite je Bild, Bild eingepasst und zentriert).
// Die JPEG-Daten werden unverändert übernommen (DCTDecode), es wird nichts neu komprimiert.
'use strict';
const PDF = (() => {
  const A4 = [595.28, 841.89]; // Punkte (1/72 Zoll)
  const kodierer = new TextEncoder();

  // Breite, Höhe und Farbkanäle aus dem JPEG-Kopf (SOF-Marke)
  function jpegInfo(d) {
    if (d[0] !== 0xff || d[1] !== 0xd8) throw new Error('Kein JPEG');
    let i = 2;
    while (i + 9 < d.length) {
      if (d[i] !== 0xff) { i++; continue; }
      const marke = d[i + 1];
      if (marke >= 0xc0 && marke <= 0xcf && marke !== 0xc4 && marke !== 0xc8 && marke !== 0xcc) {
        return { hoehe: (d[i + 5] << 8) | d[i + 6], breite: (d[i + 7] << 8) | d[i + 8], kanaele: d[i + 9] };
      }
      i += 2 + ((d[i + 2] << 8) | d[i + 3]);
    }
    throw new Error('JPEG ohne Maße');
  }

  // Text als PDF-String in UTF-16 (für Umlaute im Titel)
  function textHex(t) {
    let hex = 'FEFF';
    for (let k = 0; k < t.length; k++) hex += t.charCodeAt(k).toString(16).padStart(4, '0').toUpperCase();
    return `<${hex}>`;
  }

  const zahl = (z) => (Math.round(z * 100) / 100).toString();

  // bilder: Liste von Uint8Array (JPEG); titel: Text. Ergebnis: Blob (application/pdf)
  function erzeugen(bilder, titel) {
    const teile = [];
    const lage = []; // Byte-Position je Objekt
    let laenge = 0;
    const schreibe = (x) => { const u = typeof x === 'string' ? kodierer.encode(x) : x; teile.push(u); laenge += u.length; };
    const objekt = (nr, ...inhalt) => { lage[nr] = laenge; schreibe(`${nr} 0 obj\n`); inhalt.forEach(schreibe); schreibe('\nendobj\n'); };

    schreibe('%PDF-1.4\n%âãÏÓ\n');
    const seitenNr = bilder.map((_, k) => 4 + k * 3);
    objekt(1, '<< /Type /Catalog /Pages 2 0 R >>');
    objekt(2, `<< /Type /Pages /Count ${bilder.length} /Kids [${seitenNr.map((n) => `${n} 0 R`).join(' ')}] >>`);
    objekt(3, `<< /Title ${textHex(titel)} /Producer (Buchscanner) >>`);

    bilder.forEach((jpeg, k) => {
      const info = jpegInfo(jpeg);
      const quer = info.breite > info.hoehe;
      const [sb, sh] = quer ? [A4[1], A4[0]] : A4;
      const f = Math.min(sb / info.breite, sh / info.hoehe);
      const b = info.breite * f, h = info.hoehe * f;
      const inhalt = `q ${zahl(b)} 0 0 ${zahl(h)} ${zahl((sb - b) / 2)} ${zahl((sh - h) / 2)} cm /Bild Do Q`;
      const n = seitenNr[k];
      objekt(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${zahl(sb)} ${zahl(sh)}] /Resources << /XObject << /Bild ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
      objekt(n + 1, `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`);
      const farbe = info.kanaele === 1 ? '/DeviceGray' : info.kanaele === 4 ? '/DeviceCMYK' : '/DeviceRGB';
      objekt(n + 2, `<< /Type /XObject /Subtype /Image /Width ${info.breite} /Height ${info.hoehe} /ColorSpace ${farbe} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream');
    });

    const anzahl = 4 + bilder.length * 3;
    const xref = laenge;
    let tabelle = `xref\n0 ${anzahl}\n0000000000 65535 f \n`;
    for (let nr = 1; nr < anzahl; nr++) tabelle += `${String(lage[nr]).padStart(10, '0')} 00000 n \n`;
    schreibe(tabelle);
    schreibe(`trailer\n<< /Size ${anzahl} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(teile, { type: 'application/pdf' });
  }

  return { erzeugen, jpegInfo };
})();
