# Plan F06
## Ansatz
**Neue Datei `app/export.js`**, ohne Bibliothek. Sie enthält:
- das Zusammenfügen der Seiten-Texte zu Absätzen, wahlweise mit Seitenmarken. Absätze über eine Seitengrenze werden verbunden.
- die .md-Erzeugung mit Teilung ab 90 000 Wörtern.
- eine EPUB-3-Erzeugung: XHTML-Abschnitte je 20 Seiten, `nav.xhtml`, `content.opf`.
- einen kleinen ZIP-Schreiber (unkomprimiert, mit CRC32, `mimetype` zuerst).

Alles läuft synchron und schnell. So kann das Teilen-Menü direkt im Tipp öffnen. Verweigert Safari das, nutzt die App wie in F04 „Fertig – Teilen“.

**Bilder löschen:** Die Seiten-Einträge in der IndexedDB behalten `id`, Maße und Text, aber `original` und `vorschau` werden `null`. In der App heißt eine solche Seite `ohneBild`. Der Scan-Eintrag bekommt `nurText`, wenn alle Seiten ohne Bild sind. „Belegt“ rechnet nur noch vorhandene Bilder.

`scan.js` zeigt:
- „Exportieren“ (nur Buch), die Auswahl, die Warnung bei fehlendem Text und die Frage nach dem Teilen
- den Knopf „Bilder löschen, Text behalten“
- Text-Kacheln, eine reine Text-Großansicht und die Liste mit „nur Text“

Die Texterkennung überspringt Seiten ohne Bild.

## Aufgaben
- [x] 1. `export.js`: Absätze und Seitenmarken, .md mit Titel und Hinweis, Teilung, EPUB 3 (container, opf, nav, Abschnitte) und ZIP mit CRC32 → AK4, AK5, AK6, AK7, AK12
- [x] 2. `speicher.js`: `bilderLoeschen(ids)`. `scan.js`: Seiten ohne Bild laden, Bytes und `nurText` beim Sichern, Texterkennung überspringt Seiten ohne Bild → AK10, AK11
- [x] 3. Oberfläche:
  - Knopf „Exportieren“ und Auswahl-Dialog
  - Warnung „N Seiten haben noch keinen Text“
  - Teilen mit Rückfall auf „Fertig – Teilen“ und Herunterladen
  - Frage „Bilder jetzt löschen?“ und Knopf „Bilder löschen, Text behalten“

  → AK1, AK2, AK3, AK9
- [x] 4. „Nur Text“:
  - Text-Kacheln und Großansicht nur mit Text, ohne „Neu aufnehmen“
  - Kontrast und Sprache ausgeblendet
  - Liste mit Text-Symbol und „nur Text“
  - „+ Seiten“ bleibt

  → AK10, AK11
- [x] 5. CSS, `sw.js`, Version 0.6.0. Prüfen in Chrome:
  - Inhalt der .md (Hinweis, Marken, Absatz über Seitengrenze)
  - Teilung mit einem großen Buch
  - EPUB prüfen: ZIP-Struktur, XML gültig, Apple Books bzw. Mac-Vorschau öffnet es
  - Tempo bei 300 Seiten
  - Bilder löschen, „Belegt“ sinkt, Neustart
  - offline, 375 px hell und dunkel, F03–F05-Regression

  → alle AK

## Annahmen
- Die Frage nach dem Löschen nutzt den vorhandenen Rückfrage-Dialog. Der Nein-Knopf heißt dort „Behalten“.
- Satzende für die Verbindung über Seitengrenzen: „.“, „!“, „?“, „:“ oder „…“, auch gefolgt von einem Anführungszeichen.
- EPUB: Kennung `urn:uuid` aus der Scan-ID, `dcterms:modified` ist der Zeitpunkt des Exports.
- Die Text-Kachel zeigt die ersten ca. 120 Zeichen der Seite.
- Abweichung von der Spec (dort nachgetragen): Ein Absatz läuft über die Seitengrenze, sobald die Seite nicht mit einem Satzende endet. Die Bedingung „nächste Seite beginnt klein“ ist entfallen, weil deutsche Fortsetzungen oft mit einem großgeschriebenen Hauptwort beginnen („… über die [S. 2] Seitengrenze …“).
- Ein Teil enthält höchstens 88 000 Wörter Text. Mit Seitenmarken und Hinweis bleibt jede Datei unter 90 000 Wörtern.
- Der Knopf „Bilder löschen, Text behalten“ wird mit der Statuszeile der Texterkennung aktualisiert. Er erscheint, sobald der letzte Text fertig ist, nicht erst beim nächsten Öffnen (beim Test aufgefallen).
- Die .md hat den Typ `text/markdown`. Lehnt iOS diesen Typ beim Teilen ab, wird die Datei heruntergeladen (siehe AK2).

## Prüfung beim Bau (Chrome, 375 px, v0.6.0)
- **Knöpfe und Warnung:**
  - Buch: „+ Seiten“ und „Exportieren“ stehen nebeneinander, je 52 × 167 px. „Speichern“ (F04) ist ausgeblendet.
  - Die Auswahl zeigt „Text für Claude (.md)“, „E-Book für Kindle (EPUB)“ und „Abbrechen“.
  - Sofort nach der Aufnahme kommt die Frage „3 Seiten haben noch keinen Text – trotzdem exportieren?“. Die Datei enthält dann dreimal „[S. N: noch kein Text]“.
- **.md:**
  - Datei „Buch 18.11. 21-37.md“ mit Titel und Hinweis (genauer Wortlaut aus AK4) sowie den Marken [S. 1] bis [S. 3] und Absätzen.
  - Gegen Testdaten geprüft: Ein Absatz über die Seitengrenze wird verbunden, ein Zitat-Ende („.“) gilt als Satzende, fehlende Seiten werden markiert.
  - 320 Seiten mit je 300 Wörtern ergeben 2 Teile (88 541 und 8 209 Wörter). Im Teilen-Vorgang kommen beide zusammen.
- **EPUB:**
  - ZIP gültig (Python `zipfile.testzip`). `mimetype` steht zuerst, unkomprimiert, ohne Zusatzfeld, an der richtigen Stelle.
  - Alle XML- und XHTML-Dateien sind wohlgeformt. Sprache `de`, Autor „Buchscanner“, Inhaltsverzeichnis „Seiten 1–20“ usw. (15 Abschnitte bei 300 Seiten).
  - Ohne „[?“, „[S.“ und Hinweis.
  - Der offizielle Prüfer `epubcheck` konnte nicht laufen, weil kein Java installiert ist.
- **Teilen:**
  - Abbruch: keine Frage, nichts ändert sich.
  - Safari verweigert: „Datei ist fertig.“ mit „Fertig – Teilen“. Danach wird geteilt, dann kommt die Lösch-Frage.
  - Ohne Teilen-Funktion wird die Datei heruntergeladen.
- **Bilder löschen:**
  - Nach dem Teilen: „Bilder jetzt löschen? Der Text bleibt erhalten (spart ca. 9 MB).“ (Behalten / Bilder löschen). Der Knopf in der Übersicht zeigt dieselbe Frage.
  - Danach: Kontrast und Sprache sind ausgeblendet, es gibt 3 Text-Kacheln mit dem Textanfang, „Exportieren“ bleibt.
  - Die Großansicht zeigt nur das Textfeld, ohne „Bild | Text | Beides“ und ohne „Neu aufnehmen“. „Nach vorne“ und „Löschen“ bleiben.
  - Die Liste zeigt „Buch / Dokument · nur Text“ mit dem Symbol „¶“. „Belegt“ sinkt von 9 MB auf „unter 1 MB“. Alles bleibt nach einem Neustart so.
- **Weiterscannen:** „+ Seiten“ bei „Nur Text“ ergibt eine neue Seite mit Bild, die erkannt wird („alle 4 Seiten“). Danach sind Kontrast und „Bilder löschen“ wieder da.
- **Tempo:** 300 Seiten als .md in 24 ms (2 Teile), als EPUB in 18 ms.
- **Allgemein:** kein waagerechter Bildlauf, keine Fremd-Anfragen, keine Konsolenfehler, dunkel ok.
- **Regression:** F03 und F04 bestanden.
- **Nicht prüfbar am Mac:**
  - das echte iOS-Teilen-Menü (Claude-App, „An Kindle senden“)
  - Öffnen in Apple Books und am Kindle (AK8)
  - ob Safari das Teilen nach dem Tipp in der Auswahl direkt zulässt
