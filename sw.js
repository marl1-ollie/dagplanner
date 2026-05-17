/* ══ Dagplanner Service Worker ══ */
const CACHE = 'dagplanner-v1';
const ASSETS = [
  './planner2026.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Barlow+Condensed:wght@400;600;700&display=swap',
];

// Installeren: sla alle assets op in cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Cache gedeeltelijk mislukt:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activeren: verwijder oude caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first voor eigen bestanden, network-first voor fonts
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Sla POST-requests en chrome-extension-requests over
  if (e.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Fonts: network first, val terug op cache
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Eigen bestanden: cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        const c = r.clone();
        caches.open(CACHE).then(ca => ca.put(e.request, c));
        return r;
      });
    })
  );
});
