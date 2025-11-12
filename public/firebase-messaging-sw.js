// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js'
)

let messaging = null

// Écouter les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    // Initialiser Firebase avec la config reçue
    firebase.initializeApp(event.data.config)
    messaging = firebase.messaging()

    // Configurer les notifications en arrière-plan
    messaging.onBackgroundMessage((payload) => {
      console.log('📱 Message reçu en arrière-plan:', payload)

      const notificationTitle = payload.notification?.title || 'Grinch'
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: payload.data?.tag || 'grinch-notification',
        data: payload.data || {},
        requireInteraction: true,
        actions: [
          {
            action: 'open',
            title: 'Ouvrir'
          },
          {
            action: 'dismiss',
            title: 'Ignorer'
          }
        ]
      }

      return self.registration.showNotification(
        notificationTitle,
        notificationOptions
      )
    })
  }
})

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Ouvrir l'app ou focus si déjà ouverte
  event.waitUntil(
    clients
      .matchAll({type: 'window', includeUncontrolled: true})
      .then((clientList) => {
        // Si l'app est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }

        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.url || '/'
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
