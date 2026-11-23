// Service worker Plumiverse : l'application fonctionne hors ligne.
// Pages (HTML) : réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau.
// Fichiers versionnés (JS, CSS, sons, images) : cache d'abord.
// un cache par version (sw.js?v=3.0.0) : à chaque nouvelle version, les anciens fichiers sont effacés
const CACHE = "plumiverse-" + (new URL(location.href).searchParams.get("v") || "dev");
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.headers.get("accept")?.includes("text/html");
  if (isPage || req.url.endsWith("manifest.json")) {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; })));
});
