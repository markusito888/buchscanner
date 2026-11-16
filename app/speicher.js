// Buchscanner – F03: dauerhafter Speicher auf dem iPhone (IndexedDB).
// Tabelle „scans“: { id, art, name, kontrast, angelegt, geaendert, seiten: [Seiten-IDs], bytes }
// Tabelle „seiten“: { id, breite, hoehe, original: Blob, vorschau: Blob }
// Tabelle „texte“ (F05): { id (= Seiten-ID), text, sicherheit, vonHand, sprache }
'use strict';
const Speicher = (() => {
  let db = null;

  function oeffnen() {
    if (!db) {
      db = new Promise((ok, fehler) => {
        const anfrage = indexedDB.open('buchscanner', 2);
        anfrage.onupgradeneeded = (e) => {
          const d = anfrage.result;
          if (e.oldVersion < 1) {
            d.createObjectStore('scans', { keyPath: 'id' });
            d.createObjectStore('seiten', { keyPath: 'id' });
          }
          if (e.oldVersion < 2) d.createObjectStore('texte', { keyPath: 'id' });
        };
        anfrage.onsuccess = () => ok(anfrage.result);
        anfrage.onerror = () => { db = null; fehler(anfrage.error); };
      });
    }
    return db;
  }

  // Führt arbeit(tabellen) in einer Transaktion aus; erfüllt sich erst, wenn alles geschrieben ist.
  async function transaktion(modus, arbeit) {
    const d = await oeffnen();
    return new Promise((ok, fehler) => {
      const tx = d.transaction(['scans', 'seiten', 'texte'], modus);
      let ergebnis;
      tx.oncomplete = () => ok(ergebnis);
      tx.onabort = () => fehler(tx.error || new DOMException('Abgebrochen', 'AbortError'));
      tx.onerror = (e) => e.preventDefault(); // Fehler kommt über onabort
      try {
        ergebnis = arbeit({ scans: tx.objectStore('scans'), seiten: tx.objectStore('seiten'), texte: tx.objectStore('texte') });
      } catch (e) {
        try { tx.abort(); } catch { /* schon beendet */ }
        fehler(e);
      }
    });
  }

  const wert = (anfrage, ziel, schluessel) => { anfrage.onsuccess = () => { ziel[schluessel] = anfrage.result; }; };

  // Alle Scans (ohne Bilder)
  function alleScans() {
    const box = {};
    return transaktion('readonly', (t) => { wert(t.scans.getAll(), box, 'liste'); return box; }).then((b) => b.liste || []);
  }

  // Ein Scan mit allen Seiten in Reihenfolge
  function scanLaden(id) {
    const box = { seiten: [] };
    return transaktion('readonly', (t) => {
      const a = t.scans.get(id);
      a.onsuccess = () => {
        box.scan = a.result;
        if (!a.result) return;
        a.result.seiten.forEach((sid, i) => wert(t.seiten.get(sid), box.seiten, i));
      };
      return box;
    }).then((b) => (b.scan ? { ...b.scan, seitenDaten: b.seiten.filter(Boolean) } : null));
  }

  // Eine Seite (für das Vorschaubild in der Liste)
  function seiteLaden(id) {
    const box = {};
    return transaktion('readonly', (t) => { wert(t.seiten.get(id), box, 'seite'); return box; }).then((b) => b.seite || null);
  }

  // Neue Seiten schreiben, alte entfernen und den Scan-Eintrag schreiben (oder löschen) – alles oder nichts
  function sichern({ scan, neu = [], loeschen = [] }) {
    return transaktion('readwrite', (t) => {
      neu.forEach((s) => t.seiten.put(s));
      loeschen.forEach((id) => { t.seiten.delete(id); t.texte.delete(id); });
      if (scan.seiten.length) t.scans.put(scan);
      else t.scans.delete(scan.id);
    });
  }

  function scanLoeschen(id, seitenIds) {
    return transaktion('readwrite', (t) => {
      seitenIds.forEach((sid) => { t.seiten.delete(sid); t.texte.delete(sid); });
      t.scans.delete(id);
    });
  }

  // ---------- Texte (F05) ----------

  // Alle Texte (für Zähler und „Belegt“)
  function alleTexte() {
    const box = {};
    return transaktion('readonly', (t) => { wert(t.texte.getAll(), box, 'liste'); return box; }).then((b) => b.liste || []);
  }

  // Texte zu bestimmten Seiten: Map Seiten-ID → Eintrag
  function texteLaden(ids) {
    const box = {};
    return transaktion('readonly', (t) => { ids.forEach((id) => wert(t.texte.get(id), box, id)); return box; })
      .then((b) => new Map(Object.entries(b).filter(([, v]) => v)));
  }

  // Text speichern. Ergebnis der Erkennung (vonHand = false) überschreibt keine Handkorrektur
  // und wird nur gespeichert, solange die Seite noch existiert. Ergebnis: true, wenn gespeichert.
  function textSetzen(eintrag) {
    const box = { ok: false };
    return transaktion('readwrite', (t) => {
      const seite = t.seiten.getKey(eintrag.id);
      seite.onsuccess = () => {
        if (seite.result === undefined) return;
        if (eintrag.vonHand) { t.texte.put(eintrag); box.ok = true; return; }
        const alt = t.texte.get(eintrag.id);
        alt.onsuccess = () => {
          if (alt.result && alt.result.vonHand) return;
          t.texte.put(eintrag);
          box.ok = true;
        };
      };
      return box;
    }).then((b) => b.ok);
  }

  function texteLoeschen(ids) {
    return transaktion('readwrite', (t) => ids.forEach((id) => t.texte.delete(id)));
  }

  // Safari um dauerhaften Speicher bitten (einmal pro Start reicht)
  let gebeten = false;
  function dauerhaftAnfragen() {
    if (gebeten) return;
    gebeten = true;
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }

  return { alleScans, scanLaden, seiteLaden, sichern, scanLoeschen, dauerhaftAnfragen, alleTexte, texteLaden, textSetzen, texteLoeschen };
})();
