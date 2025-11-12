<template>
  <div class="p-4">
    <div v-if="token" class="mb-4 p-4 bg-green-100 rounded">
      <p class="text-sm">Token FCM obtenu !</p>
      <p class="text-xs break-all mt-2">{{ token }}</p>
    </div>

    <button 
      @click="setupNotifications" 
      class="px-4 py-2 bg-blue-500 text-white rounded"
      v-if="!token"
    >
      Activer les notifications
    </button>

    <button 
      @click="sendTestNotification" 
      class="px-4 py-2 bg-blue-500 text-white rounded"
      v-else
    >
      Envoyer notification test
    </button>

    <div v-if="error" class="mt-4 p-4 bg-red-100 rounded text-red-700">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMessaging, getToken } from 'firebase/messaging'

const token = ref('')
const error = ref('')

const setupNotifications = async () => {
  try {
    error.value = ''

    // 1. Vérifier si le navigateur supporte les Service Workers
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers non supportés par ce navigateur')
    }

    // 2. Demander la permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Permission de notification refusée')
    }

    // 3. Enregistrer le Service Worker
    await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // 4. Attendre que le Service Worker soit actif
    await navigator.serviceWorker.ready

    // 5. Obtenir le token FCM
    const messaging = getMessaging()
    const currentToken = await getToken(messaging, {
      vapidKey: useRuntimeConfig().public.vapidKey
    })

    if (!currentToken) {
      throw new Error('Impossible d\'obtenir le token FCM')
    }

    token.value = currentToken
    console.log('Token FCM obtenu:', currentToken)
  } catch (err) {
    console.error('Erreur de configuration:', err)
    error.value = err.message
  }
}

const sendTestNotification = async () => {
  try {
    const notification = new Notification('Test', {
      body: 'Notification de test ' + new Date().toLocaleTimeString(),
      icon: '/pwa-512x512.png'
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch (err) {
    error.value = 'Erreur lors de l\'envoi de la notification'
    console.error(err)
  }
}

// Vérifier le statut au chargement
onMounted(async () => {
  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const messaging = getMessaging()
        const currentToken = await getToken(messaging, {
          vapidKey: useRuntimeConfig().public.vapidKey,
          serviceWorkerRegistration: registration
        })
        if (currentToken) {
          token.value = currentToken
          console.log('Token existant:', currentToken)
        }
      }
    } catch (err) {
      console.error('Erreur d\'initialisation:', err)
    }
  }
})
</script>