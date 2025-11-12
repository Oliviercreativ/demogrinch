<!-- components/NotificationToggle.vue - Toggle simple sur une ligne -->
<template>
  <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <!-- Texte et description -->
    <div class="flex items-center gap-3">
      <span class="text-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 stroke-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </span>
      <div>
        <p class="font-semibold text-blue-800 dark:text-white">Notifications</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          {{ isEnabled ? 'Vous recevez les notifications' : 'Activer pour recevoir les offres' }}
        </p>
      </div>
    </div>

    <!-- Toggle switch -->
    <button 
      @click="toggle"
      :disabled="loading"
      class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 disabled:opacity-50"
      :class="isEnabled ? 'bg-green-500' : 'bg-gray-300'"
      role="switch"
      :aria-checked="isEnabled"
    >
      <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
      <span 
        v-else
        class="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200"
        :class="isEnabled ? 'translate-x-7' : 'translate-x-1'"
      ></span>
    </button>
  </div>

  <!-- Message d'erreur -->
  <div v-if="errorMessage" class="mt-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
    <p class="text-sm text-red-600 dark:text-red-200">❌ {{ errorMessage }}</p>
  </div>

  <!-- Message de succès -->
  <div v-if="successMessage" class="mt-2 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
    <p class="text-sm text-green-600 dark:text-green-200">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseUser } from '#imports'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { requestPermission, saveTokenForUser, sendTestNotification, getUserActiveTokens } = useFirebaseMessaging()

const isEnabled = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Vérifier l'état au montage
onMounted(async () => {
  await checkNotificationStatus()
})

// Mettre à jour quand l'utilisateur change
watch(user, () => {
  checkNotificationStatus()
})

async function checkNotificationStatus() {
  if (!user.value) {
    isEnabled.value = false
    return
  }

  try {
    // Vérifier si l'utilisateur a des tokens actifs
    const tokens = await getUserActiveTokens(user.value.id)
    isEnabled.value = tokens && tokens.length > 0
  } catch (error) {
    console.error('Erreur vérification status:', error)
    isEnabled.value = false
  }
}

async function toggle() {
  if (!user.value) {
    errorMessage.value = 'Vous devez être connecté'
    setTimeout(() => { errorMessage.value = '' }, 3000)
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isEnabled.value) {
      // Désactiver
      await disableNotifications()
    } else {
      // Activer
      await enableNotifications()
    }
  } catch (error) {
    console.error('Erreur toggle:', error)
    errorMessage.value = error.message || 'Une erreur est survenue'
    setTimeout(() => { errorMessage.value = '' }, 5000)
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

    console.log('✅ Token obtenu')

    // Sauvegarder le token en base
    await saveTokenForUser(token, user.value.id)
    console.log('✅ Token sauvegardé')

    // Récupérer le prénom pour la notification de bienvenue
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.value.id)
      .single()
    
    const userName = profile?.full_name?.split(' ')[0]

    // Notification de bienvenue personnalisée
    await sendTestNotification(userName)

    isEnabled.value = true
    successMessage.value = '🎉 Notifications activées !'
    setTimeout(() => { successMessage.value = '' }, 3000)

  } catch (error) {
    console.error('❌ Erreur activation:', error)
    isEnabled.value = false
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

    isEnabled.value = false
    successMessage.value = 'Notifications désactivées'
    setTimeout(() => { successMessage.value = '' }, 3000)

  } catch (error) {
    console.error('❌ Erreur désactivation:', error)
    throw error
  }
}
</script>

