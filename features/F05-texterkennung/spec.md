# F05 Texterkennung
**Status:** spezifiziert · **Stufe:** light · **Abhängig von:** F02, F03

## Ziel
Die App erkennt aus den Seiten eines Buch-Scans den Text, direkt auf dem iPhone (Tesseract.js, Deutsch, Englisch, Spanisch). Der Text jeder Seite wird gespeichert, lässt sich prüfen und korrigieren, und unsichere Seiten sind markiert. Damit ist der Text bereit für den Export an Claude (F06).

## User Stories
- Als Nutzer möchte ich, dass der Text nach dem Scannen von selbst erkannt wird, damit ich nichts weiter tun muss.
- Als Nutzer möchte ich sehen, welche Seiten schlecht erkannt wurden, und sie korrigieren oder neu aufnehmen können.
- Als Nutzer möchte ich auch englische und spanische Bücher scannen.

## Akzeptanzkriterien
**Erkennen**
- [ ] AK1: Angenommen ein Buch-Scan hat Seiten ohne Text, wenn man die Kamera mit „Fertig“ verlässt, dann startet die Erkennung von selbst. Die Übersicht zeigt oben „Text: X von Y Seiten“, und der Wert zählt hoch. Am Ende steht dort „Text: alle Y Seiten erkannt“.
- [ ] AK2: Die Erkennung läuft im Hintergrund, solange die App offen ist, auch beim Blättern in Übersicht und Großansicht und auf der Startseite. Sie läuft nicht, während die Live-Kamera offen ist (der Auslöser bleibt nach höchstens 1 s wieder bereit). Danach geht sie weiter. Geht die App in den Hintergrund, pausiert sie, und beim Zurückkehren läuft sie weiter. Während sie läuft, bleibt der Bildschirm an (Bildschirmsperre verhindert).
- [ ] AK3: Gibt es mehrere Bücher mit offenen Seiten, kommt zuerst das gerade geöffnete dran, dann die übrigen nach Änderungsdatum. In der Liste „Meine Scans“ zeigt jede Buch-Zeile zusätzlich „Text: X von Y“, bis alles erkannt ist.
- [ ] AK4: Der Text jeder Seite wird dauerhaft gespeichert und bleibt nach einem Neustart erhalten. Seiten, die beim Schließen der App noch nicht fertig waren, werden beim nächsten Öffnen erkannt. Neue Seiten („+ Seiten“) und neu aufgenommene Seiten werden (neu) erkannt.
- [ ] AK5: Normale Scans bekommen keine Texterkennung, für sie ändert sich nichts.

**Sprache**
- [ ] AK6: Die Übersicht eines Buch-Scans hat den Umschalter „Deutsch | Englisch | Spanisch“, voreingestellt „Deutsch“. Ein Wechsel erkennt alle Seiten in der neuen Sprache neu. Wurden Seiten schon von Hand korrigiert, fragt die App vorher: „Text aller Seiten neu erkennen? Deine Korrekturen gehen verloren.“ (Neu erkennen / Abbrechen).
- [ ] AK7: Die Sprachdaten kommen von der eigenen Adresse der App (GitHub Pages), nicht von fremden Servern. Eine Sprache wird erst beim ersten Gebrauch geladen. Dabei zeigt die Übersicht „Sprachdaten werden geladen (einmalig) …“. Danach funktioniert die Erkennung offline. Ist man offline und die Sprache fehlt noch, steht dort „Für <Sprache> einmal Internet nötig“, und die Erkennung wartet, ohne Fehler.

**Prüfen und Korrigieren**
- [ ] AK8: Die Großansicht eines Buch-Scans hat oben den Umschalter „Bild | Text | Beides“, voreingestellt „Bild“. Die Wahl bleibt beim Blättern und nach einem Neustart erhalten.
  - „Text“ zeigt den Text der Seite als bearbeitbares Feld über die ganze Breite (mindestens 17 px Schrift).
  - „Beides“ zeigt oben das Bild (etwa 40 % der Höhe) und darunter das Textfeld.
  - Ist der Text noch nicht da, steht dort „Text wird noch erkannt …“.
- [ ] AK9: Änderungen im Textfeld werden automatisch gespeichert, spätestens 1 s nach dem letzten Tippen und auch beim Verlassen der Seite. Nach einem Neustart sind sie noch da. Eine von Hand geänderte Seite wird von der Erkennung nicht mehr überschrieben, außer man nimmt sie neu auf oder wechselt die Sprache (AK6).

**Unsichere Seiten**
- [ ] AK10: Seiten mit geringer Erkennungssicherheit (Durchschnitt unter 60 %) oder ohne erkannten Text bekommen in der Übersicht ein gelbes „!“ am Vorschaubild. Oben steht „N Seiten unsicher“, und ein Tipp darauf öffnet die erste unsichere Seite in der Großansicht. Wird eine Seite von Hand korrigiert oder neu aufgenommen und dann sicher erkannt, verschwindet das „!“.

**Textqualität**
- [ ] AK11: Der Text wird aufbereitet:
  - Absätze bleiben als Absätze erhalten (Leerzeile dazwischen).
  - Zeilenumbrüche innerhalb eines Absatzes werden zu Leerzeichen.
  - Am Zeilenende getrennte Wörter werden zusammengefügt („Rech-“ + „nung“ → „Rechnung“).
- [ ] AK11a: Wörter, die die Erkennung nur unsicher gelesen hat (Sicherheit unter 50 %), stehen im Text als „[?Wort]“. So sieht man sie beim Korrigieren, und Claude kann sie beim Export (F06) sinnvoll ergänzen. Korrigiert man ein solches Wort von Hand, entfernt man die Markierung einfach mit.
- [ ] AK12: An einer sauber gedruckten deutschen Testseite (Buchseite, Live-Kamera, gerade aufgenommen) liegt die Zeichenfehlerquote bei höchstens 3 %. Gemessen wird am Mac gegen den bekannten Text. Am iPhone prüft der Nutzer an eigenen Seiten.

**Tempo und Robustheit**
- [ ] AK13: Am Mac (Chrome) dauert eine Seite höchstens 8 s. Am iPhone schafft die App 100 Seiten in höchstens 15 Minuten, ohne Absturz oder Neuladen (der Nutzer prüft das).
- [ ] AK14: „Scan löschen“ löscht auch den Text, und „Belegt“ zählt den Text mit. Alles läuft ohne Anfragen an fremde Server (die Sprachdaten kommen von der App-Adresse). Es gibt keinen waagerechten Bildlauf bei 375 px, hell und dunkel sind ok. Die Aufnahme bleibt so schnell wie in F02/F03.

## Nicht im Umfang
- Export als .md/EPUB und „Bilder löschen, Text behalten“ (F06).
- Texterkennung für normale Scans und ein durchsuchbares PDF.
- Automatische Spracherkennung, mehrere Sprachen auf einer Seite, Handschrift.
- Spalten oder Tabellen genau nachbauen (der Text kommt in der Reihenfolge, die die Erkennung findet), Seitenzahlen oder Kopfzeilen entfernen.
- Rechtschreibprüfung, Suche im Text.
- Lücken oder Fehler automatisch „logisch ergänzen“: Das macht Claude beim Export. F06 schreibt dafür oben in die .md-Datei einen Hinweis (Text stammt aus einer Texterkennung, offensichtliche Lücken und Fehler sinngemäß ergänzen und Ergänzungen kennzeichnen).
- Ränder finden und gerade ziehen (F07), Doppelseiten teilen (F08).

## Sonderfälle
- Eine leere Seite oder eine Seite nur mit Bild ergibt „Kein Text erkannt“ und ist als unsicher markiert (AK10). Das ist nicht falsch, sondern ein Hinweis zum Prüfen.
- Schiefe oder unscharfe Seiten werden schlecht erkannt und erscheinen als unsicher. Abhilfe: „Neu aufnehmen“.
- Die App wird während der Erkennung einer Seite geschlossen: Diese Seite wird beim nächsten Mal von vorn erkannt, die übrigen Texte bleiben.
- Seiten verschieben oder löschen: Der Text bleibt bei seiner Seite bzw. verschwindet mit ihr.
- Das iPhone wird bei langen Büchern warm. Die Erkennung läuft trotzdem Seite für Seite weiter, nicht mehrere Seiten gleichzeitig.
- Die Sprachdaten liegen im App-Speicher und zählen nicht zu „Belegt“, weil das nur die Scans zählt.

## Entscheidungen
- Zeitpunkt: automatisch nach „Fertig“ im Hintergrund, nicht während der Aufnahme (2026-11-16).
- Sprache: je Scan wählbar, Deutsch voreingestellt, keine gemischte Erkennung (2026-11-16).
- Sprachdaten: werden beim ersten Gebrauch von der eigenen App-Adresse geladen, danach offline (2026-11-16).
- Korrektur: Umschalter „Bild | Text | Beides“ in der Großansicht, voreingestellt „Bild“ (Wunsch: beide Ansichten, Standard Bild | Text) (2026-11-16).
- Unsichere Seiten: gelbes „!“ und der Zähler „N Seiten unsicher“ mit Sprung zur ersten (bestätigt mit der Spec, 2026-11-16).
- Lücken logisch ergänzen → Claude erledigt das beim Export (Hinweis in der .md-Datei, F06). In F05 werden unsichere Wörter nur als „[?Wort]“ markiert. Kein Wörterbuch und keine KI in der App (2026-11-16).
- Für die Erkennung nutzt die App immer die aufbereitete Fassung „Dokument“, egal welche Kontrast-Stufe gerade angezeigt wird (Annahme, bessere Ergebnisse).

## Offene Fragen
- Welche Sprachdaten (schneller und kleiner oder genauer und größer) den besten Kompromiss am iPhone bieten, entscheide ich bei `/umsetzen` per Messung. Die Wahl lege ich dir dort vor, weil sie die Größe (ca. 2–15 MB je Sprache) und das Tempo bestimmt.
- Wie schnell das iPhone wirklich ist, zeigt erst der Test (AK13).
