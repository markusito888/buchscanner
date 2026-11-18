# QA F05 – 2026-11-18
**Urteil:** nicht fertig
**Ergebnis:** 13 von 15 AK bestanden, 1 durchgefallen (AK9), 1 nur am iPhone prüfbar (AK13) · 1 Fehler (mittel)
**Geprüft:** v0.5.2 lokal in Chrome headless, 375 px. Die Live-Kamera wurde mit einer Video-Datei gespeist, die eine Buchseite mit bekanntem Text zeigt, einmal normal und einmal um 90° gedreht. Verwendet wurden:
- `f05test.mjs`: Bau-Test, erneut ausgeführt
- `f05qa.mjs`: Startseite, Hintergrund, Vorrang, Speichern beim Verlassen, Neu aufnehmen, Altdaten, „Belegt“
- `f05neu.mjs`: Nachverfolgung des Fehlers
- `f05dreh.mjs`: gedrehte Seite

Dazu kommen der iPhone-Screenshot des Nutzers (v0.5.1) und die F03/F04-Regression vom Bau.

## Akzeptanzkriterien
- ✅ AK1 – Nach „Fertig“ startet die Erkennung von selbst: „Sprachdaten werden geladen (einmalig) …“ → „Text: 0 von 3 Seiten“ → „1 von 3“ → „2 von 3“ → „Text: alle 3 Seiten erkannt“, nach 13–20 s.
- ✅ AK2 – Die Erkennung läuft nur, wenn nichts anderes Vorrang hat:
  - Bei offener Kamera wird nichts erkannt (0 Texte nach 4 s).
  - Auf der Startseite läuft sie weiter, die Liste zählt mit („Text: 0 von 3“ → „1 von 3“ → „2 von 3“).
  - Im Hintergrund pausiert sie und gibt die Bildschirmsperre frei. In 12 s kam nur die schon laufende Seite dazu (3 → 4). Wieder sichtbar, ging es weiter bis 6 von 6, nach 6,7 s.
  - Die Bildschirmsperre wurde je Arbeitsphase genau einmal genommen und wieder freigegeben.
- ✅ AK3 – Das geöffnete Buch A hatte Vorrang vor dem neueren Buch B. Verlauf A/B: 0/0, 0/1 (B war schon begonnen), 1/1 … 6/1, 6/2. Die Liste zeigt „Text: X von Y“ nur, solange etwas fehlt.
- ✅ AK4 – Ein Neustart bei „1 von 5“ setzt danach fort, bis „alle 5 Seiten erkannt“ sind. Die Texte bleiben gespeichert.
- ✅ AK5 – Ein normaler Scan hat keine Sprache, keinen Status, kein „Bild | Text | Beides“ und keine Texte.
- ✅ AK6 – Beim Wechsel auf Englisch kommt mit Handkorrektur die Rückfrage „Text aller Seiten neu erkennen? Deine Korrekturen gehen verloren.“. Danach werden alle 3 Seiten auf Englisch neu erkannt.
- ✅ AK7 – Offline und Spanisch noch nicht geladen: „Für Spanisch einmal Internet nötig“, ohne Fehler. Wieder online, wird Spanisch geladen und erkannt. Im Cache liegen nur der benötigte Kern und die gebrauchten Sprachen. Die Dateien kommen von der App-Adresse.
- ✅ AK8 – Voreinstellung ist „Bild“.
  - „Text“: Feld mit 17 px Schrift über die ganze Breite (343 px), das Bild ist ausgeblendet.
  - „Beides“: Bild 281 px und Text 222 px hoch.
  - Die Wahl bleibt nach einem Neustart erhalten. Vor der Erkennung steht „Text wird noch erkannt …“.
- ❌ AK9 – Das Speichern selbst funktioniert:
  - Gespeichert nach 1,5 s und auch beim Verlassen der Seite vor Ablauf der Sekunde (Seite gewechselt nach 0,4 s, Korrektur in der DB).
  - Nach einem Neustart ist die Korrektur noch da, die Erkennung überschreibt sie nicht.

  Aber: Eine **neu aufgenommene Seite wird nicht neu erkannt** (siehe Fehler 1).
- ✅ AK10 – Bei Sicherheit 30 % erscheint „!“ an der Seite und „1 Seite unsicher“, ein Tipp führt zu „Seite 3 von 3“. Nach einer Korrektur ist das „!“ weg. Seiten ohne Text (Testmuster) gelten als unsicher.
- ✅ AK11 – Ergebnis der Aufbereitung:
  - 4 Absätze, keine Zeilenumbrüche innerhalb eines Absatzes.
  - Trennungen sind zusammengezogen („betrachtete“, „Schatten“, „schwerer“).
  - Störzeichen wie „|“ und Symbolreste sind entfernt, auch in alten Texten: „Vorne | [?;] [?©] hinten [?Wörtchen]“ → „Vorne hinten [?Wörtchen]“.
- ✅ AK11a – Unsichere Wörter stehen als „[?Wort]“ im Text, z. B. „[?Dicher“ auf der gedrehten Seite und „[?Schließlich.]“ auf dem iPhone-Screenshot.
- ✅ AK12 – Zeichenfehler:
  - Testseite: 0,0 % (Sicherheit 95 %)
  - Hochkant-Seite mit starkem Bindungsschatten: 2,1 %
  - um 90° gedrehte Seite: 3 %, die Drehung wurde automatisch gefunden

  Am iPhone (Screenshot des Nutzers, gedrehte Seite mit verzierter Initiale) ist der Text nach 0.5.1 überwiegend richtig. Der Nutzer hält die Qualität für Claude für ausreichend.
- ⚠️ AK13 – Am Mac 4–5 s pro Seite (gedrehte Seiten 10–13 s), unter dem Ziel von 8 s. Die 100 Seiten in höchstens 15 Minuten am iPhone kann nur der Nutzer messen.
- ✅ AK14 – „Scan löschen“ entfernt auch die Texte (0 übrig). „Belegt“ zählt den Text mit (3 Mio. Zeichen: 23 → 26 MB). Keine Fremd-Anfragen, kein waagerechter Bildlauf, hell und dunkel ok. Der Auslöser ist höchstens 0,3 s gesperrt.

## Sonderfälle
- ✅ Text bleibt bei seiner Seite: Seite 2 korrigiert und nach vorn verschoben. Seite 1 zeigt danach „SEITE ZWEI MARKE …“, und die DB stimmt.
- ✅ Unsichere Texte aus 0.5.0 ohne gemerkte Drehung werden einmal neu erkannt: von 20 % auf 95 %, Drehung 0.
- ✅ Gedrehte Seite (iPhone quer) und Rasterdruck: Die weiteren Versuche greifen (siehe AK12).
- ✅ App wird während einer Seite geschlossen: Diese Seite wird nach dem Neustart erkannt (AK4).

## Fehler
1. [mittel] **Neue Seite wird nicht erkannt, wenn sie erst nach dem Start der Erkennungsrunde fertig gespeichert ist**
   - Schritte: Buch mit erkannten Seiten öffnen, Großansicht, „Neu aufnehmen“, auslösen.
   - Erwartet: Nach wenigen Sekunden steht der neue Text da.
   - Tatsächlich: „Text wird noch erkannt …“ bleibt (auch nach 25 s), und für die neue Seite gibt es keinen Text in der DB. Erst ein Neustart der App oder ein Wechsel in den Hintergrund und zurück stößt die Erkennung wieder an.
   - Ursache: Die Kamera ruft beim Schließen die Erkennung auf. Zu diesem Zeitpunkt ist die neue Seite aber noch nicht gespeichert (Bild wird noch umgewandelt). Die Erkennung findet nichts, wartet, und nach dem Speichern weckt sie niemand.
   - Dasselbe kann beim Buch-Scan passieren, wenn man direkt nach der letzten Aufnahme „Fertig“ tippt: Die letzte Seite bleibt dann ohne Text.
   - Vorschlag: Nach jedem erfolgreichen Speichern neuer Seiten eines Buchs die Erkennung anstoßen.

## Weitere Beobachtungen
1. [gering] Geht die App in den Hintergrund, rechnet die gerade laufende Seite noch zu Ende. Die Rechnung läuft in einem eigenen Thread. iOS hält solche Arbeit im Hintergrund meist an, dann wird die Seite beim Zurückkehren fertig. Für den Nutzer ist das unkritisch.
2. [gering] Gedrehte Seiten werden richtig erkannt, aber weiter gedreht angezeigt (gehört zu F07).
3. Overengineering: keins. Die Versuche mit Drehung und Glättung kamen nach dem iPhone-Test des Nutzers dazu und stehen in der Spec unter „Entscheidungen“.

## Was du selbst kurz testen solltest
- Ein Buch mit 10–20 Seiten scannen, dabei nach der letzten Aufnahme sofort „Fertig“ tippen. Erreicht der Status „alle N Seiten erkannt“? (Wegen Fehler 1 bleibt evtl. die letzte Seite hängen.)
- 100 Seiten am Stück scannen und die Zeit bis „alle 100 Seiten erkannt“ messen (Ziel ≤ 15 min). Wird das iPhone sehr warm?
- Eine Seite in „Text“ korrigieren, die App schließen und wieder öffnen: Ist die Korrektur noch da?

## Erneute QA – 2026-11-18 (v0.5.3)
**Urteil:** fertig
**Ergebnis:** 14 von 15 AK bestanden, AK13 nur am iPhone prüfbar · 0 Fehler offen
- ✅ AK9 – Fehler 1 ist behoben. Nach „Neu aufnehmen“ einer korrigierten Seite steht zuerst „Text wird noch erkannt …“, dann nach ca. 5 s der neue Text („Als Gregor an jenem Morgen …“, `vonHand: false`).
- ✅ AK1 – „Fertig“ direkt nach der letzten von 4 schnellen Aufnahmen: Der Status endet bei „Text: alle 4 Seiten erkannt“ (16,7 s).
- Regression: `f05test.mjs` und `f05qa.mjs` komplett erneut ausgeführt, alle Werte wie vorher (Fehlerquote 0 %, Vorrang, Hintergrund, Offline-Sprache, Altdaten, „Belegt“, Löschen). Keine Konsolenfehler, keine Fremd-Anfragen.
- ⚠️ AK13 – offen am iPhone: 100 Seiten in höchstens 15 min.
