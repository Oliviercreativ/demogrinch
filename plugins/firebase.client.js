// plugins/firebase.client.js
import {initializeApp, getApps, getApp} from 'firebase/app'
import {getMessaging, getToken, onMessage} from 'firebase/messaging'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.apiKey,
    authDomain: config.public.authDomain,
    projectId: config.public.projectId,
    storageBucket: config.public.storageBucket,
    messagingSenderId: config.public.messagingSenderId,
    appId: config.public.appId
  }

  let firebaseApp
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig)
  } else {
    firebaseApp = getApp()
  }

  let messaging = null
  if (typeof window !== 'undefined') {
    messaging = getMessaging(firebaseApp)

    // Écouter les messages en premier plan
    onMessage(messaging, (payload) => {
      console.log('📱 Message reçu en premier plan:', payload)

      // Afficher une notification custom si l'app est en focus
      if (document.hasFocus() && payload.notification) {
        const notification = new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/pwa-192x192.png',
          tag: 'foreground-notification'
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        setTimeout(() => notification.close(), 5000)
      }
    })
  }

  return {
    provide: {
      firebase: firebaseApp,
      messaging,
      getToken: async () => {
        if (!messaging) return null
        try {
          const token = await getToken(messaging, {
            vapidKey: config.public.vapidKey
          })
          return token
        } catch (error) {
          console.error('❌ Erreur FCM token:', error)
          return null
        }
      }
    }
  }
})
