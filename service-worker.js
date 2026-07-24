const CACHE_NAME="recipe-matcher-v1";

const FILES=[

"./",

"./index.html",

"./style.css",

"./data.js",

"./app.js",

"./manifest.json",

"./icon-192.png",

"./icon-512.png"

];

self.addEventListener("install",event=>{

event.waitUntil(

caches.open(CACHE_NAME)

.then(cache=>cache.addAll(FILES))

);

self.skipWaiting();

});

self.addEventListener("activate",event=>{

event.waitUntil(

caches.keys().then(keys=>

Promise.all(

keys.map(key=>{

if(key!==CACHE_NAME){

return caches.delete(key);

}

})

)

)

);

self.clients.claim();

});

self.addEventListener("fetch",event=>{

event.respondWith(

caches.match(event.request)

.then(response=>

response||fetch(event.request)

)

);

});
