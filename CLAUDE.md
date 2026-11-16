# Buchscanner

Web-App fürs iPhone (wird auf den Home-Bildschirm gelegt): Dokumente und ganze Bücher schnell Seite für Seite scannen, den Text per Texterkennung erfassen und als Datei an die Claude-App weitergeben, damit Claude daraus eine Zusammenfassung macht. Außerdem ein normaler Scan, der als Bild (Fotos) oder PDF (Dateien) gespeichert wird. Nur für den eigenen Gebrauch.

## Technik
- Reines HTML/CSS/JavaScript als PWA (Progressive Web App), kein Build-Schritt.
- Texterkennung: Tesseract.js 7 im Browser, feste Kopie in `app/vendor/tesseract/` (Sprachen Deutsch, Englisch, Spanisch, Daten „best_int“, werden beim ersten Gebrauch geladen und vom Service Worker im Cache `texterkennung-7.0.0` behalten). PDF: eigener kleiner Erzeuger (`app/pdf.js`, nur Bilder, A4). Speicher: IndexedDB auf dem iPhone.
- Speichern/Teilen über das Teilen-Menü von iOS (Web Share API): „Bild sichern“ → Fotos, „In Dateien sichern“, „Claude“.
- Hosting: GitHub Pages (öffentliches Repo, nur Auslieferung der App, keine Daten auf dem Server). Nicht Netlify: die Credits gelten fürs ganze Konto und würden La Romantica gefährden. Die Kamera braucht https.
- Starten (lokal): `cd app && python3 -m http.server 5190` → http://localhost:5190 · Testen auf dem iPhone: über die GitHub-Pages-Adresse.

## Struktur
- `app/` – die Web-App (index.html, CSS, JS, manifest, Service Worker); wird per `.github/workflows/pages.yml` bei jedem Push auf main veröffentlicht
- `werkzeuge/version.sh <neu>` – Versionsnummer in app.js und sw.js setzen (bei jeder Änderung an der App nötig, sonst kein Update-Hinweis)
- `werkzeuge/pruefen.mjs [adresse] [ordner]` – Prüfung in Chrome wie auf dem iPhone (Screenshots hell/dunkel, Bildlauf, Fremd-Anfragen, offline)
- `features/` – je Feature ein Ordner mit `spec.md`, `plan.md`, `qa.md`
- `STATUS.md` – Stand aller Features (immer aktuell halten)

## Arbeitsweise (Spec-Workflow, Stufe siehe STATUS.md)
- Neue Features: `/spec` → `/umsetzen` → `/qa`. Kleinigkeiten (Text, Farbe, kleiner Fix) direkt.
- Nichts bauen, was nicht in der Spec steht. Annahmen offen nennen statt still treffen.
- Ideen kritisch prüfen und Einwände nennen, nicht einfach zustimmen.
- Bei Fremd-Bibliotheken/APIs aktuelle Doku über Context7 holen.

## Regeln
- Oberfläche auf Deutsch, einfache Worte, große Tasten (Bedienung mit einer Hand).
- Scans und Texte verlassen das iPhone nur, wenn der Nutzer sie selbst teilt. Keine Analyse-Dienste, kein Tracking.
- Bibliotheken fest einbinden (eigene Kopie in `app/vendor/`), damit die App offline läuft.
- Muss in Safari auf dem iPhone funktionieren, dort testen (nicht nur am Mac).
