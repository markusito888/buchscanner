# F04 Normaler Scan speichern
**Status:** spezifiziert · **Stufe:** light · **Abhängig von:** F02, F03

## Ziel
Ein normaler Scan lässt sich als Bild in Fotos oder als PDF in Dateien speichern, und zwar über das Teilen-Menü von iOS. Darüber geht er auch direkt an Mail, AirDrop oder die Claude-App. Gespeichert wird die gewählte Kontrast-Stufe in guter, kompakter Qualität.

## User Stories
- Als Nutzer möchte ich einen Scan mit einem Tipp als PDF in Dateien sichern oder per Mail verschicken, damit ich das Dokument weitergeben kann.
- Als Nutzer möchte ich die Seiten als Bilder in Fotos sichern: alle auf einmal oder eine einzelne Seite.

## Akzeptanzkriterien
**Knöpfe**
- [ ] AK1: Angenommen die Übersicht eines normalen Scans ist offen, dann steht in der Fußleiste neben „+ Seite“ ein Knopf „Speichern“ (beide mindestens 52 px hoch, nebeneinander bei 375 px). Ein Tipp öffnet eine Auswahl mit „Als PDF (Dateien)“, „Als Bilder (Fotos)“ und „Abbrechen“. Bei Buch-Scans gibt es diesen Knopf nicht.
- [ ] AK2: Angenommen die Großansicht einer Seite eines normalen Scans ist offen, dann gibt es zusätzlich den Knopf „Seite als Bild sichern“ (mindestens 48 px). Er speichert nur diese eine Seite.

**Erzeugen und Teilen**
- [ ] AK3: Nach der Wahl erscheint „Wird erstellt … Seite X von Y“ mit dem Knopf „Abbrechen“. Sind die Dateien fertig, wird daraus „Fertig – Teilen“. Ein Tipp darauf öffnet das iOS-Teilen-Menü. (Zwei Schritte sind nötig, weil Safari das Teilen-Menü nur direkt nach einem Tipp öffnet und das Erzeugen länger dauern kann.)
- [ ] AK4: Das PDF hat je Scan-Seite eine A4-Seite, hoch oder quer passend zum Foto. Das Bild ist ohne Verzerrung eingepasst und zentriert, Rest weiß. Die Reihenfolge entspricht der Übersicht. Der Dateiname lautet „<Name des Scans>.pdf“ (Zeichen wie „/“ und „:“ werden zu „-“), der Titel im PDF ist der Name des Scans.
- [ ] AK5: Bilder sind JPEG-Dateien mit dem Namen „<Name> – Seite N.jpg“ (bei einer einzelnen Seite „<Name> – Seite N.jpg“ mit ihrer Nummer). Im Teilen-Menü erscheint „Bild sichern“ bzw. „N Bilder sichern“, und danach sind sie in Fotos.
- [ ] AK6: Gespeichert wird die gerade gewählte Kontrast-Stufe (Farbe, Grau oder Dokument), mit demselben Aussehen wie in der Großansicht. Die lange Seite hat höchstens 3000 px (kleinere Fotos werden nicht vergrößert), JPEG-Qualität 0,85. Eine typische Seite (12-MP-Foto) ist zwischen 0,3 und 2 MB groß.
- [ ] AK7: Die Dateien enthalten keine Standortdaten oder andere Foto-Metadaten (EXIF) des Originals.
- [ ] AK8: Bricht man das Teilen-Menü ab oder tippt „Abbrechen“ während des Erzeugens, passiert nichts weiter: kein Fehler, der Scan bleibt unverändert, man ist wieder in der Übersicht bzw. Großansicht.
- [ ] AK9: Nach dem Speichern bleibt der Scan unverändert in „Meine Scans“. Gelöscht wird nur mit „Scan löschen“ (F03).

**Robustheit**
- [ ] AK10: Kann der Browser keine Dateien teilen (z. B. Chrome am Mac), werden die Dateien stattdessen heruntergeladen. Schlägt das Erzeugen fehl (z. B. zu wenig Arbeitsspeicher), erscheint „Speichern fehlgeschlagen – bitte noch einmal versuchen“, und die App läuft weiter.
- [ ] AK11: Ein Scan mit 10 Seiten wird am Mac (Chrome) in höchstens 10 s als PDF erzeugt, auch in „Dokument“. Während des Erzeugens bleibt die Anzeige bedienbar (Fortschritt zählt hoch, „Abbrechen“ wirkt).
- [ ] AK12: Alles läuft offline und ohne Anfragen an fremde Server. Die Dateien entstehen nur auf dem iPhone. Es gibt keinen waagerechten Bildlauf bei 375 px, hell und dunkel sind ok.

## Nicht im Umfang
- Speichern oder PDF für Buch-Scans (dort zählt der Text: Export als .md und EPUB mit F06).
- Durchsuchbares PDF mit Textebene (kommt evtl. nach F05).
- Andere Seitenformate als A4, Ränder einstellen, Zuschneiden (F07).
- Auswahl einzelner Seiten für das PDF, eigene Qualitätsstufen, volle Original-Auflösung.
- Automatisches Löschen nach dem Speichern.

## Sonderfälle
- Sehr große Fotos (48 MP): Sie werden vor dem Filtern auf 3000 px verkleinert, damit der Arbeitsspeicher reicht.
- Viele Seiten (z. B. 30): Das PDF entsteht Seite für Seite, nicht alles gleichzeitig im Speicher. Ziel: kein Absturz bei 30 Seiten (am iPhone prüfen).
- Gedrehte Fotos (iPhone quer gehalten): Die Ausrichtung wird wie in der Großansicht übernommen.
- Ein Tipp auf „Fertig – Teilen“ erst nach längerer Zeit: Die Dateien bleiben bereit, bis man teilt oder abbricht.

## Entscheidungen
- Gespeichert wird die gewählte Kontrast-Stufe, nicht immer das Originalfoto (2026-11-16).
- Bilder: alle Seiten aus der Übersicht und einzelne Seiten aus der Großansicht (2026-11-16).
- PDF: A4, Bild eingepasst (2026-11-16).
- Qualität: lange Seite höchstens 3000 px, JPEG 0,85 (2026-11-16).
- Speichern läuft über das iOS-Teilen-Menü, in zwei Schritten (Erzeugen, dann Teilen), weil Safari das Teilen-Menü nur direkt nach einem Tipp öffnet (2026-11-16).

## Offene Fragen
- Keine.
