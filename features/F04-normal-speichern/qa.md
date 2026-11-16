# QA F04 – 2026-11-16
**Urteil:** nicht fertig (knapp)
**Ergebnis:** 11 von 12 AK bestanden · 1 Fehler (gering): Tempo-Ziel bei 10 Seiten nicht sicher eingehalten
**Geprüft:** v0.4.0 lokal in Chrome headless, 375 px. Grundlage sind der Bau-Test `f04test.mjs` (erneut gelaufen) und die zusätzliche QA-Prüfung `f04qa.mjs`:
- Dateinamen und Umlaute
- gedrehtes Foto (EXIF-Ausrichtung)
- Optik im Vergleich zur Großansicht
- Escape
- Pausen der Anzeige
- 30 Seiten
- Herunterladen mehrerer Bilder

Die PDFs wurden mit Apples PDFKit (Mac-Vorschau) geöffnet. Die F03-Regression lief mit `f03test.mjs`.

## Akzeptanzkriterien
- ✅ AK1 – Normaler Scan: „+ Seite“ und „Speichern“ stehen nebeneinander, je 52 × 167 px, ohne waagerechten Bildlauf. Die Auswahl zeigt „Als PDF (Dateien)“, „Als Bilder (Fotos)“ und „Abbrechen“. „Abbrechen“ schließt sie, ohne dass etwas passiert. Ein Buch-Scan hat keinen Knopf „Speichern“.
- ✅ AK2 – „Seite als Bild sichern“ ist 48 px hoch und erscheint nur beim normalen Scan. Er speichert nur die aktuelle Seite („… – Seite 2.jpg“), danach steht man weiter in der Großansicht.
- ✅ AK3 – Es erscheint „Wird erstellt … Seite 1 von 3“, nach 1,3 s „PDF ist fertig.“ und „Fertig – Teilen“. Erst dieser Tipp ruft das Teilen auf (nachgebildet, dabei mitgezählt).
- ✅ AK4 – In PDFKit:
  - 3 Seiten in der Reihenfolge der Übersicht, A4 hoch 595 × 841, quer 841 × 595.
  - Die Bilder sind unverzerrt eingepasst, der Rest ist weiß.
  - Der Name „Rechnung 3/2026: Größe & Übersicht?“ ergibt die Datei „Rechnung 3-2026- Größe & Übersicht-.pdf“. Im PDF steht der Titel korrekt mit Umlauten und Sonderzeichen.
  - xref-Tabelle und alle Objekt-Positionen stimmen.
- ✅ AK5 – Die Bilder heißen „<Name> – Seite 1.jpg“ bis „– Seite 3.jpg“, Typ `image/jpeg`. Das Teilen-Menü selbst ist ⚠️ nur am iPhone sichtbar („N Bilder sichern“).
- ✅ AK6 – Die exportierten Bilder entsprechen der Großansicht (beide auf 300 px verkleinert):
  - mittlere Abweichung 0,6 (Dokument), 1,0 (Grau) und 0,7 (Farbe) von 255
  - Maße 3000 × 2250 bzw. 2250 × 3000, ein kleines Foto mit 1200 × 900 bleibt 1200 × 900
  - Größe: realistisches 12-MP-Foto in Farbe 0,77–0,93 MB, in Dokument 0,23–0,27 MB je Seite. Die Dokument-Seiten liegen damit etwas unter den 0,3 MB aus AK6; der Plan nennt das als gewollte Annahme (kleiner, Schrift bleibt scharf).
- ✅ AK7 – Ein Testfoto mit eingebautem Exif-Block samt Standort-Text: In keinem exportierten JPEG und keinem PDF stehen „Exif“ oder der Standort-Text.
- ✅ AK8 – Diese Abbrüche wurden geprüft:
  - Abbruch im Teilen-Menü: kein Hinweis, Übersicht und 3 Seiten unverändert.
  - „Abbrechen“ bei Seite 3 von 10: Der Dialog ist zu, es entsteht keine Datei.
  - Escape während des Erzeugens: Der Dialog ist zu, man bleibt in der Übersicht.
- ✅ AK9 – Nach dem Speichern steht der Scan unverändert in „Meine Scans“.
- ✅ AK10 – Wenn das Erzeugen fehlschlägt (Bild lässt sich nicht erzeugen), erscheint „Speichern fehlgeschlagen – bitte noch einmal versuchen“, die App läuft weiter. Ohne Teilen-Funktion werden 3 Bilder einzeln heruntergeladen (alle 3 Dateien kamen an).
- ❌ AK11 – Ziel: 10 Seiten in höchstens 10 s. Gemessen wurden 10 realistische 12-MP-Fotos als PDF in „Dokument“, achtmal (ohne Hintergrundlast, siehe unten):
  - 5,6 s, 6,8 s, 7,1 s, 7,4 s, 8,1 s
  - 10,9 s, 10,9 s, 11,9 s

  In 3 von 8 Läufen dauerte es also länger als 10 s. Der Fortschritt zählt jede Seite hoch, und „Abbrechen“ wirkt. Die Anzeige steht aber pro Seite bis zu 0,6 s still (längste gemessene Pause 599 ms, viermal über 0,5 s).
- ✅ AK12 – Speichern klappt auch offline. Es gibt keine Anfragen an fremde Server, keinen waagerechten Bildlauf, und hell wie dunkel sehen ordentlich aus (Bildschirmfotos von Übersicht, Auswahl, Fortschritt und Großansicht).

## Sonderfälle
- ✅ Gedrehtes Foto (EXIF-Ausrichtung 6): Die Großansicht zeigt 3024 × 4032. Export und PDF-Seite sind hochkant und genauso gedreht wie in der Großansicht.
- ✅ 30 Seiten (12 MP, Dokument): Das PDF ist nach 19 s fertig, 7,7 MB groß, ohne Absturz. ⚠️ Der Arbeitsspeicher des iPhones lässt sich nur dort prüfen.
- ✅ „Fertig – Teilen“ erst später antippen: Die Dateien bleiben bereit (der Knopf wurde mehrere Sekunden später getippt).
- ⚠️ 48-MP-Fotos: nicht am Mac getestet.

## Regression
- F03 komplett bestanden: Neuladen, Reihenfolge, Weiterscannen, Löschen, Speicher voll, 500 Seiten in 0,15 s, Übersicht mit 200 Seiten in 0,5 s, Auslöser höchstens 0,22 s gesperrt, offline.
- Konsole: nur die erwarteten Warnungen aus den absichtlich erzeugten Fehlern (Speicher voll, Bild nicht erzeugbar).

## Fehler
1. [gering] **10 Seiten als PDF dauern am Mac teils länger als 10 s (AK11)**
   - Schritte: normaler Scan mit 10 Fotos à 12 MP, „Dokument“, „Speichern“ → „Als PDF“.
   - Erwartet: höchstens 10 s.
   - Tatsächlich: 5,6–11,9 s, dreimal über 10 s.
   - Pro Seite kosten Laden, Verkleinern, der „Dokument“-Filter auf 3000 px und das JPEG zusammen 0,7–1,2 s. Diese Zeit läuft am Stück, deshalb steht die Anzeige so lange still.
   - Am iPhone (deutlich schnellerer Prozessor als der i5 von 2014) ist es wahrscheinlich schneller. Das ist aber nicht belegt.

## Weitere Beobachtungen
1. [Hinweis zum Testen] Die früher gemessenen Ausreißer (48 s beim Bau) kamen von liegengebliebenen Test-Browsern im Hintergrund. Diese wurden beendet, die Messungen oben liefen ohne sie.
2. [gering] „Abbrechen“ wirkt erst nach der gerade laufenden Seite, am Mac also bis zu ca. 1 s verzögert. Das ist zulässig, fühlt sich aber träge an.
3. Overengineering: keins gefunden. `pdf.js` hat 80 Zeilen und keine Bibliothek.

## Was du selbst kurz testen solltest
- Einen normalen Scan mit 10 Seiten in „Dokument“ als PDF speichern und die Zeit bis „PDF ist fertig.“ messen. Unter ca. 10 s ist AK11 am iPhone erfüllt.
- „Fertig – Teilen“ → „In Dateien sichern“, dann das PDF in der Dateien-App öffnen: Seiten in A4, Text gut lesbar?
- „Als Bilder“ → „N Bilder sichern“: Sind alle Seiten in Fotos?
- Ein Foto quer aufnehmen und speichern: Ist es richtig gedreht?

## Nächster Schritt
Es gibt zwei Möglichkeiten. Entweder wird mit `/umsetzen F04` das Tempo verbessert, zum Beispiel durch schnelleres Verkleinern beim Laden und den Filter in kleineren Stücken, damit die Anzeige nicht stehen bleibt. Oder AK11 gilt als erfüllt, wenn der iPhone-Test unter 10 s bleibt. Das entscheidest du.

## Nachtrag 2026-11-16: iPhone-Test
**Urteil:** fertig · **Ergebnis:** 12 von 12 AK bestanden · 0 Fehler offen
- ✅ AK11 – Der Nutzer hat am iPhone gemessen: Die Geschwindigkeit beim Speichern als PDF ist in Ordnung. AK11 gilt damit als erfüllt, wie im Bericht oben vorgeschlagen. Der Fehler 1 (Tempo am Mac) ist damit erledigt, ohne Änderung am Code.
