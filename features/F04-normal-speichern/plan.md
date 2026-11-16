# Plan F04
## Ansatz
Neue Datei `app/pdf.js` mit einem kleinen eigenen PDF-Erzeuger, ohne Bibliothek (entschieden 2026-11-16). Er bekommt JPEG-Bilder und baut daraus ein PDF mit je einer A4-Seite. Das Bild wird unverändert übernommen (DCTDecode), eingepasst und zentriert. Breite, Höhe und Farbkanäle liest er aus dem JPEG-Kopf.

In `scan.js` kommt ein Abschnitt „Speichern“ dazu:
- Je Seite wird das Original geladen, auf höchstens 3000 px verkleinert, mit `filtere()` in der gewählten Kontrast-Stufe bearbeitet und als JPEG 0,85 gespeichert. Das Neu-Kodieren über Canvas entfernt die EXIF-Daten.
- Die Seiten entstehen nacheinander mit kurzer Pause dazwischen. So bleibt die Anzeige bedienbar, und „Abbrechen“ wirkt.
- Danach öffnet „Fertig – Teilen“ das Teilen-Menü mit `navigator.share({ files })`. Kann der Browser keine Dateien teilen, werden sie heruntergeladen.

Die Oberfläche bekommt den Knopf „Speichern“ in der Fußleiste (nur normaler Scan), einen Auswahl-Dialog, einen Fortschritts-Dialog und „Seite als Bild sichern“ in der Großansicht.

## Aufgaben
- [x] 1. `pdf.js`: JPEG-Kopf lesen (Maße, Kanäle), PDF-Objekte, A4 hoch/quer, Einpassen, Titel (UTF-16), xref → AK4
- [x] 2. `scan.js`: Seite in voller Größe rendern (max. 3000 px, Filter, JPEG 0,85), Dateinamen, Erzeugen mit Fortschritt und Abbrechen, Teilen bzw. Herunterladen, Fehlermeldung → AK3, AK5, AK6, AK7, AK8, AK9, AK10, AK11
- [x] 3. Oberfläche: Fußleiste mit zwei Knöpfen (nur normaler Scan), Auswahl-Dialog, Fortschritts-Dialog, „Seite als Bild sichern“ in der Großansicht (nur normaler Scan), CSS, `sw.js` um `pdf.js` ergänzen, Version 0.4.0 → AK1, AK2, AK3, AK12
- [x] 4. Prüfen in Chrome: PDF öffnen und mit der Mac-Vorschau (Quick Look) ansehen, Seitenzahl, A4 hoch/quer, Titel, keine EXIF-Daten, Größe je Seite, 10 Seiten „Dokument“ ≤ 10 s, Abbrechen, Herunterladen, offline, 375 px hell/dunkel → alle AK

## Annahmen
- Die Auswahl und der Fortschritt sind `<dialog>`-Fenster wie die Rückfrage, keine eigene Ansicht.
- „Fertig – Teilen“ übergibt alle Dateien auf einmal an das Teilen-Menü. Bei Bildern zeigt iOS dann „N Bilder sichern“.
- Herunterladen am Mac: eine Datei je Bild, nacheinander.
- In der Großansicht zeigt „Seite als Bild sichern“ denselben Fortschritt (Seite 1 von 1).
- Dateigröße: Bei „Farbe“ wird ein realistisches 12-MP-Foto bei 3000 px etwa 0,9 MB groß. Bei „Dokument“ sind es nur 0,23–0,27 MB, weil weißes Papier sich stark komprimieren lässt. Das liegt etwas unter den 0,3 MB aus AK6, ist aber gewollt (kleiner ist besser, die Schrift bleibt scharf).
- Wird der Fortschritt geschlossen, wird „Fertig – Teilen“ ausgeblendet. So bleibt beim nächsten Speichern kein alter Knopf stehen (beim Test aufgefallen).

## Prüfung beim Bau (Chrome mit Test-Kamera, 375 px, v0.4.0)
- Buch-Scan: kein „Speichern“ in der Übersicht, kein „Seite als Bild sichern“ in der Großansicht.
- Normaler Scan: „+ Seite“ und „Speichern“ stehen nebeneinander, je 52 px hoch und 167 px breit, ohne waagerechten Bildlauf. Die Auswahl zeigt „Als PDF (Dateien)“, „Als Bilder (Fotos)“ und „Abbrechen“.
- PDF mit 3 Seiten (hoch, quer mit eingebauten Standortdaten, Testbild):
  - „Wird erstellt … Seite 1 von 3“, nach 1,1–1,4 s „PDF ist fertig.“ und „Fertig – Teilen“.
  - Datei „Scan 16.11. 20-04.pdf“ mit 389 KB. Die Apple-Vorschau öffnet sie: 3 Seiten, A4 hoch, quer, quer, Titel „Scan 16.11. 20:04“, Bilder eingepasst.
  - xref und Objekte sind korrekt.
- Bilder („Grau“): „… – Seite 1.jpg“ bis „Seite 3.jpg“, je 2250 × 3000 bzw. 3000 × 2250. In der Großansicht ergibt „Seite als Bild sichern“ nur „… – Seite 2.jpg“.
- Standortdaten: In keiner Datei findet sich die Exif-Kennung oder der eingebaute Standort-Text.
- Abbrechen:
  - Teilen-Menü abgebrochen: kein Hinweis, der Scan ist unverändert.
  - „Abbrechen“ bei Seite 3 von 10: Der Dialog ist zu, es entsteht keine Datei.
- Erzeugungsfehler (Bild nicht erzeugbar): „Speichern fehlgeschlagen – bitte noch einmal versuchen“, die App läuft weiter.
- Ohne Teilen-Funktion wird die Datei heruntergeladen.
- 10 Seiten in „Dokument“ als PDF (realistische 12-MP-Fotos):
  - neu aufgenommen 7,4–8,1 s, nach dem Neuladen aus dem Speicher 7,4 s
  - PDF 2,3 MB, der Fortschritt zählt jede Seite hoch
  - Ein einzelner früherer Lauf brauchte 48 s. Das ließ sich in drei weiteren Läufen nicht wiederholen, vermutlich war der iMac ausgelastet. Beim Testen mit reinen Rauschbildern (3 MB je Seite) waren es 32 s. Das kommt bei echten Seiten nicht vor.
- Der Scan bleibt nach dem Speichern in „Meine Scans“. Offline klappt das Speichern, es gibt keine Fremd-Anfragen, hell und dunkel sind ok.
- Nicht prüfbar am Mac: das echte iOS-Teilen-Menü („In Dateien sichern“, „N Bilder sichern“), das Tempo und der Arbeitsspeicher auf dem iPhone, Fotos mit 48 MP.
