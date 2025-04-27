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
          'manifest.json',
          'style/stylesAccueil.css',
          'style/styleaccueil.css',
          'style/styleIndex.css',
          'style/stylejeu.css',
          'style/stylejeu1.css',
          'style/stylesjardin.css',
          'style/stylesmusee.css',
          'style/stylewin.css',
          'style/velo.css',
          'style/standardmode.css',
          'style/paintingroom.css',
          'style/game3.css',
          'style/menuetcarte.css',
          'style/blindmode.css',
          'style/erkanindex.css',
          'script/blindmode.js',
          'script/dialogue.js',
          'script/dialogue2.js',
          'script/erkanscript.js',
          'script/game3.js',
          'script/minimap.js',
          'script/paintingroom.js',
          'script/scriptindex.js',
          'script/scriptjeu.js',
          'script/scriptjeu1.js',
          'script/scriptwin.js',
          'script/standardmode.js',
          'script/velo.js',
          'script/yassineindex.js',
          'img/fond_11zon.webp',
          'img/img-obstacle1.webp',
          'img/img-obstacle2.webp',
          'img/img-obstacle3.webp',
          'img/img-obstacle4.webp',
          'img/img-velo.webp',
          'img/image-jeu.webp',
          'img/image-fond2.webp',
          'img/iconmap.png',
          'img/jardindessenteurs-min.webp',
          'img/jeucode-min.webp',
          'img/mulhouse_11zon.webp',
          'img/mulhouse.webp',
          'img/mulhouseciel_1_11zon.webp',
          'img/musee_11zon.webp',
          'img/musee-_2__11zon.webp',
          'img/museeint_11zon.webp',
          'img/museetableau_11zon.webp',
          'img/nuage 2_11zon.webp',
          'img/nuage-1_11zon.webp',
          'img/old_11zon.webp',
          'img/parc2-min.webp',
          'img/personnage-peur_11zon.webp',
          'img/princ_11zon.webp',
          'img/tableau_11zon.webp',
          'img/velo_11zon.webp',
          'img/icons/img/velo_11zon.webp',
          'img/icons/favicon-96x96.png',
          'img/icons/favicon-180x180.png',
          'img/icons/favicon-192x192.png',
          'img/icons/favicon-512x512.png',
          'son/1.mp3',
          'son/2.mp3',
          'son/3.mp3',
          'son/4.mp3',
          'son/5.mp3',
          'son/6.mp3',
          'son/7.mp3',
          'son/8.mp3',
          'son/9.mp3',
          'son/game-over.mp3',
          'son/piano.mp3',
          'son/proximity.mp3',
          'son/Séquence 01.mp3',
          'son/Séquence 02.mp3',
          'son/Séquence 03.mp3',
          'son/trap.mp3',
          'son/victory.mp3',
          'sons/game-over.mp3',
          'sons/proximity.mp3',
          'sons/trap.mp3',
          'sons/victory.mp3'
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
