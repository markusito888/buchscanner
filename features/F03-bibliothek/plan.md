# Plan F03
## Ansatz
Neue Datei `app/speicher.js` mit einer kleinen Hülle um IndexedDB, ohne Bibliothek. Die Datenbank `buchscanner` hat zwei Tabellen. `scans` enthält `{ id, art, name, kontrast, angelegt, geaendert, seiten: [Seiten-IDs in Reihenfolge], bytes }`. `seiten` enthält `{ id, breite, hoehe, original: Blob, vorschau: Blob }`.

`scan.js` speichert nach jeder Änderung mit `sichern(scan)`. Das läuft immer nur einmal gleichzeitig, und Aufrufe dazwischen werden zusammengefasst. Ein Durchgang ist eine einzige Transaktion: neue fertige Seiten schreiben, gelöschte Seiten entfernen, Scan-Eintrag mit Reihenfolge und Größe schreiben (bzw. löschen, wenn keine Seite übrig ist). Dadurch ist der Scan nie halb gespeichert.

Die Startseite bekommt die Liste „Meine Scans“ und die Zeile „Belegt“. Die Übersicht bekommt den Namen (Tipp → Umbenennen), „‹ Scans“ und „Scan löschen“.

## Aufgaben
- [x] 1. `speicher.js`: Datenbank öffnen, alle Scans lesen, Scan mit Seiten lesen, Seite lesen, Transaktion zum Sichern, Scan löschen; `navigator.storage.persist()` beim ersten Speichern → AK1, AK2, AK5
- [x] 2. `scan.js`: Seiten-IDs dauerhaft eindeutig, Scan mit id/name/angelegt, `sichern()` nach Aufnahme, Ersetzen, Löschen, Tauschen, Kontrast und Umbenennen. Leere Scans werden nicht gespeichert, und die letzte gelöschte Seite entfernt den Scan. Bei vollem Speicher die Meldung zeigen und die Seite wieder entfernen → AK1, AK2, AK3, AK4, AK13, AK15
- [x] 3. Startseite: Liste (zuletzt geändert zuerst, Vorschaubild, Name, Art, „X Seiten · Datum“), „Noch keine Scans“, „Belegt“, Scan öffnen → AK6, AK7, AK8, AK9, AK14
- [x] 4. Übersicht: „‹ Scans“ ohne Rückfrage, Name antippbar mit Dialog „Umbenennen“, „Scan löschen“ mit Rückfrage. Der Speicher-Hinweis und die Rückfrage vor „Neu laden“ fallen weg → AK10, AK11, AK12
- [x] 5. CSS, `sw.js` um `speicher.js` ergänzen, Version 0.3.0 → AK6, AK15
- [x] 6. Prüfen in Chrome: Neustart nach Aufnahme, Ändern und Neustart, leerer Scan, 10 Scans/500 Seiten, voller Speicher (`Storage.overrideQuotaForOrigin`), offline, Fremd-Anfragen, 375 px hell/dunkel → alle AK

## Annahmen
- „Belegt“ ist die Summe der gespeicherten Bilder (Originale und Vorschaubilder), gerechnet mit 1 MB = 1 000 000 Byte wie in den iPhone-Einstellungen. `navigator.storage.estimate()` ist in Safari zu ungenau.
- Das Vorschaubild in der Liste ist die erste Seite in Farbe, ohne Kontrast-Filter. Das geht schneller.
- „Neu aufnehmen“ bei vollem Speicher: Die neue Seite wird nicht gespeichert. Die alte Seite ist dann ebenfalls aus der Ansicht entfernt, bleibt aber im Speicher, bis der nächste Speichervorgang gelingt. Das ist ein seltener Fall, und eine aufwendigere Lösung lohnt sich nicht.
- Andere Schreibfehler als „Speicher voll“ zeigen „Speichern fehlgeschlagen“. Die App versucht es bei der nächsten Änderung erneut.
- „Scan löschen“ steht in der Übersicht unter dem Raster, über der festen Fußleiste.
- Die Kopfleiste-Knöpfe („‹ Scans“, „‹ Zurück“) sind jetzt 76 px statt 90 px breit, und die Unterzeile ist 13 px groß. So passt „Buch / Dokument · 220 Seiten“ bei 375 px in eine Zeile.

## Prüfung beim Bau (Chrome mit Test-Kamera, 375 px, v0.3.0)
- 5 Seiten aufgenommen, 2 s gewartet, neu geladen: Der Scan steht in der Liste mit 5 Seiten und dem Namen „Buch 16.11. 17:18“. `persist()` wurde beim ersten Speichern aufgerufen.
- Seite 1 nach hinten, Seite 4 gelöscht, Kontrast „Grau“, umbenannt in „Testbuch“, neu geladen: Reihenfolge, Name und Kontrast stimmen. Der leere Name ist gesperrt, höchstens 80 Zeichen.
- Weiterscannen nach dem Neuladen: Der Zähler startet bei „4 Seiten“, 6 Seiten bleiben gespeichert. „Neu aufnehmen“ bleibt nach dem Neuladen erhalten.
- Normaler Scan 4032 × 3024 bleibt nach dem Neuladen in voller Auflösung, Kontrast „Farbe“. Wird die letzte Seite gelöscht, verschwindet der Scan. „Fertig“ bei 0 Seiten legt keinen Eintrag an.
- „Scan löschen“ fragt „„Testbuch“ mit 6 Seiten löschen?“. Danach ist die Liste leer, auch nach dem Neuladen.
- Speicher voll (Quota per DevTools verkleinert): Die Meldung erscheint, der Zähler bleibt bei „1 Seite“, und die App läuft weiter.
- 10 Scans mit 500 Seiten (492 MB): Die Liste mit allen Vorschaubildern steht nach 0,08 s. Die Übersicht mit 200 Seiten zeigt die ersten Bilder nach 0,25 s.
- Auslöser während des Speichern (20 Aufnahmen): höchstens 12 ms gesperrt.
- Offline mit Liste, keine Fremd-Anfragen, kein waagerechter Bildlauf, hell und dunkel ok. In der Konsole stehen nur die erwarteten Warnungen beim Speicher-voll-Test.
- Nicht prüfbar am Mac: Safari-Speicher auf dem iPhone mit echten 4K-Fotos, Verhalten beim Wegwischen der App und bei „dauerhaftem Speicher“ in iOS.
