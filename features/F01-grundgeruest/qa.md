# QA F01 – 2026-11-16
**Urteil:** fertig (vorbehaltlich deiner Abnahme der ⚠️-Punkte auf dem iPhone)
**Ergebnis:** 7 von 10 AK belegt bestanden · 3 nur auf dem iPhone prüfbar (⚠️) · 0 Fehler

Geprüft wurde die Live-Adresse https://markusito888.github.io/buchscanner/ (Version 0.1.1) und lokal http://127.0.0.1:5190. Werkzeug: Chrome headless mit 375 × 740 px wie auf dem iPhone (`werkzeuge/pruefen.mjs` und ein zusätzliches Mess-Skript für Knopfgrößen, Kontraste, Klickverhalten und Konsolenfehler).

## Akzeptanzkriterien
- ✅ AK1 – Live-Adresse antwortet mit `HTTP/2 200` über https, `http://` leitet mit 301 auf https um, kein Login. Alle App-Dateien (style.css, manifest, Icons) antworten mit 200. Du hast die Adresse in Safari auf dem iPhone geöffnet.
- ✅ AK2 – Titel „Buchscanner“, zwei Knöpfe „Buch / Dokument mit Text“ und „Normaler Scan“, je 92 px hoch und 335 px breit (volle Breite innerhalb des Rands von 20 px), unten „Version 0.1.1“. Hell und dunkel gleich.
- ✅ AK3 – Tippen auf einen Knopf zeigt unten den Balken „Kommt bald“. Die Adresse bleibt gleich, und nach 2,5 s ist der Balken wieder weg. Sonst passiert nichts.
- ⚠️ AK4 – Manifest (`display: standalone`, Name „Buchscanner“), `apple-touch-icon` 180 × 180 px und `apple-mobile-web-app-capable` sind vorhanden und online abrufbar. Ob Icon, Name und Vollbild auf dem Home-Bildschirm stimmen, kann nur das echte iPhone zeigen. Du hast die App vom Home-Bildschirm gestartet (Update-Test), Icon und Vollbild hast du aber nicht ausdrücklich bestätigt.
- ⚠️ AK5 – In Chrome mit simuliertem Offline-Modus erscheint die Startseite vollständig (Titel „Buchscanner“), live und lokal. Der Flugmodus-Start auf dem iPhone ist noch nicht bestätigt.
- ✅ AK6 – Von dir auf dem iPhone bestätigt: Nach dem Hochladen von 0.1.1 erschien „Neue Version verfügbar“ mit „Neu laden“, danach lief Version 0.1.1. Im Code wartet die neue Version ohne `skipWaiting`, bis der Knopf getippt wird.
- ✅ AK7 – Hell: Hintergrund #f6f8fb, Akzent #2f5d8c. Dunkel: Hintergrund #11161d, Akzent #6fa8dc. Der kleinste gemessene Kontrast beträgt 6,84:1 (Unterzeile und Version hell), alle Texte liegen über 4,5:1.
- ⚠️ AK8 – Kein waagerechter Bildlauf bei 375 px (hell und dunkel, live und lokal). Der Abstand zu Statusleiste und Home-Balken kommt über `env(safe-area-inset-*)` (Seite und Hinweis-Balken). Wie das bei Notch oder Dynamic Island wirkt, zeigt nur das iPhone im Vollbild.
- ✅ AK9 – Keine einzige Anfrage an fremde Server (live und lokal leer). Keine CDNs, keine Webschriften, kein Tracking. Alle Dateien liegen in `app/`.
- ✅ AK10 – `python3 -m http.server 5190` in `app/` liefert dieselbe Ansicht (Screenshots verglichen, gleiche Messwerte, Service Worker und Offline ok).

## Fehler
Keine.

## Weitere Beobachtungen
- Keine Konsolenfehler oder Warnungen (live).
- Sonderfälle: Ein neuer Service Worker wird beim Zurückkehren in die App gesucht (`visibilitychange` → `reg.update()`). Ein erster Start ohne Internet geht wie erwartet nicht.
- Nicht in der Spec, aber harmlos: `<meta name="robots" content="noindex">` hält die App aus Suchmaschinen heraus. Das passt zu „nur für den eigenen Gebrauch“.
- Der Balken „Kommt bald“ verdeckt für 2,5 s die Versionsnummer unten. Das ist unkritisch.
- Der Service Worker liefert zuerst aus dem Cache. Neue Versionen kommen darum nur über den Update-Hinweis, und das ist so gewollt. Wichtig für später: Ohne `werkzeuge/version.sh` bleibt jede Änderung unsichtbar.

## Was du selbst kurz testen solltest
- Home-Bildschirm: Icon (aufgeschlagenes Buch mit Scan-Linie) und Name „Buchscanner“ ansehen, dann starten. Es darf keine Safari-Adressleiste zu sehen sein (AK4).
- Im Vollbild: Liegt das Logo unter der Uhrzeit oder Dynamic Island, oder die Versionsnummer unter dem Home-Balken? Beides darf nicht sein (AK8).
- Flugmodus an, App ganz schließen, über das Symbol starten. Die Startseite muss erscheinen, ohne Fehlerseite (AK5).
