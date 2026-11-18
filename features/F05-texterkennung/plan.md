# Plan F05
## Ansatz
**Bibliothek:** Tesseract.js 7.0.0 als feste Kopie in `app/vendor/tesseract/`. Dazu gehören:
- `tesseract.min.js` und `worker.min.js`
- die drei LSTM-Kerne: normal, SIMD und relaxed SIMD (je ca. 3,9 MB; ein Gerät lädt nur einen davon)
- die Sprachdaten `4.0.0_best_int` für Deutsch (1,3 MB), Englisch (3,0 MB) und Spanisch (2,1 MB)

Der Service Worker lädt diese Dateien erst beim ersten Gebrauch und legt sie in einen eigenen Cache, `texterkennung-7.0.0`. Dieser Cache bleibt bei App-Updates erhalten. Tesseract arbeitet in seinem Worker-Thread, die Bedienung bleibt frei.

**Daten:** Die IndexedDB bekommt Version 2 mit einer neuen Tabelle `texte`: `{ id (= Seiten-ID), text, sicherheit, vonHand, sprache }`. Der Scan-Eintrag bekommt `sprache` (Standard `deu`). Wird eine Seite oder ein Scan gelöscht, wird ihr Text mitgelöscht.

**Ablauf:** Die neue Datei `app/texterkennung.js` enthält die Warteschlange.
- Sie holt die nächste Buch-Seite ohne Text, zuerst aus dem offenen Scan, dann nach Änderungsdatum.
- Sie bereitet die Seite über eine Funktion aus `scan.js` auf: Fassung „Dokument“, lange Seite 2400 px.
- Sie erkennt die Seite, setzt den Text aus Absätzen, Zeilen und Wörtern zusammen (Trennstriche zusammenziehen, unsichere Wörter als „[?Wort]“) und speichert ihn, außer die Seite wurde inzwischen von Hand geändert.
- Sie pausiert bei offener Kamera und im Hintergrund und hält während der Arbeit den Bildschirm wach (Wake Lock).

`scan.js` zeigt Status, Sprache, „!“ und „Bild | Text | Beides“ an und speichert Korrekturen.

## Aufgaben
- [x] 1. Vendor-Dateien und Lizenz kopieren. Service Worker: eigener Cache für `vendor/tesseract/`, beim ersten Abruf füllen, bei Updates behalten → AK7, AK14
- [x] 2. `speicher.js`: DB-Version 2 (`texte`), Texte lesen, setzen (ohne Handkorrektur zu überschreiben) und löschen, Texte beim Löschen von Seiten und Scans mitlöschen, Sprache im Scan-Eintrag → AK4, AK9, AK14
- [x] 3. `texterkennung.js`: Warteschlange über alle Bücher mit Vorrang für den offenen Scan, Worker mit Sprachwechsel, Sprachdaten-Status (lädt, offline fehlt), Pause bei Kamera und Hintergrund, Wake Lock, Text aufbereiten mit „[?Wort]“ → AK1, AK2, AK3, AK4, AK7, AK11, AK11a, AK13
- [x] 4. Übersicht (nur Buch): Sprach-Umschalter mit Rückfrage bei Handkorrekturen, Statuszeile, „N Seiten unsicher“ mit Sprung, „!“ an den Vorschaubildern. Liste: „Text: X von Y“. „Belegt“ zählt den Text mit → AK1, AK3, AK5, AK6, AK10, AK14
- [x] 5. Großansicht (nur Buch): „Bild | Text | Beides“ (gemerkt), Textfeld, „Text wird noch erkannt …“, automatisch speichern (1 s nach dem Tippen und beim Verlassen) → AK8, AK9
- [x] 6. CSS, `sw.js` und Version 0.5.0. Prüfen in Chrome:
  - Testseite mit bekanntem Text (Fehlerquote, Tempo, Trennung, „[?Wort]“)
  - Neustart mitten in der Erkennung, Sprachwechsel, Korrektur bleibt
  - Kamera pausiert, offline ohne Sprachdaten
  - 375 px hell und dunkel, F02–F04-Regression

  → alle AK

## Annahmen
- Es werden die Sprachdaten `best_int` genommen, kleiner und gleich genau wie die großen `4.0.0` (gemessen: 2,1 % Fehler bei beiden). Es gibt keine Wahl für den Nutzer, weil es keinen Nachteil gibt.
- Erkannt wird die Fassung „Dokument“ bei 2400 px. Gemessen waren das 2,1 % Fehler und 3,4–4,6 s pro Seite am Mac, gegenüber 2,7 % und 8,8 s bei voller Auflösung und 4,9 % bei „Grau“.
- Wird die Kamera geöffnet, während gerade eine Seite erkannt wird, läuft diese eine Seite im Worker-Thread zu Ende. Eine neue Seite startet erst wieder nach „Fertig“. Das Vorbereiten (Filter) läuft nie, solange die Kamera offen ist.
- „Unsicher“ heißt: Sicherheit der Seite unter 60 % oder kein Text. Eine von Hand geänderte Seite gilt als geprüft. „[?Wort]“ steht bei einer Wort-Sicherheit unter 50 %.
- Trennstriche: Endet eine Zeile auf „-“ und beginnt die nächste mit einem Kleinbuchstaben, werden beide Teile ohne Strich verbunden. Bei einem Großbuchstaben („Ost-“ / „West“) bleibt der Strich ohne Leerzeichen.
- Die Wahl „Bild | Text | Beides“ liegt im `localStorage`. Fehlt er, gilt „Bild“.
- Tesseract-Lizenz (Apache 2.0) liegt bei den Dateien in `vendor/tesseract/`.
- Das Textfeld springt beim Wechsel der Seite an den Anfang (beim Test aufgefallen).

## Prüfung beim Bau (Chrome, 375 px, v0.5.0)
Die Live-Kamera wurde mit einer Video-Datei gespeist, die eine Buchseite mit bekanntem Text zeigt (Schatten, Unschärfe, Rauschen, Silbentrennung).
- **Start (AK1, AK2):** Bei offener Kamera wird nichts erkannt (0 Texte nach 4 s). Nach „Fertig“ läuft der Status so ab: „Sprachdaten werden geladen (einmalig) …“ → „Text: 0 von 3 Seiten“ → … → „Text: alle 3 Seiten erkannt“. Das dauerte 15–16 s inklusive Laden, also etwa 4–5 s pro Seite. Die Bildschirmsperre wurde einmal angefordert und am Ende freigegeben.
- **Qualität (AK11, AK12):**
  - Ganze Testseite: 0,0 % Zeichenfehler bei einer Sicherheit von 95 %.
  - Hochkant-Seite mit starkem Bindungsschatten (Vorab-Messung): 2,1 %.
  - 4 Absätze erkannt, keine Zeilenumbrüche innerhalb eines Absatzes.
  - Trennungen zusammengezogen, z. B. „Scha-“ + „tten“ → „Schatten“.
  - Unsichere Wörter stehen im Schatten als „[?…]“.
- **Korrektur (AK8, AK9):**
  - Voreinstellung „Bild“. „Text“ zeigt das Feld (17 px, 343 px breit, das Bild ist ausgeblendet), „Beides“ zeigt Bild 281 px und Text 222 px.
  - Eine Korrektur ist nach 1,5 s als `vonHand` gespeichert.
  - Nach einem Neustart sind Ansicht („Beides“) und Korrektur noch da.
- **Unsichere Seiten (AK10):** Sicherheit 30 % ergibt „!“ an Seite 3 und „1 Seite unsicher“. Ein Tipp führt zu „Seite 3 von 3“. Nach einer Korrektur ist das „!“ weg. Das Testmuster der Chrome-Kamera (kein Text) wird ebenfalls als unsicher erkannt.
- **Sprache (AK6, AK7):**
  - Wechsel auf Englisch: Die Rückfrage erscheint wegen der Korrektur, alle Texte werden gelöscht und auf Englisch neu erkannt (15 s).
  - Offline und Spanisch noch nicht geladen: „Für Spanisch einmal Internet nötig“. Wieder online, wird es geladen und erkannt.
  - Im Cache liegen nur der benötigte Kern (relaxed SIMD) und die gebrauchten Sprachen.
- **Neustart und Liste (AK3, AK4):** Ein Neustart bei „1 von 5“ setzt danach fort, bis „alle 5“ erkannt sind. Die Liste zeigt „Text: 1 von 5“, solange etwas fehlt.
- **Normaler Scan (AK5):** keine Sprache, kein Status, kein „Bild | Text | Beides“, keine Texte.
- **Löschen und Belegt (AK14):** „Scan löschen“ entfernt auch die Texte (0 übrig). „Belegt“ sinkt.
- **Allgemein (AK14):** Der Auslöser ist höchstens 0,3 s gesperrt. Kein waagerechter Bildlauf, keine Fremd-Anfragen, keine Konsolenfehler, hell und dunkel ok.
- **Regression:**
  - F03 und F04 sind bestanden.
  - Das Nachstellen von „Speicher voll“ mit `Storage.overrideQuotaForOrigin` greift in Chrome nicht mehr (die Grenze bleibt bei 10 GB, schon vor der Texterkennung). Deshalb wurde der Fehler direkt nachgestellt (`QuotaExceededError` beim Speichern). Die Meldung erscheint, die Seite wird verworfen, und die nächste Seite wird normal gespeichert.
- **Nicht prüfbar am Mac:** Tempo und Wärme am iPhone (AK13: 100 Seiten ≤ 15 min), echte Buchseiten des Nutzers, Wake Lock in iOS, welcher Kern dort geladen wird (vermutlich SIMD).

## Nachbesserung v0.5.1 (2026-11-17): gedrehte Seiten und Farbflächen
Beim iPhone-Test lieferten einige Seiten nur Zeichensalat. Sie bekamen zwar ein „!“, aber keinen brauchbaren Text. Ursache: Die Seite lag um 90° gedreht im Bild, weil das iPhone quer gehalten wurde, während die Hochformat-Sperre an war. Dazu kommt, dass Farbflächen im Rasterdruck nach dem Filter als Punktmuster stehen bleiben.
- [x] 7. Ist eine Seite unsicher (unter 70 %), versucht die App es erneut: um 90° gedreht, um 270° gedreht, geglättet gegen Rasterpunkte (klein und wieder groß rechnen, Faktor 0,35), auf dem Kopf. Das sicherste Ergebnis gewinnt, und die Drehung wird beim Text gemerkt. Fast leere Seiten (weniger als 3 Wörter) bekommen keine weiteren Versuche. → AK10, AK12
- [x] 8. Unsichere Texte aus Version 0.5.0, die noch keine Drehung gemerkt haben, werden einmal neu erkannt. Handkorrekturen bleiben unberührt. → AK4
- Gemessen:
  - Testseite um 90° gedreht: erkannt mit Drehung 90°, Sicherheit 90 %, 3 % Fehler, ca. 10–13 s pro Seite (zwei Durchgänge).
  - Orange Rasterfläche mit grobem Raster: Fehler von 42 % auf 12 % gesunken.
  - Normale Seiten: unverändert, 0 % Fehler, kein zusätzlicher Durchgang.
- Annahme: Die Anzeige des Bildes bleibt gedreht. Das Bild gerade zu drehen gehört zu F07 (Seiten gerade ziehen).

## Nachbesserung v0.5.2 (2026-11-18): Störzeichen
- [x] 9. Entfernt werden einzelne senkrechte Striche „|“ (Seitenrand, Bundsteg) und unsichere „Wörter“ ohne einen einzigen Buchstaben, etwa „[?;]“, „[?©]“ oder „[?2]“. Schon gespeicherte Texte, die nicht von Hand geändert wurden, bereinigt die App einmal beim Start. → AK11, AK11a
- Geprüft am Text vom iPhone-Screenshot des Nutzers: Alle Striche und Symbolreste sind weg. Echte unsichere Wörter wie „[?Schließlich.]“ bleiben markiert.
- Regression F05: unverändert, 0 % Fehler, gedrehte Seite 3 %.
- Annahme: Eine unsicher gelesene, wirklich gedruckte Zahl (z. B. eine Seitenzahl) kann dabei wegfallen. Für Zusammenfassungen ist das unkritisch.
