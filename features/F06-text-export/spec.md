# F06 Text-Export
**Status:** spezifiziert · **Stufe:** light · **Abhängig von:** F03, F05

## Ziel
Der erkannte Text eines Buch-Scans lässt sich mit wenigen Tipps weitergeben. Als .md-Datei an die Claude-App (oder Claude Code), mit einem Hinweis, der Claude Lücken ergänzen und das Buch zusammenfassen lässt. Als EPUB an „An Kindle senden“ zum Lesen. Danach kann man die Fotos löschen und nur den Text behalten.

## User Stories
- Als Nutzer möchte ich ein gescanntes Buch mit einem Tipp als Datei an Claude geben, damit Claude es mir zusammenfasst.
- Als Nutzer möchte ich das Buch als E-Book auf meinen Kindle schicken, damit ich es dort lesen kann.
- Als Nutzer möchte ich nach dem Export die Fotos löschen, damit das iPhone nicht voll wird, der Text aber bleibt.

## Akzeptanzkriterien
**Export**
- [ ] AK1: Angenommen die Übersicht eines Buch-Scans ist offen, dann steht in der Fußleiste neben „+ Seiten“ der Knopf „Exportieren“ (beide mindestens 52 px hoch). Ein Tipp öffnet die Auswahl „Text für Claude (.md)“, „E-Book für Kindle (EPUB)“ und „Abbrechen“. Normale Scans haben weiter „Speichern“ (F04).
- [ ] AK2: Nach der Wahl öffnet sich das iOS-Teilen-Menü mit der Datei, darin u. a. „Claude“, „In Dateien sichern“, „Kindle“ bzw. „An Kindle senden“. Lässt Safari das Teilen nicht direkt zu, erscheint wie in F04 „Fertig – Teilen“. Kann der Browser keine Dateien teilen, wird die Datei heruntergeladen. Abbrechen ändert nichts.
- [ ] AK3: Haben noch nicht alle Seiten Text, fragt die App vorher „N Seiten haben noch keinen Text – trotzdem exportieren?“ (Exportieren / Abbrechen). Fehlende Seiten erscheinen in der Datei als „[S. 12: noch kein Text]“.

**.md für Claude**
- [ ] AK4: Die Datei heißt „<Name des Scans>.md“ (Zeichen wie „/“ und „:“ werden zu „-“) und ist UTF-8. Sie beginnt mit „# <Name>“ und darunter diesem Hinweis als Zitat:
  „Hinweis für Claude: Dieser Text stammt aus einer automatischen Texterkennung (Buchscanner-App). Wörter in [?…] wurden unsicher gelesen, Lücken und Fehler sind möglich. Bitte ergänze sie sinngemäß und kennzeichne größere Ergänzungen. Seitenangaben stehen als [S. 12]. Fasse das Buch danach auf Deutsch zusammen.“
- [ ] AK5: Danach folgt der Text aller Seiten in ihrer Reihenfolge als Fließtext. Absätze sind durch eine Leerzeile getrennt. Am Anfang jeder Seite steht „[S. N]“, wobei N die Nummer der Seite im Scan ist. Endet eine Seite mitten im Satz (kein „.“, „!“, „?“, „:“ oder „…“ am Ende, auch nicht vor einem Anführungszeichen), läuft der Absatz auf der nächsten Seite weiter, und die Marke steht mitten im Absatz. *(Geändert beim Bau, 2026-11-18: Die Bedingung „nächste Seite beginnt klein“ ist entfallen, weil deutsche Fortsetzungen oft mit einem großgeschriebenen Hauptwort beginnen.)* Die Markierungen „[?Wort]“ bleiben erhalten. Handkorrekturen werden übernommen.
- [ ] AK6: Große Bücher werden geteilt. Ab 90 000 Wörtern entstehen mehrere Dateien „<Name> – Teil 1 von 3.md“ usw., getrennt an Seitengrenzen und jede höchstens 90 000 Wörter (ca. 300 Buchseiten) lang. Jede Datei hat Titel und Hinweis, ergänzt um „Dies ist Teil 1 von 3. Fasse diesen Teil zusammen.“. Alle Teile kommen zusammen in einem Teilen-Vorgang.

**EPUB für Kindle**
- [ ] AK7: Die Datei heißt „<Name>.epub“. Es ist ein gültiges EPUB 3 mit Titel = Name, Autor „Buchscanner“ und der Sprache des Scans (de/en/es). Inhaltsverzeichnis: je 20 Scan-Seiten ein Abschnitt „Seiten 1–20“, „Seiten 21–40“ usw. Der Text enthält dieselben Absätze wie die .md, aber zum Lesen ohne Seitenmarken und ohne Hinweis. Aus „[?Wort]“ wird „Wort“, fehlende Seiten fehlen einfach.
- [ ] AK8: Das EPUB öffnet sich ohne Fehler in Apple Books am Mac und wird von „An Kindle senden“ angenommen (der Nutzer prüft das am Kindle).

**Bilder löschen, Text behalten**
- [ ] AK9: Nach einem erfolgreichen Teilen fragt die App, falls alle Seiten Text haben und noch Fotos da sind: „Bilder jetzt löschen? Der Text bleibt erhalten (spart ca. X MB).“ (Bilder löschen / Behalten). Dieselbe Aktion gibt es als Knopf „Bilder löschen, Text behalten“ unten in der Übersicht, mit derselben Frage. Er ist nur sichtbar, wenn alle Seiten Text haben und Fotos da sind.
- [ ] AK10: Nach dem Löschen ist das Buch „Nur Text“:
  - Die Fotos sind aus dem Speicher entfernt, und „Belegt“ sinkt entsprechend.
  - In der Liste steht „Buch / Dokument · nur Text“ mit einem Text-Symbol statt Vorschaubild.
  - Die Übersicht zeigt je Seite eine Kachel mit Nummer und dem Textanfang. Kontrast- und Sprach-Umschalter sind ausgeblendet.
  - Die Großansicht zeigt nur den Text (bearbeitbar), ohne „Bild | Text | Beides“ und ohne „Neu aufnehmen“. „Nach vorne“, „Nach hinten“ und „Löschen“ bleiben.
  - Export und „Scan löschen“ funktionieren weiter.
- [ ] AK11: Bei einem „Nur Text“-Buch nimmt „+ Seiten“ weiterhin neue Seiten auf. Diese haben wieder Fotos und werden erkannt, bis man erneut „Bilder löschen“ wählt.

**Allgemein**
- [ ] AK12: Ein Buch mit 300 Seiten wird am Mac in höchstens 3 s als .md und in höchstens 5 s als EPUB erzeugt. Alles läuft offline und ohne Anfragen an fremde Server. Kein waagerechter Bildlauf bei 375 px, hell und dunkel sind ok.

## Nicht im Umfang
- PDF aus Buchtext (entschieden: kein PDF für Buchtext).
- Zusammenfassung direkt in der App (F09, Claude-API).
- Kapitel aus dem Buch erkennen, Überschriften, Fett/Kursiv, Bilder im EPUB, Kopf- und Fußzeilen entfernen.
- Eigene Einstellungen für Hinweistext, Teilgröße oder Autor.
- Export mehrerer Bücher auf einmal.
- Die gedruckten Seitenzahlen des Buchs: [S. N] ist die Nummer der Scan-Seite.

## Sonderfälle
- Ein Buch ohne jeden Text (alles noch in Erkennung): Die Rückfrage aus AK3 nennt alle Seiten. Der Export enthält dann nur Titel, Hinweis und Marken.
- Der Name enthält Sonderzeichen oder Emojis: Er bleibt im Titel, im Dateinamen werden nur „/ \ : * ? " < > |“ ersetzt.
- „Bilder löschen“ wird abgebrochen oder schlägt fehl (Speicherfehler): Fotos und Text bleiben unverändert, die Meldung lautet „Löschen fehlgeschlagen“.
- Die Texterkennung arbeitet gerade an diesem Buch, und man tippt „Bilder löschen“: Der Knopf erscheint ohnehin erst, wenn alle Seiten Text haben.
- Ein „Nur Text“-Buch kann nicht neu erkannt werden. Bei einem Sprachwechsel gäbe es nichts zu erkennen, deshalb ist der Umschalter ausgeblendet (AK10).

## Entscheidungen
- .md als Fließtext mit Seitenmarken „[S. N]“ (2026-11-18).
- Der Hinweis lässt Claude Lücken ergänzen und danach auf Deutsch zusammenfassen (2026-11-18).
- Fotos löschen: Nachfrage nach dem Export, dazu ein Knopf in der Übersicht (2026-11-18).
- Export ist auch vor dem Ende der Erkennung möglich, mit Warnung. „Bilder löschen“ geht erst, wenn alle Seiten Text haben (2026-11-18).
- Teilgröße 90 000 Wörter, damit ein Teil gut in Claudes Kontext passt. Das EPUB wird nie geteilt. Das Inhaltsverzeichnis gliedert in 20-Seiten-Abschnitte (bestätigt mit der Spec, 2026-11-18).
- EPUB ohne Hinweis, Seitenmarken und „[?]“, damit es sich gut liest (bestätigt mit der Spec, 2026-11-18).

## Offene Fragen
- Keine.
