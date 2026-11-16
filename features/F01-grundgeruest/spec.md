# F01 App-Grundgerüst
**Status:** fertig · **Stufe:** light · **Abhängig von:** –

## Ziel
Ein lauffähiges Grundgerüst der Buchscanner-Web-App, das über GitHub Pages per https erreichbar ist, sich auf dem iPhone auf den Home-Bildschirm legen lässt, offline startet und über neue Versionen informiert. Damit können alle weiteren Features von Anfang an auf dem iPhone getestet werden.

## User Stories
- Als Nutzer möchte ich die App in Safari öffnen und auf meinen Home-Bildschirm legen, damit ich sie wie eine normale App starte.
- Als Nutzer möchte ich die App auch ohne Internet öffnen können, damit ich unterwegs scannen kann.
- Als Nutzer möchte ich sehen, wenn es eine neue Version gibt, und selbst entscheiden, wann neu geladen wird, damit keine laufende Arbeit verloren geht.

## Akzeptanzkriterien
- [x] AK1: Angenommen der Code liegt im GitHub-Repo, wenn man die GitHub-Pages-Adresse in Safari auf dem iPhone öffnet, dann lädt die Startseite über https ohne Fehler und ohne Login.
- [x] AK2: Angenommen die Startseite ist geöffnet, dann zeigt sie den Titel „Buchscanner“, zwei große Knöpfe „Buch / Dokument mit Text“ und „Normaler Scan“ (jeweils mindestens 60 px hoch, volle Breite) und unten klein die Versionsnummer (z. B. „Version 0.1.0“).
- [x] AK3: Angenommen F02 ist noch nicht gebaut, wenn man einen der beiden Knöpfe antippt, dann erscheint der Hinweis „Kommt bald“ und sonst passiert nichts.
- [x] AK4: Angenommen man wählt in Safari „Zum Home-Bildschirm“, dann erscheint das App-Icon (aufgeschlagenes Buch mit Scan-Linie) mit dem Namen „Buchscanner“, und beim Start aus dem Home-Bildschirm öffnet sich die App ohne Safari-Adressleiste (Vollbild).
- [x] AK5: Angenommen die App wurde einmal mit Internet geöffnet, wenn das iPhone im Flugmodus ist und man die App vom Home-Bildschirm startet, dann erscheint die Startseite vollständig (keine Fehlerseite von Safari).
- [x] AK6: Angenommen eine neue Version wurde hochgeladen, wenn man die App mit Internet öffnet, dann erscheint innerhalb von 10 Sekunden der Hinweis „Neue Version verfügbar“ mit dem Knopf „Neu laden“; erst nach Tippen auf „Neu laden“ läuft die neue Version, und die Versionsnummer unten zeigt die neue Nummer.
- [x] AK7: Angenommen das iPhone ist auf Hell- oder Dunkelmodus gestellt, dann folgt die App automatisch (heller bzw. dunkler Hintergrund, Text gut lesbar, Kontrast mind. 4,5:1), Akzentfarbe ist ein ruhiges Blau.
- [x] AK8: Angenommen ein iPhone mit Notch/Dynamic Island, dann liegt kein Inhalt unter der Statusleiste oder dem Home-Balken, und es gibt keinen waagerechten Bildlauf bei 375 px Breite.
- [x] AK9: Die Seite lädt keine Dateien von fremden Servern (keine CDNs, keine Schriften von Google, kein Tracking); alle Dateien liegen im Repo.
- [x] AK10: Lokal startet die App mit `cd app && python3 -m http.server 5190` unter http://localhost:5190 und sieht dort genauso aus.

## Nicht im Umfang
- Kamera, Scannen, Texterkennung, Speichern (ab F02).
- Eigene Domain (die github.io-Adresse reicht).
- Android-Optimierung, Desktop-Layout über das Nötigste hinaus.
- Einstellungen, Sprachauswahl der Oberfläche (nur Deutsch).

## Sonderfälle
- Erster Start ohne Internet: geht nicht (die App muss einmal online geladen worden sein); das ist bei Web-Apps so und wird hingenommen.
- iOS kann den Offline-Speicher einer Web-App nach längerer Nichtbenutzung löschen. Dann lädt sie beim nächsten Start mit Internet einfach neu.
- Neue Version, während die App im Hintergrund war: Hinweis erscheint beim Zurückkehren (bzw. spätestens beim nächsten Start).

## Entscheidungen
- Hosting → GitHub Pages statt Netlify, weil Netlify-Credits fürs ganze Konto gelten und La Romantica gefährden würden. Code ist dabei öffentlich, enthält aber keine Schlüssel oder Daten. (2026-11-15)
- Startseite → zwei große Knöpfe mit „Kommt bald“ als Platzhalter. (2026-11-15)
- Aussehen → schlicht, folgt Hell/Dunkel des iPhones, ruhiges Blau, Icon aufgeschlagenes Buch mit Scan-Linie. (2026-11-15)
- Updates → Hinweis mit Knopf „Neu laden“, kein stilles Aktualisieren. (2026-11-15)

## Offene Fragen
- Ist `gh` mit deinem GitHub-Konto angemeldet? Wird beim Umsetzen geprüft; sonst einmal `gh auth login`.
