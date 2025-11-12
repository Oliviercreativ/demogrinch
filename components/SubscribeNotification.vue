<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useNuxtApp } from '#app'

const { $messaging, $getToken } = useNuxtApp()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const email = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const shareEmail = ref(false)
const notificationsEnabled = ref(false)

const isNotificationSupported = 'Notification' in window

onMounted(async () => {
  try {
    const fcmToken = await enableNotifications()
    if (fcmToken) {
      notificationsEnabled.value = true
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du token FCM:', e)
  }
})

const enableNotifications = async () => {
  try {
    console.log('Demande de permission de notification...');
    const permission = await Notification.requestPermission();
    console.log('Permission accordée :', permission);

    if (permission === 'granted') {
      console.log('Récupération du token FCM...');
      const token = await $getToken();
      console.log('Token FCM :', token);
      return token;
    } else {
      console.error('Permissions de notification refusées.');
      return null;
    }
  } catch (error) {
    if (error.code === 'messaging/failed-service-worker-registration') {
      console.error('Erreur lors de l\'enregistrement du service worker:', error);
    } else {
      console.error('Erreur lors de la récupération du token FCM:', error);
    }
    return null;
  }
};

const handleSubmit = async () => {
  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    // Récupérer d'abord le full_name de la table profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.value?.id)
      .single()

    if (profileError) throw profileError

    // Vérifier si l'email existe déjà
    const { data: existingEmail, error: checkError } = await supabase
      .from('newsletters')
      .select('id')
      .eq('email', email.value.toLowerCase())
      .maybeSingle()

    if (existingEmail) {
      error.value = "Vous êtes déjà inscrit à notre newsletter ! 📧"
      return
    }

    // Insertion dans Supabase avec le token FCM
    const { data, error: subscribeError } = await supabase
      .from('newsletters')
      .insert([{ 
        email: email.value.toLowerCase(),
        share_email: shareEmail.value,
        created_at: new Date().toISOString(),
        full_name_nl: profileData.full_name,
        fcm_token: notificationsEnabled.value ? await $getToken() : null
      }])

    if (subscribeError) {
      console.error('Erreur lors de l\'inscription:', subscribeError)
      throw subscribeError
    }

    console.log('Données insérées:', data)
    success.value = 'Inscription réussie !'
    email.value = ''
    shareEmail.value = false
  } catch (e) {
    console.error('Erreur complète:', e)
    error.value = "Une erreur est survenue lors de l'inscription. Veuillez réessayer."
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mt-3 w-full mx-auto p-6 bg-white rounded-lg shadow-md">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          class="mt-1 w-full px-4 py-2 border rounded-md"
          :disabled="isLoading"
          placeholder="votre@email.com"
        />
      </div>

      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input
            id="share-email"
            v-model="shareEmail"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :disabled="isLoading"
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="share-email" class="font-medium text-gray-700">
            Partager mon email
          </label>
          <p class="text-gray-500">
            J'accepte que mon email soit partagé avec les boutiques partenaires de l'application.
          </p>
        </div>
      </div>

      <div v-if="isNotificationSupported" class="flex items-start">
        <div class="flex items-center h-5">
          <input
            id="notifications"
            v-model="notificationsEnabled"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :disabled="isLoading"
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="notifications" class="font-medium text-gray-700">
            Recevoir les notifications
          </label>
          <p class="text-gray-500">
            Je souhaite recevoir les notifications pour les nouveautés et offres spéciales sur mon smartphone.
          </p>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-blue-800 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isLoading ? 'Inscription...' : 'S\'inscrire' }}
      </button>

      <p v-if="error" class="text-red-800 text-sm mt-2">{{ error }}</p>
      <div v-if="success" class="text-blue-800 text-sm mt-2 text-center flex items-center justify-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="32" height="32" stroke-width="1">
          <path d="M4 5h2"></path>
          <path d="M5 4v2"></path>
          <path d="M11.5 4l-.5 2"></path>
          <path d="M18 5h2"></path>
          <path d="M19 4v2"></path>
          <path d="M15 9l-1 1"></path>
          <path d="M18 13l2 -.5"></path>
          <path d="M18 19h2"></path>
          <path d="M19 18v2"></path>
          <path d="M14 16.518l-6.518 -6.518l-4.39 9.58a1 1 0 0 0 1.329 1.329l9.579 -4.39z"></path>
        </svg>
        {{ success }}
      </div>
    </form>
  </div>
</template>