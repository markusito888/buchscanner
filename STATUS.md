# Status: Buchscanner

**Stufe:** light
**Zuletzt aktualisiert:** 2026-11-15

## Features

| ID | Feature | Prio | Status | Hinweis |
|----|---------|------|--------|---------|
| F01 | App-Grundgerüst: PWA, Home-Bildschirm, offline, Netlify | P0 | idee | Grundlage für alles |
| F02 | Seiten aufnehmen: Kamera, Serienaufnahme, Seiten ordnen/löschen, Kontrast verbessern | P0 | idee | |
| F03 | Bibliothek: Scans auf dem iPhone speichern, benennen, später weiterscannen, löschen | P0 | idee | Bücher entstehen über mehrere Tage |
| F04 | Normaler Scan speichern: als Bild (Fotos) oder PDF (Dateien) | P0 | idee | |
| F05 | Texterkennung: Deutsch/Englisch/Spanisch, im Hintergrund, Text korrigierbar | P0 | idee | |
| F06 | Text-Export für Claude: Textdatei mit Seitenzahlen, kopieren, teilen; große Bücher in Teile aufteilen | P0 | idee | |
| F07 | Automatische Seitenerkennung: Ränder finden, schräge Seiten gerade ziehen | P1 | idee | |
| F08 | Doppelseiten teilen: aufgeschlagenes Buch, zwei Seiten in einem Foto | P1 | idee | |
| F09 | Zusammenfassung direkt in der App (Claude-API) | P1 | idee | Braucht API-Schlüssel, kostet pro Buch |

Status: `idee` → `spezifiziert` → `in-arbeit` → `in-pruefung` → `fertig` (oder `blockiert`)
Prio: `P0` = erste Version · `P1` = später

## Empfohlene Reihenfolge
1. F01 – Grundgerüst und Netlify-Adresse, damit wir von Anfang an auf dem iPhone testen.
2. F02 – Aufnehmen ist der Kern beider Funktionen.
3. F03 – Speichern, damit nichts verloren geht, wenn Safari die App schließt.
4. F04 – Normaler Scan ist damit schon fertig nutzbar.
5. F05 – Texterkennung.
6. F06 – Export an Claude.

## Offene Punkte
- Texterkennung im Browser ist langsamer und etwas ungenauer als Apples eigene. Bei F05 an echten Buchseiten testen, ob das reicht.
- Speicherplatz: Safari kann Website-Daten löschen, wenn die App lange nicht benutzt wird. Darum bei F03 „dauerhaft speichern“ anfragen und zum Export raten.
- Sehr große Bücher (300+ Seiten): Prüfen, wie viel Text die Claude-App auf einmal annimmt → bei F06 Aufteilung in Teile.
- Netlify-Konto: vorhandenes Konto (wie bei La Romantica) nutzen.
