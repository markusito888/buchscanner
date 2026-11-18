// Buchscanner – Service Worker (Offline-Cache).
// Jede Änderung dieser Datei gilt als neue Version. Versionsnummer auch in app.js ändern.
const VERSION = '0.5.2';
const CACHE = `buchscanner-${VERSION}`;
// Texterkennung (Tesseract): groß, wird erst beim ersten Gebrauch geladen und bleibt bei App-Updates erhalten
const TESS_CACHE = 'texterkennung-7.0.0';

const DATEIEN = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'speicher.js',
  'pdf.js',
  'texterkennung.js',
  'scan.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  // Neu laden, damit keine alten Dateien aus dem Browser-Cache übernommen werden
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(DATEIEN.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
  // Kein skipWaiting: die neue Version wartet, bis der Nutzer „Neu laden“ tippt
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(
        namen.filter((n) => (n.startsWith('buchscanner-') && n !== CACHE) || (n.startsWith('texterkennung-') && n !== TESS_CACHE))
          .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'aktivieren') self.skipWaiting();
});

// Erst aus dem Cache, sonst aus dem Netz (die App-Dateien sind alle im Cache)
self.addEventListener('fetch', (event) => {
  const anfrage = event.request;
  const url = new URL(anfrage.url);
  if (anfrage.method !== 'GET' || url.origin !== self.location.origin) return;

  // Texterkennung: aus dem eigenen Cache, sonst einmal laden und dort ablegen
  if (url.pathname.includes('/vendor/tesseract/')) {
    event.respondWith(caches.open(TESS_CACHE).then(async (cache) => {
      const treffer = await cache.match(anfrage, { ignoreSearch: true });
      if (treffer) return treffer;
      const antwort = await fetch(anfrage);
      if (antwort.ok) await cache.put(url.pathname, antwort.clone());
      return antwort;
    }));
    return;
  }

  event.respondWith(
    caches.match(anfrage, { ignoreSearch: true }).then((treffer) => {
      if (treffer) return treffer;
      return fetch(anfrage).catch(() => {
        // Offline und nicht im Cache: bei Seitenaufrufen die Startseite liefern
        if (anfrage.mode === 'navigate') return caches.match('./');
        return Response.error();
      });
    })
  );
});
