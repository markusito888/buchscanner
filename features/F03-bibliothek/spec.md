# F03 Bibliothek
**Status:** fertig · **Stufe:** light · **Abhängig von:** F02

## Ziel
Scans bleiben auf dem iPhone erhalten, auch wenn die App geschlossen wird oder abstürzt. Auf der Startseite stehen alle Scans in einer Liste. Dort kann man einen Scan wieder öffnen, ein Buch über mehrere Tage weiterscannen, umbenennen oder löschen. Gespeichert wird nur in der App auf dem iPhone, nichts geht ins Internet.

## User Stories
- Als Nutzer möchte ich, dass jede Seite sofort gespeichert ist, damit nichts verloren geht, wenn die App schließt oder abstürzt.
- Als Nutzer möchte ich ein Buch an mehreren Tagen weiterscannen, damit ich nicht alles auf einmal machen muss.
- Als Nutzer möchte ich meine Scans auf der Startseite finden, umbenennen und löschen, damit ich den Überblick behalte und Platz freimachen kann.

## Akzeptanzkriterien
**Speichern**
- [x] AK1: Angenommen man nimmt im Buch-Modus Seiten auf, wenn die App danach geschlossen wird (wegwischen, Absturz, Neu laden), dann sind beim nächsten Öffnen alle Seiten in der richtigen Reihenfolge da, die mindestens 2 s vor dem Schließen aufgenommen wurden.
- [x] AK2: Dasselbe gilt für den normalen Scan, sobald ein Foto mit „Foto benutzen“ übernommen ist (volle Auflösung bleibt erhalten).
- [x] AK3: Alle Änderungen aus F02 werden sofort gespeichert und sind nach einem Neustart noch da: Seiten verschieben, löschen, neu aufnehmen und die Kontrast-Stufe des Scans.
- [x] AK4: Ein Scan ohne Seiten wird nicht gespeichert. „Fertig“ bei 0 Seiten legt keinen Eintrag an, und wird die letzte Seite gelöscht, verschwindet der Scan aus der Liste.
- [x] AK5: Beim ersten Speichern bittet die App Safari um dauerhaften Speicher (`navigator.storage.persist()`), ohne dass der Nutzer etwas tun muss.

**Liste auf der Startseite**
- [x] AK6: Angenommen es gibt gespeicherte Scans, dann zeigt die Startseite unter den zwei Knöpfen die Überschrift „Meine Scans“ und eine Liste, zuletzt geänderte zuerst. Jede Zeile ist mindestens 60 px hoch und zeigt ein Vorschaubild der ersten Seite, den Namen, die Art („Buch / Dokument“ bzw. „Normaler Scan“) sowie „X Seiten · TT.MM.JJJJ“ (Datum der letzten Änderung).
- [x] AK7: Ohne Scans steht dort „Noch keine Scans“.
- [x] AK8: Unter der Liste steht eine Zeile „Belegt: X MB“ (Summe aller gespeicherten Bilder, auf ganze MB gerundet, unter 1 MB: „Belegt: unter 1 MB“). Sie stimmt nach Aufnehmen und Löschen wieder.
- [x] AK9: Ein Tipp auf eine Zeile öffnet die Übersicht dieses Scans mit allen Seiten und der gespeicherten Kontrast-Stufe. Bei einem Buch hängt „+ Seiten“ neue Seiten hinten an (Weiterscannen über mehrere Tage).

**Name, Zurück, Löschen**
- [x] AK10: Neue Scans heißen automatisch „Buch TT.MM. HH:MM“ bzw. „Scan TT.MM. HH:MM“ (Zeitpunkt des Anlegens). Ein Tipp auf den Namen oben in der Übersicht öffnet „Umbenennen“ mit Textfeld (vorausgefüllt, höchstens 80 Zeichen), „Sichern“ und „Abbrechen“. Ein leerer Name lässt sich nicht sichern. Der neue Name erscheint sofort in Übersicht und Liste.
- [x] AK11: Oben links in der Übersicht steht statt „Schließen“ jetzt „‹ Scans“. Das führt ohne Rückfrage zur Startseite, weil alles gespeichert ist. Der Hinweis „Noch kein Speichern …“ entfällt, und „Neu laden“ beim Update fragt nicht mehr nach.
- [x] AK12: Die Übersicht hat einen Knopf „Scan löschen“ (rot, unten im Inhalt, mindestens 48 px hoch). Er fragt „„<Name>“ mit X Seiten löschen?“ (Löschen/Abbrechen). Nach „Löschen“ ist der Scan aus Liste und Speicher entfernt, und „Belegt“ sinkt entsprechend.

**Robustheit**
- [x] AK13: Ist der Speicher voll, erscheint „Speicher voll – Seite nicht gespeichert. Bitte alte Scans löschen.“ Die Seite wird nicht angezeigt, und die App läuft weiter.
- [x] AK14: Mit 10 Scans und zusammen 500 Seiten erscheint die Liste nach dem Start der App innerhalb von 2 s. Die Übersicht eines Scans mit 200 Seiten zeigt die ersten Vorschaubilder innerhalb von 2 s.
- [x] AK15: Alles läuft offline, ohne Anfragen an fremde Server und ohne waagerechten Bildlauf bei 375 px, in Hell und Dunkel. Die Aufnahmegeschwindigkeit aus F02 bleibt (Auslöser nach höchstens 1 s wieder bereit, auch während gespeichert wird).

## Nicht im Umfang
- Bilder des Buch-Scans löschen und nur den Text behalten (kommt mit F06, wenn es Text gibt). Bis dahin speichert F03 auch beim Buch alle Fotos.
- Speichern als Bild/PDF in Fotos oder Dateien (F04), Texterkennung (F05), Export (F06).
- Suche, Ordner, Sortieren nach anderen Kriterien, Wischen zum Löschen, mehrere Scans auf einmal löschen.
- Sicherung in iCloud oder auf einem Server, Übertragung auf andere Geräte.
- Papierkorb bzw. Wiederherstellen gelöschter Scans.

## Sonderfälle
- Die App wird mitten beim Speichern einer Seite beendet: Diese eine Seite kann fehlen. Alle früheren Seiten sind da, und der Scan ist nicht beschädigt.
- Die App wird vom Home-Bildschirm gelöscht oder die Safari-Website-Daten werden gelöscht: Alle Scans sind weg. Das lässt sich bei einer Web-App nicht verhindern. Ein Hinweis darauf steht in der Anleitung, nicht in der App.
- iOS räumt bei sehr knappem Speicher Website-Daten auf. Mit „dauerhaftem Speicher“ (AK5) ist das unwahrscheinlich, aber nicht ausgeschlossen.
- Zwei Fenster gleichzeitig (z. B. App und Safari-Tab): wird nicht unterstützt. Die zuletzt gespeicherte Änderung gilt.
- Ein Update der App (neue Version) lässt die gespeicherten Scans unverändert.

## Entscheidungen
- Liste auf der Startseite unter den zwei Knöpfen, zuletzt geänderte zuerst (2026-11-16).
- Name automatisch, später per Tipp änderbar (2026-11-16).
- Löschen per Knopf im Scan mit Rückfrage, nicht per Wischen (2026-11-16).
- Anzeige „Belegt: X MB“ auf der Startseite (2026-11-16).
- Speicherort: IndexedDB der App auf dem iPhone. Jede Seite wird sofort einzeln gespeichert (2026-11-16).
- Buch-Scan: dauerhaft soll nur der Text bleiben. Die Fotos bleiben, bis F06 „Bilder löschen, Text behalten“ anbietet (2026-11-16).

## Offene Fragen
- Keine.
