// Lets the installed app open without internet. The app's own files are network-first, so updates still arrive
// as soon as the user is online; user data is never touched here (it lives in localStorage and IndexedDB).
const CACHE = "itachi-journaling-v1";
const SHELL = ["./", "manifest.json", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"];
const PINNED_HOSTS = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if(url.origin === location.origin){
    // version.json must always come from the network, otherwise updates would never be noticed
    if(url.pathname.endsWith("/version.json")) return;
    e.respondWith(networkFirst(e.request));
  }else if(PINNED_HOSTS.includes(url.hostname)){
    e.respondWith(cacheFirst(e.request));
  }
});
async function networkFirst(req){
  const cache = await caches.open(CACHE);
  try{
    // The query skips GitHub's CDN, which can serve an old copy for 10 minutes after a publish
    const fresh = new URL(req.url);
    fresh.searchParams.set("_", Date.now());
    const res = await fetch(fresh, {cache: "no-store"});
    if(res.ok) cache.put(req.url, res.clone());
    return res;
  }catch(err){
    const hit = await cache.match(req.url, {ignoreSearch: true}) || (req.mode === "navigate" ? await cache.match("./") : null);
    if(hit) return hit;
    throw err;
  }
}
// The Firebase SDK version and the fonts are pinned, so a cached copy stays valid
async function cacheFirst(req){
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if(hit) return hit;
  const res = await fetch(req);
  if(res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}
