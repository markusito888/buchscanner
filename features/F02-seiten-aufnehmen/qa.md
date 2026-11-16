# QA F02 – 2026-11-16
**Urteil:** nicht fertig
**Ergebnis:** 15 von 18 AK bestanden · 1 durchgefallen · 2 nur auf dem iPhone prüfbar · 2 Fehler (0 kritisch / 2 mittel / 0 gering)

Geprüft auf der Live-Adresse https://markusito888.github.io/buchscanner/ (Version 0.2.0) in Chrome headless bei 375 × 740 px. Test-Kamera: Chrome `--use-fake-device-for-media-stream` mit 3840 × 2160. Fotos des normalen Scans über das Datei-Feld: Testbilder 4032 × 3024 und 2268 × 3024, dazu eine Papierseite mit Text und Randschatten. Du hast berichtet, dass es auf dem iPhone geklappt hat, aber ohne Angaben zu Auflösung, 100 Seiten oder Abdunkeln.

## Akzeptanzkriterien
- ✅ AK1 – „Buch / Dokument“ öffnet die Kamera-Ansicht. Das Kamerabild läuft nach 0,46 s. Zu sehen sind der Auslöser (80 px), „0 Seiten“ und „Fertig“. Kamera-Erlaubnis am iPhone: von dir als funktionierend gemeldet.
- ✅ AK2 – Nach dem Tipp ist der Blitz aktiv (Klasse `an`), der Zähler steigt, und das Vorschaubild unten links zeigt die letzte Seite. Der Auslöser war bei 100 Aufnahmen jedes Mal nach höchstens 0,47 s wieder frei.
- ⚠️ AK3 – Die Großansicht zeigt die Maße („3840 × 2160“ bei der Test-Kamera), und angefragt werden 3840 × 2160. Welche Auflösung dein iPhone liefert und ob es im Hochformat mindestens 1080 px breit ist, kann nur das iPhone zeigen.
- ✅ AK4 – Bei verweigerter Kamera (`NotAllowedError`, wie in Safari) erscheint „Kein Zugriff auf die Kamera“ mit Anleitung. „Zurück“ führt zur Startseite, es kommt zu keinem Absturz.
- ✅ AK5 – „Fertig“ schaltet den Kamerastrom ab (`srcObject` leer) und öffnet die Übersicht. Bei 0 Seiten führt „Fertig“ zur Startseite. (Den grünen Punkt sieht man nur am iPhone.)
- ✅ AK6 – „+ Seiten“ öffnet die Kamera mit „101 Seiten“, eine weitere Aufnahme ergibt 102, und die Seite wird hinten angehängt.
- ✅ AK7 – „Normaler Scan“ öffnet sofort die Dateiauswahl bzw. Kamera (`capture=environment`), die Startseite bleibt solange stehen. Nach dem Foto erscheint die Übersicht „Normaler Scan | 1 Seite“ mit Kontrast „Farbe“. Die volle Auflösung 4032 × 3024 bleibt erhalten.
- ✅ AK8 – „+ Seite“ öffnet erneut die Kamera und hängt hinten an (2 Seiten).
- ✅ AK9 – Ein Abbruch beim ersten Foto lässt die Startseite stehen, ein Abbruch bei „+ Seite“ lässt die Übersicht unverändert (2 Seiten).
- ✅ AK10 – Kopf „Buch / Dokument | 102 Seiten“, Raster mit 3 Spalten und Nummern, Umschalter „Farbe | Grau | Dokument“ und Speicher-Hinweis wörtlich wie in der Spec.
- ✅ AK11 – Großansicht mit „Seite 1 von 102“, Maßen und allen Knöpfen. Die Höhen: Kopfleiste 44 px, sonst 48 px.
- ✅ AK12 – Vor und zurück tauschen die Seiten (Bildvergleich: dieselbe Seite wandert mit), „Seite X von Y“ ändert sich passend. Am Anfang bzw. Ende ist der Knopf ausgegraut.
- ✅ AK13 – Die Rückfrage „Seite 2 löschen?“ (Abbrechen/Löschen) erscheint. Danach rücken die Nummern nach (Bildvergleich: die neue Seite 2 ist die frühere Seite 3). „Abbrechen“ lässt die Seite stehen. Wird die letzte Seite gelöscht, geht es zur Startseite.
- ✅ AK14 – Buch: „Seite 2 neu aufnehmen“ mit dem Knopf „Abbrechen“, eine Aufnahme ersetzt die Seite an derselben Stelle, ein Abbruch lässt sie unverändert. Normal: Abbruch ändert nichts, ein neues Foto ersetzt die Seite, und die Seitenzahl bleibt gleich.
- ❌ AK15 – Umschalten, Voreinstellung (Buch „Dokument“, normal „Farbe“), Erhalt des Originals und Tempo bestehen: 102 Seiten auf „Grau“ in 1,6 s. **Aber:** Auf einer Papierseite mit Schatten an den Rändern wird das Papier bei „Dokument“ nicht „nahezu weiß“. Die Mitte wird weiß (212 → 255), die schattigen Ecken werden aber schwarz (107 → 9). Siehe Fehler 1.
- ✅ AK16 – „Schließen“ fragt „Scan verwerfen? Die Seiten werden noch nicht gespeichert.“ (Verwerfen/Abbrechen), danach geht es zur Startseite.
- ⚠️ AK17 – In Chrome liefen 100 Seiten ohne Absturz, und der Auslöser war bei Seite 100 genauso schnell wie am Anfang. Ob der Speicher deines iPhones 100 echte Aufnahmen schafft, zeigt nur ein Test am Gerät.
- ✅ AK18 – Offline-Aufnahme und Übersicht funktionieren, es gibt keine Fremd-Anfragen und keine Konsolenfehler. Die Übersicht hat keinen waagerechten Bildlauf. Hell und Dunkel werden befolgt, die Kamera-Ansicht ist auch im Hellmodus schwarz.

## Fehler
1. [mittel] **„Dokument“ macht Schatten schwarz statt weiß**
   - Schritte: Normaler Scan oder Buch, eine Seite mit ungleichmäßigem Licht aufnehmen (z. B. Schatten zum Buchrücken hin oder dunklere Ecken), dann Kontrast „Dokument“ wählen.
   - Erwartet (AK15): Papier nahezu weiß, Schrift nahezu schwarz.
   - Tatsächlich: Nur der helle Teil des Papiers wird weiß, die schattigen Bereiche werden grau bis schwarz. Der Grund: Der Filter nutzt einen einzigen Weißpunkt für die ganze Seite. Bei aufgeschlagenen Büchern ist der Schatten zum Rücken hin der Normalfall, und er stört später auch die Texterkennung (F05).
2. [mittel] **Update-Hinweis verdeckt den Auslöser und verwirft ungespeicherte Seiten**
   - Schritte: Während der Live-Aufnahme wird eine neue Version veröffentlicht (oder die App bemerkt sie beim Zurückkehren).
   - Erwartet: Scannen geht ungestört weiter. „Neu laden“ führt nicht still zum Verlust der Seiten (Ziel aus F01: „damit keine laufende Arbeit verloren geht“).
   - Tatsächlich: Die Leiste „Neue Version verfügbar“ liegt über dem Auslöser (Auslöser 640–720 px, Leiste 652–724 px, ein Tipp in die Mitte trifft die Leiste). Tippt man „Neu laden“, sind alle Seiten ohne Rückfrage weg. Kein AK von F02 regelt das ausdrücklich, aber im Alltag ist der Fall wahrscheinlich, solange es F03 noch nicht gibt.

## Weitere Beobachtungen
- Fünf sehr schnelle Tipps hintereinander ergeben 1–2 Seiten. Das passt zur Annahme im Plan, dass Tipps nicht zählen, solange der Auslöser ausgegraut ist. Halbe Seiten oder Fehler gab es dabei nicht.
- Gelingt beim Neu-Aufnehmen das Umwandeln des neuen Bildes nicht (Speichermangel), ist die alte Seite schon freigegeben, und die Seite fehlt dann. Das ist sehr unwahrscheinlich und eher ein Schönheitsfehler.
- Gebaut wurde nichts außerhalb der Spec. `werkzeuge/pruefen.mjs` prüft „Kommt bald“ nicht mehr (passt).
- F01 läuft weiter: Startseite, Offline-Start, Update-Hinweis und Version 0.2.0 sind in Ordnung.

## Was du selbst kurz testen solltest
- Buch-Modus, eine Seite antippen: Welche Maße stehen oben (z. B. „2160 × 3840“)? (AK3)
- Ein aufgeschlagenes Buch mit Schatten zum Rücken auf „Dokument“: Wie stark wird der Schatten schwarz? (Fehler 1)
- 50 bis 100 Seiten am Stück aufnehmen: Bleibt alles flüssig, kein Neustart? Wird der Bildschirm dunkel? (AK17, offene Frage)
