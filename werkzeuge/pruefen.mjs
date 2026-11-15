// Prüft die App in Chrome (headless) wie auf einem iPhone: Screenshots hell/dunkel,
// waagerechter Bildlauf, Fremd-Anfragen, Service Worker, Offline-Start.
// Aufruf: node werkzeuge/pruefen.mjs [adresse] [ausgabeordner]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ADRESSE = process.argv[2] || 'http://127.0.0.1:5190/';
const AUS = process.argv[3] || '.';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

const profil = mkdtempSync(join(tmpdir(), 'bs-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profil}`, 'about:blank'], { stdio: 'ignore' });

const warte = (ms) => new Promise((r) => setTimeout(r, ms));
let ziel;
for (let i = 0; i < 50 && !ziel; i++) {
  try { ziel = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page'); }
  catch { await warte(200); }
}
const ws = new WebSocket(ziel.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const offen = new Map(); const anfragen = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && offen.has(m.id)) { offen.get(m.id)(m); offen.delete(m.id); }
  if (m.method === 'Network.requestWillBeSent') anfragen.push(m.params.request.url);
});
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; offen.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const js = async (ausdruck) => (await cdp('Runtime.evaluate', { expression: ausdruck, awaitPromise: true, returnByValue: true })).result?.result?.value;

await cdp('Network.enable');
await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 740, deviceScaleFactor: 2, mobile: true });

const ergebnis = {};
for (const modus of ['light', 'dark']) {
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: modus }] });
  await cdp('Page.navigate', { url: ADRESSE });
  await warte(1500);
  const bild = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(AUS, `screen-${modus}.png`), Buffer.from(bild.result.data, 'base64'));
  ergebnis[modus] = await js(`({ bildlauf: document.documentElement.scrollWidth > innerWidth,
    hintergrund: getComputedStyle(document.body).backgroundColor,
    version: document.getElementById('version').textContent })`);
}

// Kommt bald
ergebnis.kommtBald = await js(`(async () => { document.querySelector('[data-funktion=scan]').click();
  const h = document.getElementById('hinweis'); return { sichtbar: !h.hidden, text: h.textContent }; })()`);

// Service Worker und Offline
ergebnis.serviceWorker = await js(`navigator.serviceWorker.ready.then(r => !!r.active)`);
await cdp('Page.reload'); await warte(1000);
ergebnis.kontrolliert = await js(`!!navigator.serviceWorker.controller`);
await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await cdp('Page.navigate', { url: ADRESSE }); await warte(1500);
ergebnis.offline = await js(`document.querySelector('h1')?.textContent`);

const fremd = [...new Set(anfragen)].filter((u) => !u.startsWith(new URL(ADRESSE).origin) && !u.startsWith('data:'));
ergebnis.fremdAnfragen = fremd;
console.log(JSON.stringify(ergebnis, null, 2));
ws.close(); chrome.kill();
