import {getMessaging, getToken, onMessage} from 'firebase/messaging'
import {
  registerServiceWorker,
  waitForServiceWorkerActivation
} from '@/utils/service-worker-util'
export const useNotifications = () => {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()
  const isServerEnvironment = () => typeof window === 'undefined'
  const requestPermission = async () => {
    if (isServerEnvironment()) {
      console.log(
        'Environnement serveur détecté, impossible de demander la permission'
      )
      return null
    }
    try {
      const swRegistration = await registerServiceWorker()
      if (!swRegistration) {
        throw new Error("Échec de l'enregistrement du Service Worker")
      }
      const isActive = await waitForServiceWorkerActivation(swRegistration)
      if (!isActive) {
        throw new Error("Le Service Worker n'a pas pu être activé")
      }
      const permission = await Notification.requestPermission()
      console.log('Statut de la permission:', permission)

      if (permission === 'granted') {
        const messaging = getMessagingInstance()
        if (!messaging) {
          throw new Error("Firebase Messaging n'est pas disponible")
        }
        if (!config.public.vapidKey) {
          throw new Error("La clé VAPID n'est pas définie")
        }
        const token = await getToken(messaging, {
          vapidKey: config.public.vapidKey,
          serviceWorkerRegistration: swRegistration
        })
        console.log('Token FCM obtenu:')
        return token
      } else {
        console.log('Permission refusée pour les notifications')
        return null
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error.message)
      return null
    }
  }
  const listenToMessages = () => {
    if (typeof window === 'undefined') {
      console.log(
        "Environnement serveur détecté, impossible d'écouter les messages"
      )
      return
    }
    let messaging
    try {
      messaging = getMessaging(nuxtApp.$firebase.app)
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation de Firebase Messaging:",
        error
      )
      return
    }
    if (!messaging) {
      console.log(
        "Firebase Messaging n'est pas disponible pour écouter les messages"
      )
      return
    }
    onMessage(messaging, (payload) => {
      console.log('Message reçu au premier plan:', payload)
      const {notification} = payload
      if (notification) {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon
        })
      }
    })
    console.log('Écoute des messages configurée')
  }
  return {
    requestPermission,
    listenToMessages
  }
}