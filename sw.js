const CACHE='wordmemo-v11.1.2-2026-07-24';
const CORE=['./','./index.html','./app-core.html','./v11.css?v=11.1.1','./v11.js?v=11.1.1','./v11.1-fixes.js?v=11.1.1','./diagnostics.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request,u=new URL(req.url);
  const navigation=req.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/');
  if(navigation){
    event.respondWith(fetch(req).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}
      return response;
    }).catch(()=>caches.match(req).then(x=>x||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>{
    if(cached)return cached;
    return fetch(req).then(response=>{
      if(response&&response.ok&&u.origin===location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}
      return response;
    });
  }));
});