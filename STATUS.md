# Status: Buchscanner

**Stufe:** light
**Zuletzt aktualisiert:** 2026-11-16

## Features

| ID | Feature | Prio | Status | Hinweis |
|----|---------|------|--------|---------|
| F01 | App-Grundgerüst: PWA, Home-Bildschirm, offline, GitHub Pages | P0 | fertig | Abgenommen 2026-11-16 · https://markusito888.github.io/buchscanner/ |
| F02 | Seiten aufnehmen: Kamera, Serienaufnahme, Seiten ordnen/löschen, Kontrast verbessern | P0 | fertig | Abgenommen 2026-11-16 (v0.2.1) · Nachbesserung v0.3.1: „Dokument“ erkennt hellen Text auf dunklem Grund (AK19, Prüfung mit F03) |
| F03 | Bibliothek: Scans auf dem iPhone speichern, über mehrere Tage weiterscannen, umbenennen, löschen; Buch-Bilder nur vorübergehend | P0 | in-pruefung | Buch: dauerhaft nur der Text |
| F04 | Normaler Scan speichern: als Bild (Fotos) oder PDF (Dateien) | P0 | idee | |
| F05 | Texterkennung: Deutsch/Englisch/Spanisch, im Hintergrund, Text pro Seite korrigierbar, schlechte Seiten markieren | P0 | idee | |
| F06 | Text-Export: .md (Claude/Claude Code) und EPUB (Kindle) über das Teilen-Menü, danach „Bilder löschen, Text behalten“; große Bücher in Teile | P0 | idee | Kein PDF für Buchtext |
| F07 | Automatische Seitenerkennung: Ränder finden, schräge Seiten gerade ziehen | P1 | idee | |
| F08 | Doppelseiten teilen: aufgeschlagenes Buch, zwei Seiten in einem Foto | P1 | idee | |
| F09 | Zusammenfassung direkt in der App (Claude-API) | P1 | idee | Braucht API-Schlüssel, kostet pro Buch |

Status: `idee` → `spezifiziert` → `in-arbeit` → `in-pruefung` → `fertig` (oder `blockiert`)
Prio: `P0` = erste Version · `P1` = später

## Empfohlene Reihenfolge
1. F01 – Grundgerüst und GitHub-Pages-Adresse, damit wir von Anfang an auf dem iPhone testen.
2. F02 – Aufnehmen ist der Kern beider Funktionen.
3. F03 – Speichern, damit nichts verloren geht, wenn Safari die App schließt.
4. F04 – Normaler Scan ist damit schon fertig nutzbar.
5. F05 – Texterkennung.
6. F06 – Export an Claude.

## Offene Punkte
- Texterkennung im Browser ist langsamer und etwas ungenauer als Apples eigene. Bei F05 an echten Buchseiten testen, ob das reicht.
- Speicherplatz: Safari kann Website-Daten löschen, wenn die App lange nicht benutzt wird. Darum bei F03 „dauerhaft speichern“ anfragen und zum Export raten.
- Sehr große Bücher (300+ Seiten): Prüfen, wie viel Text die Claude-App auf einmal annimmt → bei F06 Aufteilung in Teile.
- Hosting: GitHub Pages (entschieden 2026-11-15), nicht Netlify wegen der Credits.
- Speichern (entschieden 2026-11-16): Bilder dauerhaft nur beim normalen Scan. Beim Buch-Scan bleiben die Fotos nur, bis der Text erkannt und exportiert ist; dauerhaft bleibt der Text. Buchtext-Export als .md und EPUB (Kindle über „An Kindle senden“), kein PDF für Buchtext.
