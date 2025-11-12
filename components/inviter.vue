<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const email = ref('')
const success = ref(false)
const error = ref(null)
const loading = ref(false)

const inviteUser = async () => {
  loading.value = true
  error.value = null
  success.value = false

  try {
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert([
        { 
          email: email.value,
          status: 'pending',
          invited_at: new Date().toISOString(),
          invited_by: user.value.id
        }
      ])

    if (inviteError) throw inviteError

    success.value = true
    email.value = ''

  } catch (err) {
    console.error('Erreur:', err)
    error.value = 'Une erreur est survenue lors de l\'envoi de l\'invitation.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <div class="bg-white rounded-lg p-6">
      <!-- En-tête -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-blue-800 mb-2">
          Inviter un ami
        </h2>
        <p class="text-gray-600">
          Partagez l'application avec vos amis
        </p>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="inviteUser" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div class="relative">
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-red-500': error }"
              placeholder="email@exemple.com"
              :disabled="loading"
            >
            <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800"></div>
            </div>
          </div>
        </div>

        <!-- Messages d'état -->
        <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="p-3 bg-green-100 text-green-700 rounded-md text-sm">
          Invitation envoyée avec succès !
        </div>

        <!-- Bouton d'envoi -->
        <button
          type="submit"
          :disabled="loading || !email"
          class="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Envoi en cours...' : 'Envoyer l\'invitation' }}
        </button>
      </form>

      <!-- Section informative -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">
          Avantages de l'invitation :
        </h3>
        <ul class="text-sm text-gray-600 space-y-2">
          <li class="flex items-center">
            <svg class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            20 points offert sur GRINCH
          </li>
          <li class="flex items-center">
            <svg class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Accès aux offres exclusives des boutiques
          </li>
          <li class="flex items-center">
            <svg class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Programme de parrainage pour gagner des points
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>