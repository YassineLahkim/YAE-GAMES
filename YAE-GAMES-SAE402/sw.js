/******************
  Pour mieux comprendre ce script, voir : https://css-tricks.com/serviceworker-for-offline/
*******************/

var version = 'v1:0:0';

self.addEventListener("install", function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(version + 'fundamentals')
      .then(function(cache) {
        return cache.addAll([
          '/',
          'index.html',
          'jardin.html',
          'yassineindex.html',
          'accueil.html',
          'jeu.html',
          'jeu1.html',
          'win.html',
          'velo.html',
          'erkanindex.html',
          'Victoire.html',
          'musee.html',
          'game3.html',
          'standardmode.html',
          'blindModePage.html',
          'paintingroom.html',
          'manifest.json'
        ]);
      })
  );
});

self.addEventListener("fetch", function(event) {
  // On ne gère que les requêtes GET HTTP(S) hors Workbox, et on ignore les requêtes Range
  if (
    event.request.url.indexOf('http') === 0 &&
    event.request.method === 'GET' &&
    !event.request.headers.has('range')
  ) {
    event.respondWith(
      caches.match(event.request).then(function(cachedResponse) {
        // Lance la requête réseau en parallèle
        var networkFetch = fetch(event.request)
          .then(function(response) {
            // Ne stocke en cache que les réponses complètes (status 200)
            if (response.status === 200) {
              var copy = response.clone();
              caches.open(version + 'pages').then(function(cache) {
                cache.put(event.request, copy);
              });
            }
            return response;
          })
          .catch(function() {
            // En cas d'erreur réseau, on renvoie s'il existe la réponse en cache
            return cachedResponse || new Response(
              "<h1>Cette ressource n'est pas disponible hors ligne</h1>", {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/html' })
              }
            );
          });

        // On renvoie d'abord le cache s'il existe, sinon on attend le réseau
        return cachedResponse || networkFetch;
      })
    );
  }
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) {
            return !key.startsWith(version);
          })
          .map(function(key) {
            return caches.delete(key);
          })
      );
    })
  );
});
