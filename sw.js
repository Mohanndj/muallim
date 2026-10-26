// Offline support for «مساعد المعلم»: the app's files network first (the cache when there is no
// connection), and the fonts from the cache once fetched.
const VERSION = 9;
const CACHE = `muallim-v${VERSION}`;
const ASSETS = ['./', './index.html', './style.css', './fa.js', './core.js', './app.js', './tools.js', './student.js', './portfolio.js', './exams.js', './prep.js',
  './xlsx-read.js', './xlsx.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('muallim-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? (await cache.match('./index.html')) || Response.error() : Response.error());
      }
    })());
    return;
  }
  if (!/^https:\/\/fonts\.(googleapis|gstatic)\.com$/.test(url.origin)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch { return Response.error(); }
  })());
});
