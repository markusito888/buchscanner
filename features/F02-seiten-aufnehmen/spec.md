# F02 Seiten aufnehmen
**Status:** spezifiziert · **Stufe:** light · **Abhängig von:** F01

## Ziel
Seiten mit dem iPhone aufnehmen, und zwar auf zwei Wegen. Für Bücher und lange Dokumente gibt es eine schnelle Live-Kamera in der App: Seite für Seite auslösen, ohne Unterbrechung. Für den normalen Scan dient die iPhone-Kamera, denn sie liefert die beste Bildqualität. Danach lassen sich die Seiten in einer Übersicht ansehen, umsortieren, löschen, neu aufnehmen und im Kontrast verbessern. Speichern, Texterkennung und Export folgen in F03 bis F06.

## User Stories
- Als Nutzer möchte ich ein Buch Seite für Seite mit einem Tipp pro Seite aufnehmen, damit auch 200 Seiten schnell gehen.
- Als Nutzer möchte ich für einen normalen Scan die richtige iPhone-Kamera nutzen, damit Bild und PDF hochwertig werden.
- Als Nutzer möchte ich verwackelte oder doppelte Seiten löschen oder neu aufnehmen und die Reihenfolge korrigieren, damit der Scan stimmt.
- Als Nutzer möchte ich den Kontrast verbessern, damit Text gut lesbar ist und die Texterkennung besser arbeitet.

## Akzeptanzkriterien
**Buch / Dokument mit Text (Live-Kamera)**
- [ ] AK1: Angenommen die Startseite ist offen, wenn man „Buch / Dokument mit Text“ antippt, dann öffnet sich innerhalb von 2 s ein Vollbild mit dem Live-Bild der hinteren Kamera, einem runden Auslöser (mindestens 72 px), einem Zähler „0 Seiten“ und dem Knopf „Fertig“. Beim allerersten Mal fragt iOS nach der Kamera-Erlaubnis.
- [ ] AK2: Angenommen die Live-Kamera ist offen, wenn man den Auslöser antippt, dann blitzt das Bild kurz auf, der Zähler steigt um 1, unten erscheint ein kleines Vorschaubild der letzten Seite, und nach höchstens 1 s kann die nächste Seite ausgelöst werden.
- [ ] AK3: Die Seite wird in der höchsten Auflösung gespeichert, die Safari für das Kamerabild liefert. Angefragt wird 3840 × 2160, bei Hochformat also mindestens 1080 px Breite. Die tatsächliche Größe ist in der Großansicht ablesbar (z. B. „2160 × 3840“).
- [ ] AK4: Angenommen die Kamera-Erlaubnis wurde abgelehnt oder die Kamera ist nicht verfügbar, dann erscheint statt des Kamerabilds der Text „Kein Zugriff auf die Kamera“ mit einer kurzen Anleitung: in den iPhone-Einstellungen unter Safari → Kamera auf „Erlauben“ stellen bzw. unter „Website-Einstellungen“. Dazu kommt der Knopf „Zurück“. Die App stürzt nicht ab.
- [ ] AK5: Angenommen es wurden Seiten aufgenommen, wenn man „Fertig“ antippt, dann schaltet sich die Kamera ab (grüner Punkt oben verschwindet) und die Seitenübersicht öffnet sich. „Fertig“ bei 0 Seiten führt zurück zur Startseite.
- [ ] AK6: Angenommen die Übersicht eines Buch-Scans ist offen, wenn man „+ Seiten“ antippt, dann öffnet sich wieder die Live-Kamera. Neue Seiten werden hinten angehängt, und der Zähler zählt ab der bisherigen Seitenzahl weiter.

**Normaler Scan (iPhone-Kamera)**
- [ ] AK7: Angenommen die Startseite ist offen, wenn man „Normaler Scan“ antippt, dann öffnet sich direkt die iPhone-Kamera (ohne Auswahlmenü). Nach „Foto benutzen“ erscheint die Seitenübersicht mit dieser einen Seite in voller Fotoauflösung.
- [ ] AK8: Angenommen die Übersicht eines normalen Scans ist offen, wenn man „+ Seite“ antippt, dann öffnet sich wieder die iPhone-Kamera, und das neue Foto wird hinten angehängt.
- [ ] AK9: Bricht man die iPhone-Kamera ab, ändert sich nichts: Beim ersten Foto geht es zurück zur Startseite, sonst bleibt die Übersicht unverändert.

**Seitenübersicht und Bearbeiten (beide Arten)**
- [ ] AK10: Die Übersicht zeigt oben die Art („Buch / Dokument“ bzw. „Normaler Scan“) und die Seitenzahl. Darunter stehen die Vorschaubilder in einem Raster mit 3 Spalten bei 375 px, jedes mit seiner Seitennummer. Dazu gibt es den Kontrast-Umschalter „Farbe | Grau | Dokument“ und den Hinweis „Noch kein Speichern: Seiten gehen beim Schließen der App verloren.“
- [ ] AK11: Angenommen die Übersicht ist offen, wenn man ein Vorschaubild antippt, dann öffnet sich die Großansicht mit „Seite X von Y“, dem Bild in voller Breite und den Knöpfen „‹ Nach vorne“, „Nach hinten ›“, „Neu aufnehmen“, „Löschen“ und „Zurück“. Alle Knöpfe sind mindestens 44 px hoch.
- [ ] AK12: „‹ Nach vorne“ tauscht die Seite mit der vorherigen und „Nach hinten ›“ mit der nächsten. Die Großansicht bleibt bei dieser Seite, und „Seite X von Y“ ändert sich passend. Auf Seite 1 ist „Nach vorne“ ausgegraut, auf der letzten Seite „Nach hinten“.
- [ ] AK13: „Löschen“ fragt „Seite X löschen?“ (Löschen / Abbrechen). Nach dem Löschen geht es zurück zur Übersicht, und die Nummern rücken nach. Wird die letzte verbleibende Seite gelöscht, geht es zur Startseite.
- [ ] AK14: „Neu aufnehmen“ öffnet die passende Kamera: bei Buch-Scans die Live-Kamera für genau ein Bild, danach direkt zurück, bei normalen Scans die iPhone-Kamera. Das neue Bild ersetzt die Seite an derselben Stelle. Abbrechen lässt die alte Seite stehen.
- [ ] AK15: Der Kontrast-Umschalter gilt für alle Seiten des Scans. Voreingestellt ist bei Buch-Scans „Dokument“, bei normalen Scans „Farbe“. „Grau“ zeigt Graustufen. „Dokument“ zeigt Graustufen mit kräftigem Kontrast: Papier nahezu weiß, Schrift nahezu schwarz. Ein Wechsel aktualisiert alle Vorschaubilder und die Großansicht innerhalb von 3 s bei 50 Seiten. Die Originalaufnahme bleibt erhalten, ein Zurückschalten auf „Farbe“ zeigt wieder das unveränderte Foto.
- [ ] AK16: Angenommen in der Übersicht wird „Schließen“ angetippt, dann fragt die App „Scan verwerfen? Die Seiten werden noch nicht gespeichert.“ (Verwerfen / Abbrechen). Bei „Verwerfen“ geht es zur Startseite, und alle Seiten sind aus dem Speicher entfernt.

**Allgemein**
- [ ] AK17: Im Buch-Modus lassen sich 100 Seiten hintereinander aufnehmen, ohne dass die App abstürzt, neu lädt oder merklich langsamer auslöst (AK2 gilt auch bei Seite 100). Geprüft wird auf dem iPhone des Nutzers.
- [ ] AK18: Alles läuft ohne Internet und ohne Anfragen an fremde Server. Kein Bild verlässt das iPhone. Bildlauf gibt es nur senkrecht in der Übersicht, kein waagerechter Bildlauf bei 375 px. Hell und Dunkel werden wie in F01 befolgt (das Kamera-Vollbild ist immer dunkel).

## Nicht im Umfang
- Dauerhaftes Speichern, Bibliothek, Scan benennen (F03). Bis dahin sind die Seiten nach dem Schließen der App weg.
- Speichern als Bild/PDF und Teilen (F04), Texterkennung (F05), Export (F06).
- Ränder finden, Seiten gerade ziehen, zuschneiden (F07). Doppelseiten teilen (F08).
- Fotos aus der Mediathek übernehmen.
- Blitz/Taschenlampe, Zoom, Antippen zum Scharfstellen, Wechsel auf die Frontkamera (Safari unterstützt das auf dem iPhone kaum oder gar nicht).
- Automatisches Auslösen, sobald eine Seite ruhig liegt.
- Seiten mit dem Finger ziehen und umsortieren, Kontrast pro einzelne Seite, Drehen von Seiten.
- Querformat: Die Aufnahme läuft im Hochformat.

## Sonderfälle
- App geht während der Live-Kamera in den Hintergrund (Anruf, Home-Taste): Die Kamera wird abgeschaltet. Beim Zurückkehren startet sie neu, die bisherigen Seiten bleiben (solange iOS die App nicht ganz beendet hat).
- iOS beendet die App wegen Speichermangels: Seiten sind weg (bis F03). Gegenmaßnahme: Vorschaubilder klein halten (ca. 300 px) und Originale als komprimierte JPEG-Dateien (Qualität ca. 0,9), nicht als Rohbilder im Speicher.
- Sehr schnelles Mehrfach-Tippen auf den Auslöser: Jeder Tipp ergibt höchstens eine Seite, und keine Seite geht verloren.
- Normaler Scan mit sehr großen Fotos (12 bis 48 MP): Die volle Auflösung bleibt als Original erhalten. Vorschau und Kontrast-Ansicht arbeiten mit verkleinerten Kopien, damit es flüssig bleibt.
- Sehr dunkle Umgebung: Es gibt keinen Blitz. „Dokument“ hilft beim Lesen, aber ein dunkles Foto bleibt dunkel.

## Entscheidungen
- Buch-Modus → Live-Kamera in der App, weil das bei ganzen Büchern deutlich schneller geht (2026-11-16).
- Normaler Scan → iPhone-Kamera direkt (ohne Auswahlmenü), weil sie die höchste Qualität liefert. Mehrere Seiten pro Scan sind möglich (2026-11-16).
- Kein Import aus der Fotomediathek (2026-11-16).
- Seiten ordnen → Pfeil-Knöpfe in der Großansicht, nicht Ziehen (2026-11-16).
- Kontrast → 3 Stufen je Scan, das Original bleibt. Voreinstellung: Buch „Dokument“, normal „Farbe“ (2026-11-16).
- Speichern → F02 nur im Arbeitsspeicher, F03 direkt danach (2026-11-16).

## Offene Fragen
- Welche Auflösung liefert Safari auf deinem iPhone tatsächlich für das Live-Bild? Das klärt sich beim ersten Test (AK3). Liegt sie unter 1080 px Breite, prüfen wir, ob die Texterkennung damit reicht.
- Bleibt der Bildschirm während der Live-Aufnahme an, oder dimmt iOS ihn nach der Auto-Sperre-Zeit? Falls er dimmt, schalten wir bei `/umsetzen` die Bildschirmsperre-Verhinderung (Wake Lock) dazu, die es in Safari ab iOS 16.4 gibt.
