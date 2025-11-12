<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const email = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)
const shareEmail = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.value.id)
      .single()

    if (profileError) throw profileError

    const { data: existingEmail, error: checkError } = await supabase
      .from('newsletters')
      .select('id')
      .eq('email', email.value.toLowerCase())
      .maybeSingle()

    if (existingEmail) {
      error.value = "Vous êtes déjà inscrit à notre newsletter !"
      return
    }

    // Si l'email n'existe pas, procéder à l'inscription
    const { data, error: subscribeError } = await supabase
      .from('newsletters')
      .insert([{ 
        email: email.value.toLowerCase(),
        share_email: shareEmail.value,
        created_at: new Date().toISOString(),
        full_name_nl: profileData.full_name // Utilisation du full_name de profiles
      }])

    if (subscribeError) throw subscribeError

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
  <div class="mt-3 w-full mx-auto p-6 bg-white rounded-lg">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-center text-blue-800">Recevez l'actualité de GRINCH et des boutiques</label>
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
          <label for="share-email" class="font-thin text-xs text-blue-700">
             J'accepte que mon email soit partagé avec les boutiques partenaires.
          </label>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-blue-800 text-white py-2 px-4 rounded-md disabled:opacity-50"
      >
        {{ isLoading ? 'Inscription...' : 'S\'inscrire' }}
      </button>

      <p v-if="error" class="text-red-800 text-sm mt-2 text-center">{{ error }}</p>
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