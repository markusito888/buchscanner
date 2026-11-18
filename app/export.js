// Buchscanner – F06: Text-Export eines Buchs als .md (für Claude) und als EPUB 3 (für Kindle).
// seiten: Liste { nr, text } in Reihenfolge; text = null, wenn die Seite noch keinen Text hat.
'use strict';
const Export = (() => {
  const TEIL_WOERTER = 88000; // Text je Teil; mit Marken und Hinweis bleibt jede Datei unter 90 000 Wörtern
  const ABSCHNITT_SEITEN = 20;
  const kodierer = new TextEncoder();

  const woerter = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  const satzEnde = (t) => /[.!?:…]["'“”»«›‹)]*$/.test(t.trim());

  // Absätze aller Seiten. Endet eine Seite nicht mit einem Satzende, läuft der Absatz auf der nächsten weiter.
  // mitMarken: „[S. N]“ am Seitenanfang und „[S. N: noch kein Text]“ für fehlende Seiten (.md)
  function absaetze(seiten, mitMarken) {
    const liste = [];
    for (const s of seiten) {
      const marke = `[S. ${s.nr}]`;
      if (s.text === null || s.text === undefined) {
        if (mitMarken) liste.push(`[S. ${s.nr}: noch kein Text]`);
        continue;
      }
      const teile = s.text.split(/\n\s*\n/).map((a) => a.replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (!teile.length) { if (mitMarken) liste.push(marke); continue; }
      const vorher = liste[liste.length - 1];
      teile.forEach((absatz, k) => {
        if (k === 0) {
          const weiter = vorher !== undefined && !satzEnde(vorher) && !/noch kein Text\]$/.test(vorher);
          if (weiter) liste[liste.length - 1] = `${vorher}${mitMarken ? ` ${marke}` : ''} ${absatz}`;
          else liste.push(mitMarken ? `${marke} ${absatz}` : absatz);
        } else {
          liste.push(absatz);
        }
      });
    }
    return liste;
  }

  // ---------- .md ----------

  const hinweis = (teil, teile) => `> Hinweis für Claude: Dieser Text stammt aus einer automatischen Texterkennung (Buchscanner-App). Wörter in [?…] wurden unsicher gelesen, Lücken und Fehler sind möglich. Bitte ergänze sie sinngemäß und kennzeichne größere Ergänzungen. Seitenangaben stehen als [S. 12]. ${teile > 1 ? `Dies ist Teil ${teil} von ${teile}. Fasse diesen Teil auf Deutsch zusammen.` : 'Fasse das Buch danach auf Deutsch zusammen.'}`;

  // Ergebnis: Liste { name (ohne Endung), text }
  function md(name, seiten) {
    // Seiten in Teile zu höchstens 90 000 Wörtern (an Seitengrenzen)
    const gruppen = [[]];
    let zaehler = 0;
    for (const s of seiten) {
      const w = woerter(s.text || '');
      if (zaehler + w > TEIL_WOERTER && gruppen[gruppen.length - 1].length) { gruppen.push([]); zaehler = 0; }
      gruppen[gruppen.length - 1].push(s);
      zaehler += w;
    }
    return gruppen.map((gruppe, k) => ({
      name: gruppen.length > 1 ? `${name} – Teil ${k + 1} von ${gruppen.length}` : name,
      text: `# ${name}${gruppen.length > 1 ? ` (Teil ${k + 1} von ${gruppen.length})` : ''}\n\n${hinweis(k + 1, gruppen.length)}\n\n${absaetze(gruppe, true).join('\n\n')}\n`,
    }));
  }

  // ---------- EPUB 3 ----------

  const xml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ohneMarken = (t) => t.replace(/\[\?([^\]]*)\]/g, '$1');
  const xhtml = (titel, sprache, koerper) => `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${sprache}" lang="${sprache}">\n<head><meta charset="UTF-8"/><title>${xml(titel)}</title></head>\n<body>\n${koerper}\n</body>\n</html>\n`;

  // sprache: 'deu' | 'eng' | 'spa'; id: eindeutige Kennung des Scans. Ergebnis: Blob (application/epub+zip)
  function epub(name, sprache, id, seiten) {
    const lang = { deu: 'de', eng: 'en', spa: 'es' }[sprache] || 'de';
    const abschnitte = [];
    for (let i = 0; i < seiten.length; i += ABSCHNITT_SEITEN) {
      const gruppe = seiten.slice(i, i + ABSCHNITT_SEITEN);
      const von = gruppe[0].nr, bis = gruppe[gruppe.length - 1].nr;
      const titel = von === bis ? `Seite ${von}` : `Seiten ${von}–${bis}`;
      const text = absaetze(gruppe.map((s) => ({ nr: s.nr, text: s.text == null ? null : ohneMarken(s.text) })), false);
      abschnitte.push({ datei: `teil-${abschnitte.length + 1}.xhtml`, titel, html: xhtml(titel, lang, `<h2>${xml(titel)}</h2>\n${text.map((p) => `<p>${xml(p)}</p>`).join('\n')}`) });
    }
    const jetzt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="kennung" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="kennung">urn:buchscanner:${xml(id)}</dc:identifier>
    <dc:title>${xml(name)}</dc:title>
    <dc:creator>Buchscanner</dc:creator>
    <dc:language>${lang}</dc:language>
    <meta property="dcterms:modified">${jetzt}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${abschnitte.map((a, k) => `    <item id="t${k + 1}" href="${a.datei}" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine>
${abschnitte.map((a, k) => `    <itemref idref="t${k + 1}"/>`).join('\n')}
  </spine>
</package>
`;
    const nav = xhtml(name, lang, `<nav epub:type="toc" id="toc"><h1>${xml(name)}</h1><ol>\n${abschnitte.map((a) => `<li><a href="${a.datei}">${xml(a.titel)}</a></li>`).join('\n')}\n</ol></nav>`);
    const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>
`;
    return zip([
      ['mimetype', 'application/epub+zip'],
      ['META-INF/container.xml', container],
      ['OEBPS/content.opf', opf],
      ['OEBPS/nav.xhtml', nav],
      ...abschnitte.map((a) => [`OEBPS/${a.datei}`, a.html]),
    ], 'application/epub+zip');
  }

  // ---------- ZIP (unkomprimiert) ----------

  const CRC_TABELLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(d) {
    let c = 0xffffffff;
    for (let i = 0; i < d.length; i++) c = CRC_TABELLE[(c ^ d[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // dateien: Liste [pfad, text]; die erste Datei (mimetype) bleibt vorne und unkomprimiert
  function zip(dateien, typ) {
    const teile = [], zentral = [];
    let lage = 0;
    const d = new Date();
    const zeit = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const tag = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const [pfad, inhalt] of dateien) {
      const name = kodierer.encode(pfad), daten = kodierer.encode(inhalt), crc = crc32(daten);
      const kopf = new DataView(new ArrayBuffer(30));
      kopf.setUint32(0, 0x04034b50, true); kopf.setUint16(4, 20, true); kopf.setUint16(6, 0x0800, true); kopf.setUint16(8, 0, true);
      kopf.setUint16(10, zeit, true); kopf.setUint16(12, tag, true); kopf.setUint32(14, crc, true);
      kopf.setUint32(18, daten.length, true); kopf.setUint32(22, daten.length, true); kopf.setUint16(26, name.length, true); kopf.setUint16(28, 0, true);
      teile.push(new Uint8Array(kopf.buffer), name, daten);
      const z = new DataView(new ArrayBuffer(46));
      z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint16(10, 0, true);
      z.setUint16(12, zeit, true); z.setUint16(14, tag, true); z.setUint32(16, crc, true); z.setUint32(20, daten.length, true); z.setUint32(24, daten.length, true);
      z.setUint16(28, name.length, true); z.setUint32(42, lage, true);
      zentral.push(new Uint8Array(z.buffer), name);
      lage += 30 + name.length + daten.length;
    }
    const groesse = zentral.reduce((s, t) => s + t.length, 0);
    const ende = new DataView(new ArrayBuffer(22));
    ende.setUint32(0, 0x06054b50, true); ende.setUint16(8, dateien.length, true); ende.setUint16(10, dateien.length, true);
    ende.setUint32(12, groesse, true); ende.setUint32(16, lage, true);
    return new Blob([...teile, ...zentral, new Uint8Array(ende.buffer)], { type: typ });
  }

  return { md, epub, absaetze };
})();
