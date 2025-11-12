// Fichier service worker personnalisé pour Nuxt PWA

// Point d'injection pour Workbox
self.__WB_MANIFEST;

// Définir les routes à mettre en cache
const CACHE_NAME = 'grinch-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/main.css'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log('🔔 [SW] Notification cliquée:', event.notification)

  event.notification.close()

  // Récupérer l'URL depuis les données de la notification
  const url = event.notification.data?.click_action || event.notification.data?.url || event.notification.data?.link_url || '/'

  console.log('🔗 [SW] Redirection vers:', url)

  // Toujours ouvrir une nouvelle fenêtre/onglet pour permettre le multi-onglets
  // Ne pas focuser les onglets existants pour éviter les conflits
  event.waitUntil(
    clients.openWindow(url)
  )
})

// Stratégie de récupération des ressources
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retourner la réponse
        if (response) {
          return response;
        }

        // Pour les requêtes de navigation, utiliser preloadResponse si disponible
        if (event.request.mode === 'navigate') {
          return event.preloadResponse
            .then(preloadResponse => {
              if (preloadResponse) {
                return preloadResponse;
              }
              return fetch(event.request);
            })
            .catch(() => {
              return fetch(event.request);
            });
        }

        // Pour les autres requêtes
        return fetch(event.request);
      })
      .catch(() => {
        // En cas d'erreur, retourner une page offline si c'est une navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});
