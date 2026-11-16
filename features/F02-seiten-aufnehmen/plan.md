# Plan F02
## Ansatz
Alles läuft weiter auf einer Seite, ohne Bibliotheken. `index.html` bekommt drei weitere Ansichten: Kamera, Übersicht und Großansicht. Dazu kommt ein Bestätigungsfenster (`<dialog>`). Es wird immer nur eine Ansicht gezeigt. Neue Datei `app/scan.js`: Sie enthält den Scan im Arbeitsspeicher (`{ art, kontrast, seiten: [{ id, original: Blob, breite, hoehe, vorschau: Canvas 300 px }] }`), die Live-Kamera (`getUserMedia`, 3840 × 2160 angefragt, Bild per Canvas als JPEG 0,9), die iPhone-Kamera (`<input type=file accept=image/* capture=environment>`), die Übersicht, die Großansicht und die Kontrast-Filter. Den Kontrast rechnet die App mit Canvas-Pixeln: „Grau“ als Luminanz, „Dokument“ mit Schattenausgleich (Papierhelligkeit je Feld schätzen und herausrechnen) und danach Tonwertspreizung (Papier → weiß, Schrift → schwarz). Für die Vorschau gilt das auf 300 px, für die Großansicht auf höchstens 1600 px. Das Original bleibt unverändert. `app.js` behält F01: Version, Service Worker und Update. `sw.js` cached zusätzlich `scan.js`.

## Aufgaben
- [x] 1. Scan-Daten und Bildfunktionen in `scan.js`: Seite aus Blob anlegen (Maße, Vorschau), Kontrast-Filter Grau/Dokument, Bild in Canvas laden und verkleinern → AK3, AK15
- [x] 2. Live-Kamera: öffnen/schließen, Auslöser mit Aufblitzen, Zähler, letzte Vorschau, zwei wechselnde Aufnahme-Canvas (kein Tipp geht verloren, Speicher bleibt klein), Fehlermeldung bei fehlender Erlaubnis, Abschalten im Hintergrund und Neustart beim Zurückkehren, „Fertig“ → AK1, AK2, AK3, AK4, AK5, AK6, AK17
- [x] 3. iPhone-Kamera über das Datei-Feld: Start, „+ Seite“, Abbrechen ändert nichts → AK7, AK8, AK9
- [x] 4. Übersicht: Kopf mit Art und Seitenzahl, Raster mit 3 Spalten und Nummern, Kontrast-Umschalter mit Voreinstellung, Speicher-Hinweis, „+ Seiten“ bzw. „+ Seite“, „Schließen“ mit Rückfrage → AK6, AK8, AK10, AK15, AK16
- [x] 5. Großansicht: „Seite X von Y“, Maße, Pfeile (ausgegraut am Rand), Löschen mit Rückfrage, Neu aufnehmen (Live-Kamera für ein Bild bzw. iPhone-Kamera) → AK11, AK12, AK13, AK14
- [x] 6. CSS für alle Ansichten (Kamera immer dunkel, Hell/Dunkel sonst, Safe-Area, kein waagerechter Bildlauf), `sw.js` um `scan.js` ergänzen, Version 0.2.0 → AK18
- [x] 7. Prüfen in Chrome mit Test-Kamera (`--use-fake-device-for-media-stream`): 100 Aufnahmen, Fehlerfall ohne Erlaubnis, Datei-Feld, Ordnen/Löschen/Kontrast, offline, Fremd-Anfragen, Screenshots → alle AK

## Annahmen
- Der Start-Knopf „Normaler Scan“ öffnet die Kamera, bevor eine andere Ansicht erscheint. Erst nach „Foto benutzen“ wechselt die App zur Übersicht. So ändert ein Abbruch nichts, auch wenn Safari dabei kein Ereignis meldet.
- Tippt man auf den Auslöser, solange beide Aufnahme-Canvas noch beim Umwandeln sind (wenige 100 ms), wird der Tipp nicht gezählt und der Auslöser wirkt kurz ausgegraut. So entsteht nie eine halbe Seite.
- Beim normalen Scan ist das Original die Fotodatei der iPhone-Kamera selbst (volle Auflösung, keine Neukomprimierung).
- Die Kamera-Ansicht nimmt Hochformat an. Dreht man das iPhone, nimmt die App das Kamerabild so, wie Safari es liefert.
- Kein Wake Lock in F02. Wenn der Bildschirm beim Test dunkel wird, kommt es nach Rückmeldung dazu (offene Frage in der Spec).
- Die Startknöpfe zeigen nicht mehr „Kommt bald“. Der Hinweis-Balken bleibt für Fehlermeldungen (z. B. „Foto konnte nicht gelesen werden“).
- „Dokument“: Die Seite wird in etwa 40 × 40 Felder geteilt. Je Feld zählt der hellste gemittelte Block als Papierhelligkeit, geglättet und weich überblendet. Danach wird jeder Punkt durch die Papierhelligkeit geteilt, das macht Schatten weiß. Bei großen dunklen Flächen (Fotos, Tisch im Bild) werden diese hell und fleckig. Ränder abschneiden kommt mit F07.
- Kopfleisten-Knöpfe „Schließen“ und „‹ Zurück“ sind 44 px hoch (iOS-Standard), die Bearbeiten-Knöpfe 48 px.
- `werkzeuge/pruefen.mjs` prüft „Kommt bald“ nicht mehr, weil es den Hinweis nicht mehr gibt.

## Prüfung beim Bau (Chrome mit Test-Kamera, 375 px)
- Live-Kamera nach 0,7 s offen, Test-Kamera liefert 3840 × 2160. 100 Seiten am Stück aufgenommen: Der Auslöser war jedes Mal nach höchstens 0,48 s wieder frei, und es kam zu keinem Absturz.
- Übersicht mit 101 Seiten: 3 Spalten, „Dokument“ voreingestellt. Der Wechsel auf Grau dauerte 1,4 s, auf Farbe 0,1 s. Kein waagerechter Bildlauf.
- Ordnen, Löschen (mit Nachrücken der Nummern), Neu aufnehmen und Abbrechen, „+ Seiten“, Verwerfen und „Fertig“ bei 0 Seiten verhalten sich wie in der Spec.
- Normaler Scan über das Datei-Feld: Abbrechen ändert nichts. Volle Auflösung 4032 × 3024 bleibt erhalten, „+ Seite“ und „Ersetzen“ funktionieren.
- Kamera verweigert: Die App zeigt „Kein Zugriff auf die Kamera“, „Zurück“ führt zur Startseite.
- Offline klappt, keine Fremd-Anfragen, keine Konsolenfehler.
- Nicht prüfbar am Mac: echte iPhone-Kamera (Auflösung, Hochformat), Speicher bei 100 echten 4K-Fotos, iOS-Kamera-App, Bildschirm-Abdunkeln.

## Nachbesserung nach QA (2026-11-16, v0.2.1)
- [x] 8. Fehler 1: Schattenausgleich im Filter „Dokument“ → AK15
- [x] 9. Fehler 2: Update-Leiste in der Live-Kamera ausblenden, Hinweise dort oben zeigen, Rückfrage vor „Neu laden“ bei ungespeicherten Seiten (`window.vorNeuLaden` in scan.js, genutzt von app.js) → AK2, AK18
- [x] 10. Wunsch: deutlichere Rückmeldung beim Auslösen (Ränder leuchten, Zähler hüpft) → AK2

## Nachbesserung v0.3.1 (2026-11-16): heller Text auf dunklem Grund
- [x] 11. Filter „Dokument“: Je Feld mit seinen Nachbarn wird der Median der Blöcke (über ein Histogramm) mit dem dunkelsten und dem hellsten Block verglichen. Liegt der Median nahe am dunklen Ende, ist der Grund dunkel. Felder ohne Schrift übernehmen die Entscheidung der Nachbarn. Am Rand eines dunklen Bereichs entscheidet der Median aus 5 × 5 Blöcken, so bleibt die Kante scharf. Dunkle Bereiche werden umgekehrt und danach wie Papier behandelt (Schatten weg, Schrift schwarz) → AK19
- Geprüft an Testseiten: weiße Schrift auf Dunkelblau, Rot und Mittelblau sowie eine weiße Seite mit dunklem Kasten werden schwarz auf weiß. Gelbes Papier, Seite mit Schatten und das echte Foto `seite.jpg` sehen aus wie vorher. Am Kasten bleiben nur winzige Eckpunkte.
- Dauer je Vorschaubild (300 px): Textseite ca. 4 ms (vorher 2,6 ms), dunkle Seite ca. 6 ms.
- Annahme: Fotos in einer Seite können bei „Dokument“ teils wie ein Negativ aussehen. Für Fotos sind „Farbe“ und „Grau“ da.
- Noch offen: Test mit den echten Seiten des Nutzers (dunkler bzw. bunter Hintergrund).
