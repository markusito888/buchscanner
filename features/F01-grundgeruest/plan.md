# Plan F01
## Ansatz
Statische PWA im Ordner `app/` ohne Build-Schritt: `index.html`, `style.css`, `app.js`, `sw.js` (Service Worker), `manifest.webmanifest`, `icons/`. Der Service Worker legt alle App-Dateien in einen Cache, dessen Name die Versionsnummer enthält; eine geänderte `sw.js` gilt als neue Version. Die Seite erkennt einen wartenden neuen Service Worker und zeigt den Hinweis „Neue Version verfügbar – Neu laden“; erst der Knopf aktiviert ihn (skipWaiting) und lädt neu. Veröffentlicht wird über einen GitHub-Actions-Workflow, der `app/` nach GitHub Pages lädt.

## Aufgaben
- [ ] 1. Icon als SVG zeichnen, PNGs (180, 192, 512) mit Chrome headless erzeugen → AK4
- [ ] 2. `manifest.webmanifest` + Apple-Meta-Tags (Vollbild, Icon, Name) → AK4
- [ ] 3. `index.html` + `style.css`: Titel, zwei Knöpfe, Version, Hell/Dunkel, Safe-Area, keine Fremd-Dateien → AK2, AK7, AK8, AK9
- [ ] 4. `app.js`: „Kommt bald“-Hinweis, Versionsanzeige, Service-Worker-Registrierung, Update-Hinweis, Update-Prüfung beim Zurückkehren → AK3, AK6
- [ ] 5. `sw.js`: Dateien cachen, offline aus dem Cache liefern, alte Caches löschen, skipWaiting auf Knopfdruck → AK5, AK6
- [ ] 6. `werkzeuge/version.sh`: Versionsnummer an beiden Stellen setzen → AK6
- [ ] 7. Lokal mit `python3 -m http.server 5190` testen, Screenshots hell/dunkel bei 375 px → AK7, AK8, AK10
- [ ] 8. GitHub-Repo (öffentlich), Pages-Workflow, Adresse prüfen → AK1

## Annahmen
- Repo-Name `buchscanner`, Adresse `https://<github-name>.github.io/buchscanner/`. Darum nur relative Pfade.
- Versionsnummer steht in `app.js` und `sw.js`; `werkzeuge/version.sh <neu>` ändert beide.
- „Kommt bald“ als kurzer Hinweis-Balken (2,5 s), kein Pop-up-Fenster.
- Flugmodus- und Home-Bildschirm-Tests (AK4, AK5, AK6) kann nur der Nutzer auf dem echten iPhone abschließend prüfen.
