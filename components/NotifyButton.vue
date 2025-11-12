// components/SubscribeButton.vue
<template>
  <div>
    <button 
      @click="subscribe" 
      class="px-4 py-2 rounded-lg text-white"
      :class="isSubscribed ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500'"
    >
      {{ isSubscribed ? 'Notifications activées' : 'S\'abonner aux notifications' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMessaging, getToken } from 'firebase/messaging'

const isSubscribed = ref(false)

// Vérifier si l'utilisateur est déjà abonné au chargement
onMounted(() => {
  if (typeof Notification !== 'undefined') {
    isSubscribed.value = Notification.permission === 'granted'
  }
})

const subscribe = async () => {
  try {
    if (isSubscribed.value) {
      return // Déjà abonné
    }

    // Demander la permission
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      const messaging = getMessaging()
      const token = await getToken(messaging, {
        vapidKey: useRuntimeConfig().public.vapidKey
      })

      if (token) {
        isSubscribed.value = true
        console.log('Token FCM:', token)
      }
    }
  } catch (err) {
    console.error('Erreur:', err)
  }
}
</script>