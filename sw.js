// Service worker: chay tu ban da luu trong may (cache-first), cap nhat ngam khi co mang.
// Nho vay app van mo duoc vinh vien ke ca khi khong co mang hoac link web bi go.
const CACHE = "kehoach-v3";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = e.request.mode === "navigate" ? "./index.html" : e.request;
    const cached = await cache.match(key, { ignoreSearch: true });
    // Cap nhat ngam: chi luu ban moi neu tai thanh cong (200 OK), khong bao gio ghi de bang trang loi.
    const update = fetch(e.request).then(r => { if (r && r.ok && r.type === "basic") cache.put(key, r.clone()); return r; }).catch(() => null);
    if (cached) { e.waitUntil(update); return cached; }
    const fresh = await update;
    return fresh || new Response("Offline", { status: 503 });
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(cs => cs.length ? cs[0].focus() : clients.openWindow("./")));
});
