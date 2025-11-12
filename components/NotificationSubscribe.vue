<!-- components/NotificationSubscribe.vue - Version FCM -->
<template>
  <div class="flex flex-col items-center justify-center gap-4 rounded-lg p-4 w-full">
    <p class="text-blue-800 dark:text-white text-center">Suivez l'actualité de Grinch en recevant nos notifications</p>
    
    <!-- Version bouton avec icône uniquement -->
    <button 
      v-if="iconOnly"
      @click="handleBellClick" 
      :disabled="loading"
      class="relative p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
      :title="bellOption.tooltipText"
    >
      <span v-if="loading" class="absolute -top-1 -right-1 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
      
      <svg v-if="bellState === BELL_STATE.DISABLED" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="[iconClass, bellOption.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      <svg v-else-if="bellState === BELL_STATE.SUBSCRIBE" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="[iconClass, bellOption.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="[iconClass, bellOption.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
      </svg>
    </button>
    
    <!-- Version bouton standard -->
    <button 
      v-else
      :class="buttonClass" 
      @click="handleBellClick"
      :disabled="loading"
      class="relative flex items-center justify-center text-center gap-2 disabled:opacity-50"
    >
      <span v-if="loading" class="inline-block mr-2">
        <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      
      <svg v-if="bellState === BELL_STATE.DISABLED" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      <svg v-else-if="bellState === BELL_STATE.SUBSCRIBE" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
      </svg>
      
      {{ bellOption.buttonText }}
    </button>
    
    <!-- Messages d'aide -->
    <div v-if="errorMessage" class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
      {{ errorMessage }}
    </div>
    
    <div v-if="bellState === BELL_STATE.DISABLED && !loading && Notification && Notification.permission === 'denied'" class="mt-2 text-sm text-cyan-600">
      ⚠️ Les notifications sont bloquées. Autorisez-les dans les paramètres de votre navigateur.
    </div>

    <div v-if="successMessage" class="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseUser } from '#imports'

const BELL_STATE = {
  DISABLED: 'disabled',
  SUBSCRIBE: 'subscribe',
  SUBSCRIBED: 'subscribed',
}

const props = defineProps({
  iconOnly: {
    type: Boolean,
    default: false
  },
  buttonClass: {
    type: String,
    default: 'bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded'
  },
  iconClass: {
    type: String,
    default: 'text-2xl'
  }
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { requestPermission, saveTokenForUser, sendTestNotification, getUserActiveTokens } = useFirebaseMessaging()

const bellState = ref(BELL_STATE.DISABLED)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const bellOption = computed(() => {
  switch (bellState.value) {
    case BELL_STATE.SUBSCRIBE:
      return {
        color: 'text-blue-600',
        tooltipText: 'Activer les notifications',
        buttonText: 'Activer les notifications'
      }
    case BELL_STATE.SUBSCRIBED:
      return {
        color: 'text-green-600',
        tooltipText: 'Notifications activées',
        buttonText: 'Notifications activées ✓'
      }
    case BELL_STATE.DISABLED:
    default:
      return {
        color: 'text-gray-600',
        tooltipText: 'Notifications désactivées',
        buttonText: 'Activer les notifications'
      }
  }
})

// Vérifier l'état au montage
onMounted(async () => {
  await updateBellState()
})

// Mettre à jour l'état quand l'utilisateur change
watch(user, () => {
  updateBellState()
})

async function updateBellState() {
  try {
    // Vérifier support du navigateur
    if (!('Notification' in window)) {
      bellState.value = BELL_STATE.DISABLED
      return
    }

    const permission = Notification.permission

    if (permission === 'denied') {
      bellState.value = BELL_STATE.DISABLED
      return
    }

    // Si l'utilisateur est connecté, vérifier s'il a des tokens actifs
    if (user.value) {
      const tokens = await getUserActiveTokens(user.value.id)
      if (tokens && tokens.length > 0) {
        bellState.value = BELL_STATE.SUBSCRIBED
        return
      }
    }

    // Permission accordée mais pas encore de token
    if (permission === 'granted') {
      bellState.value = BELL_STATE.SUBSCRIBED
    } else {
      bellState.value = BELL_STATE.SUBSCRIBE
    }

  } catch (error) {
    console.error('Erreur updateBellState:', error)
    bellState.value = BELL_STATE.SUBSCRIBE
  }
}

async function handleBellClick() {
  if (!user.value) {
    errorMessage.value = 'Vous devez être connecté pour activer les notifications'
    setTimeout(() => { errorMessage.value = '' }, 5000)
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (bellState.value === BELL_STATE.SUBSCRIBED) {
      // Désactiver les notifications
      await disableNotifications()
    } else {
      // Activer les notifications
      await enableNotifications()
    }
  } catch (error) {
    console.error('Erreur handleBellClick:', error)
    errorMessage.value = error.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

async function enableNotifications() {
  try {
    console.log('🔔 Activation des notifications...')
    
    // Demander la permission et obtenir le token
    const token = await requestPermission()
    
    if (!token) {
      throw new Error('Impossible d\'obtenir le token FCM')
    }

    console.log('✅ Token FCM obtenu:', token.substring(0, 30) + '...')

    // Sauvegarder le token en base avec user_id
    const result = await saveTokenForUser(token, user.value.id)
    console.log('✅ Token sauvegardé en base:', result.action)

    // Récupérer le prénom de l'utilisateur pour personnaliser la notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.value.id)
      .single()
    
    const userName = profile?.full_name?.split(' ')[0] // Prénom uniquement
    console.log('👤 Utilisateur:', userName || 'Inconnu')

    // Envoyer une notification de bienvenue personnalisée
    await sendTestNotification(userName)
    console.log('✅ Notification de bienvenue envoyée')

    successMessage.value = '🎉 Notifications activées avec succès !'
    setTimeout(() => { successMessage.value = '' }, 5000)

    // Mettre à jour l'état
    await updateBellState()

  } catch (error) {
    console.error('❌ Erreur activation:', error)
    throw error
  }
}

async function disableNotifications() {
  try {
    console.log('🔕 Désactivation des notifications...')

    // Désactiver tous les tokens de l'utilisateur
    const { error } = await supabase
      .from('user_fcm_tokens')
      .update({ active: false })
      .eq('user_id', user.value.id)

    if (error) throw error

    successMessage.value = 'Notifications désactivées'
    setTimeout(() => { successMessage.value = '' }, 3000)

    // Mettre à jour l'état
    await updateBellState()

  } catch (error) {
    console.error('❌ Erreur désactivation:', error)
    throw error
  }
}
</script>
