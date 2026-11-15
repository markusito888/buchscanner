# Buchscanner

Web-App fürs iPhone (wird auf den Home-Bildschirm gelegt): Dokumente und ganze Bücher schnell Seite für Seite scannen, den Text per Texterkennung erfassen und als Datei an die Claude-App weitergeben, damit Claude daraus eine Zusammenfassung macht. Außerdem ein normaler Scan, der als Bild (Fotos) oder PDF (Dateien) gespeichert wird. Nur für den eigenen Gebrauch.

## Technik
- Reines HTML/CSS/JavaScript als PWA (Progressive Web App), kein Build-Schritt.
- Texterkennung: Tesseract.js im Browser (Sprachen Deutsch, Englisch, Spanisch). PDF: jsPDF. Speicher: IndexedDB auf dem iPhone.
- Speichern/Teilen über das Teilen-Menü von iOS (Web Share API): „Bild sichern“ → Fotos, „In Dateien sichern“, „Claude“.
- Hosting: Netlify (nur Auslieferung der App, keine Daten auf dem Server). Die Kamera braucht https.
- Starten (lokal): `cd app && python3 -m http.server 5190` → http://localhost:5190 · Testen auf dem iPhone: über die Netlify-Adresse.

## Struktur
- `app/` – die Web-App (index.html, CSS, JS, manifest, Service Worker)
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
