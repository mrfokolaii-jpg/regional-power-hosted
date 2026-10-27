const CACHE='guardians-v2';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/manifest.webmanifest','/icon.svg']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==='navigate'){
      try{const fresh=await fetch(request);cache.put(request,fresh.clone());return fresh;}
      catch{return (await cache.match(request))||cache.match('/');}
    }
    const cached=await cache.match(request);
    if(cached)return cached;
    try{const fresh=await fetch(request);if(fresh.ok)cache.put(request,fresh.clone());return fresh;}
    catch{return cache.match('/');}
  })());
});
