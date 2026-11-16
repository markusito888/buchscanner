# QA F03 – 2026-11-16
**Urteil:** fertig
**Ergebnis:** 15 von 15 AK bestanden (dazu F02-AK19 bestanden) · 0 Fehler · 4 geringe Beobachtungen
**Geprüft:** v0.3.1 lokal in Chrome headless, 375 px, Test-Kamera. Eigene Testskripte: `f03test.mjs` (Bau-Test, erneut ausgeführt) und `f03qa.mjs` (zusätzliche Prüfungen: Absturz, Größe, Grenzen, Update). Die F02-Regression lief mit `f02test2.mjs` und `f02qa.mjs` (angepasst an „‹ Scans“).

## Akzeptanzkriterien
- ✅ AK1 – Die App hat 5 Seiten aufgenommen, 2 s gewartet und ist dann neu geladen worden: Alle 5 Seiten sind in Reihenfolge da. Zusätzlich wurde der Renderer abgestürzt (`Page.crash`, wie ein Absturz) und die App neu geöffnet: 5 Seiten in der Liste, in der Datenbank 1 Scan und 5 Seiten, 0 fehlende und 0 verwaiste Einträge.
- ✅ AK2 – Normaler Scan mit Foto 4032 × 3024 (über das Datei-Feld), danach neu geladen: In der Großansicht steht „4032 × 3024“, Kontrast „Farbe“.
- ✅ AK3 – Seite 1 nach hinten verschoben, Seite 4 gelöscht, Kontrast auf „Grau“, neu geladen: Die Fingerabdrücke der Vorschaubilder stimmen genau mit der erwarteten Reihenfolge überein, und der Kontrast steht auf „Grau“. Auch „Neu aufnehmen“ ist nach dem Neuladen noch gespeichert.
- ✅ AK4 – „Fertig“ bei 0 Seiten: Die Liste bleibt leer. Wird die letzte Seite eines Scans gelöscht, geht die App zur Startseite, und der Scan ist aus der Liste verschwunden, auch nach dem Neuladen.
- ✅ AK5 – `navigator.storage.persist()` wird beim ersten Speichern genau einmal aufgerufen (Aufruf mitgezählt). Was Safari daraus macht, ist am Mac nicht sichtbar.
- ✅ AK6 – Die Überschrift „Meine Scans“ steht unter den Knöpfen, der zuletzt geänderte Scan oben. Eine Zeile ist 78 px hoch, das Vorschaubild 48 × 60 px. Sie zeigt Name, Art und „2 Seiten · 16.11.2026“.
- ✅ AK7 – Ohne Scans steht dort „Noch keine Scans“.
- ✅ AK8 – Drei Fotos zu je 8,9 MB ergeben „Belegt: 27 MB“. Nach dem Löschen einer Seite steht dort „Belegt: 18 MB“, nach „Scan löschen“ „Belegt: unter 1 MB“. Bei 10 Scans mit 500 Seiten: „Belegt: 492 MB“.
- ✅ AK9 – Ein Tipp auf die Zeile öffnet die Übersicht mit allen Seiten und dem gespeicherten Kontrast. Mit „+ Seiten“ startet der Zähler bei „4 Seiten“, die neuen Seiten hängen hinten an und bleiben nach dem Neuladen erhalten.
- ✅ AK10 – Der automatische Name lautet „Buch 16.11. 19:38“ bzw. „Scan 16.11. 17:17“. Beim Umbenennen gilt:
  - Bei leerem Feld ist „Sichern“ gesperrt.
  - „Abbrechen“ lässt den alten Namen stehen.
  - Von 100 getippten Zeichen kommen 80 an.
  - Die Eingabetaste sichert.
  - Der neue Name steht sofort in Übersicht und Liste.
  - Auch ein 80 Zeichen langer Name erzeugt keinen waagerechten Bildlauf, er wird mit „…“ gekürzt.
- ✅ AK11 – Oben links steht „‹ Scans“. Es führt ohne Rückfrage zur Startseite. Den Hinweis „Noch kein Speichern“ gibt es nicht mehr. Bei einer echten neuen Version (Service Worker getauscht) erscheint die Update-Leiste. „Neu laden“ lädt ohne Rückfrage neu, und die Scans sind danach unverändert da (Sonderfall „Update“).
- ✅ AK12 – „Scan löschen“ ist 48 px hoch und rot. Die Rückfrage lautet „„Testbuch“ mit 6 Seiten löschen?“. Danach ist der Scan weg, auch in der Datenbank, und „Belegt“ sinkt.
- ✅ AK13 – Speicher künstlich verkleinert (`Storage.overrideQuotaForOrigin`): Es erscheint „Speicher voll – Seite nicht gespeichert. Bitte alte Scans löschen.“. Der Zähler geht auf „1 Seite“ zurück, die App bleibt in der Kamera und funktioniert weiter. Ob Safari den Fehler genauso meldet (`QuotaExceededError`), ist nur am iPhone prüfbar.
- ✅ AK14 – 10 Scans mit 500 Seiten: Die Liste mit allen Vorschaubildern steht nach 0,1 s. Die Übersicht eines Scans mit 200 Seiten zeigt die ersten 9 Bilder nach 0,5–1,7 s (je nach Lauf, Test-Seiten aus Bildrauschen sind der ungünstigste Fall). Gemessen auf dem iMac, das iPhone ist eher schneller.
- ✅ AK15 – Offline startet die App mit Liste (Version 0.3.1). Es gibt keine Anfragen an fremde Server und keinen waagerechten Bildlauf, hell und dunkel sind ok. Der Auslöser war bei 20 Aufnahmen während des Speicherns höchstens 0,05–0,3 s gesperrt (Ziel ≤ 1 s).

**F02-AK19 (Nachbesserung v0.3.1)**
- ✅ AK19 – Testseiten mit weißer Schrift auf Dunkelblau, Rot und Mittelblau sowie eine weiße Seite mit dunklem Kasten werden schwarz auf weiß. Gelbes Papier und Seiten mit Schatten bleiben wie vorher. Gegenprobe an der echten Buchseite mit Schatten: „Farbe“, „Grau“ und „Dokument“ liefern genau dasselbe Bild wie die abgenommene Version 0.2.1 (0 abweichende Werte). Die echten Seiten des Nutzers liegen noch nicht vor (siehe unten).

## Sonderfälle
- ✅ Absturz mitten beim Speichern (3 Aufnahmen im Abstand von 60 ms, sofort danach abgestürzt): 1 der 3 neuen Seiten ist gespeichert, 2 fehlen. Das ist laut Spec zulässig. Der Scan öffnet sich normal, alle 6 Bilder laden, und es gibt keine fehlenden oder verwaisten Einträge.
- ✅ Update der App lässt die Scans unverändert (siehe AK11).
- ⚠️ App vom Home-Bildschirm löschen bzw. „Website-Daten löschen“: Am Mac nicht sinnvoll prüfbar. Erwartung laut Spec: Alles ist weg.
- ⚠️ Zwei Fenster gleichzeitig: wird laut Spec nicht unterstützt und wurde nicht geprüft.

## Regression F01/F02
- `pruefen.mjs`: hell/dunkel ok, Service Worker steuert die Seite, offline ok, keine Fremd-Anfragen.
- F02:
  - Kamera ohne Erlaubnis zeigt „Kein Zugriff auf die Kamera“, „Zurück“ führt zur Startseite.
  - Nummern rücken nach dem Löschen nach.
  - Die Update-Leiste ist in der Kamera ausgeblendet.
  - Rand und Zähler leuchten auf.
  - „Dokument“ auf der Schattenseite ergibt Papier 255 und Schrift 0.
- Keine Konsolenfehler im normalen Ablauf. Ein `TypeError` entstand nur, weil das Testskript einen versteckten Knopf auf der Startseite angeklickt hat. Für Nutzer ist das nicht erreichbar.

## Fehler
Keine.

## Weitere Beobachtungen
1. [gering] Wer einen Scan schließt und denselben Scan in weniger als ca. 1 s wieder öffnet, während die letzte Aufnahme noch gespeichert wird, kann eine Seite verlieren. Sie bleibt dann unsichtbar im Speicher liegen. Das ist nur aus dem Code abgeleitet, nicht nachgestellt, und in der Praxis sehr unwahrscheinlich.
2. [gering] Der antippbare Name in der Kopfleiste ist nur 28 px hoch. Das ist kleiner als die übrigen Tasten (44 px) und mit einer Hand etwas fummelig.
3. [gering] Bei dunklen Kästen auf hellen Seiten bleiben im Modus „Dokument“ an den Ecken winzige schwarze Punkte (ca. 10 px).
4. [gering] Fotos auf einer Seite können im Modus „Dokument“ teils wie ein Negativ aussehen. Das steht als Annahme im F02-Plan.

## Was du selbst kurz testen solltest
- Ein paar Buchseiten aufnehmen, die App ganz wegwischen (App-Umschalter, nach oben schieben) und neu öffnen: Der Scan steht in „Meine Scans“.
- Einen alten Scan öffnen, mit „+ Seiten“ weiterscannen, oben auf den Namen tippen, umbenennen, „‹ Scans“: Die Liste zeigt den neuen Namen und die neue Seitenzahl.
- Einen normalen Scan mit 2–3 Fotos machen, auf „Belegt“ achten, dann „Scan löschen“: Der Wert sinkt.
- Deine Seiten mit dunklem oder buntem Hintergrund in „Dokument“ ansehen: Die Schrift sollte schwarz auf weißem Grund stehen.
