// Buchscanner – Startseite, Hinweise, Offline-Betrieb und Update-Hinweis.
// Versionsnummer auch in sw.js ändern (werkzeuge/version.sh macht beides).
const VERSION = '0.5.0';

document.getElementById('version').textContent = VERSION;

// Kurzer Hinweis-Balken unten
const hinweis = document.getElementById('hinweis');
let hinweisTimer;
function zeigeHinweis(text) {
  hinweis.textContent = text;
  hinweis.hidden = false;
  clearTimeout(hinweisTimer);
  hinweisTimer = setTimeout(() => { hinweis.hidden = true; }, 2500);
}

// Service Worker: offline starten und über neue Versionen informieren
if ('serviceWorker' in navigator) {
  const updateLeiste = document.getElementById('update');
  const updateKnopf = document.getElementById('update-knopf');
  let wartend = null;
  let neuLadenGewuenscht = false;

  function zeigeUpdate(worker) {
    wartend = worker;
    updateLeiste.hidden = false;
  }

  function beobachte(worker) {
    worker.addEventListener('statechange', () => {
      // Nur melden, wenn schon eine Version läuft (nicht beim allerersten Besuch)
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        zeigeUpdate(worker);
      }
    });
  }

  updateKnopf.addEventListener('click', () => {
    if (!wartend) return;
    neuLadenGewuenscht = true;
    updateKnopf.disabled = true;
    wartend.postMessage('aktivieren');
  });

  // Neu laden erst, wenn der Nutzer es wollte und die neue Version übernommen hat
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (neuLadenGewuenscht) window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      if (reg.waiting && navigator.serviceWorker.controller) zeigeUpdate(reg.waiting);
      if (reg.installing) beobachte(reg.installing);
      reg.addEventListener('updatefound', () => beobachte(reg.installing));

      // Beim Zurückkehren in die App nach einer neuen Version sehen
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (fehler) {
      console.warn('Service Worker nicht verfügbar:', fehler);
    }
  });
}
