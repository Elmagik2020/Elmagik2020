const CACHE='elmagik-app-shell-v9';;
const SHELL=['./app.html','./app.js','./workflow.js','./manifest.webmanifest','./assets/app-icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).catch(()=>req.mode==='navigate'?caches.match('./app.html'):Promise.reject(new Error('Offline resource unavailable')))));
});