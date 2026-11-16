// Buchscanner – F03: dauerhafter Speicher auf dem iPhone (IndexedDB).
// Tabelle „scans“: { id, art, name, kontrast, angelegt, geaendert, seiten: [Seiten-IDs], bytes }
// Tabelle „seiten“: { id, breite, hoehe, original: Blob, vorschau: Blob }
'use strict';
const Speicher = (() => {
  let db = null;

  function oeffnen() {
    if (!db) {
      db = new Promise((ok, fehler) => {
        const anfrage = indexedDB.open('buchscanner', 1);
        anfrage.onupgradeneeded = () => {
          const d = anfrage.result;
          d.createObjectStore('scans', { keyPath: 'id' });
          d.createObjectStore('seiten', { keyPath: 'id' });
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
      const tx = d.transaction(['scans', 'seiten'], modus);
      let ergebnis;
      tx.oncomplete = () => ok(ergebnis);
      tx.onabort = () => fehler(tx.error || new DOMException('Abgebrochen', 'AbortError'));
      tx.onerror = (e) => e.preventDefault(); // Fehler kommt über onabort
      try {
        ergebnis = arbeit({ scans: tx.objectStore('scans'), seiten: tx.objectStore('seiten') });
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
      loeschen.forEach((id) => t.seiten.delete(id));
      if (scan.seiten.length) t.scans.put(scan);
      else t.scans.delete(scan.id);
    });
  }

  function scanLoeschen(id, seitenIds) {
    return transaktion('readwrite', (t) => {
      seitenIds.forEach((sid) => t.seiten.delete(sid));
      t.scans.delete(id);
    });
  }

  // Safari um dauerhaften Speicher bitten (einmal pro Start reicht)
  let gebeten = false;
  function dauerhaftAnfragen() {
    if (gebeten) return;
    gebeten = true;
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }

  return { alleScans, scanLaden, seiteLaden, sichern, scanLoeschen, dauerhaftAnfragen };
})();
