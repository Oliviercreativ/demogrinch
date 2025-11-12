<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useRoute, navigateTo } from '#imports'

definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const error = ref(null)
const success = ref(false)
const isLoading = ref(false)

const changePassword = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas."
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value
    })

    if (updateError) throw updateError

    success.value = true
    setTimeout(() => navigateTo('/login'), 3000)
  } catch (e) {
    error.value = "Une erreur s'est produite lors du changement de mot de passe. Veuillez réessayer."
  } finally {
    isLoading.value = false
  }
}

// Vérifier si le code est présent dans l'URL
if (!route.query.code) {
  navigateTo('/login')
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="p-4 py-24 h-[100vh] flex flex-col items-stretch justify-center">
      <p class="text-lg uppercase font-semibold text-blue-800 text-center mb-6">Changer le mot de passe</p>
      <form @submit.prevent="changePassword">
        <div class="flex flex-col items-center justify-center gap-5 py-10">
          <div class="w-full">
            <label for="password" class="sr-only">Nouveau mot de passe</label>
            <input 
              type="password" 
              id="password"
              v-model="password" 
              placeholder="Nouveau mot de passe" 
              required 
              class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
              :disabled="isLoading"
            >
          </div>
          <div class="w-full">
            <label for="confirmPassword" class="sr-only">Confirmer le mot de passe</label>
            <input 
              type="password" 
              id="confirmPassword"
              v-model="confirmPassword" 
              placeholder="Confirmer le mot de passe" 
              required 
              class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
              :disabled="isLoading"
            >
          </div>
          <button 
            type="submit" 
            class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Changement en cours...' : 'Changer le mot de passe' }}
          </button>
        </div>
      </form>
      <p v-if="error" class="text-red-500" role="alert">{{ error }}</p>
      <p v-if="success" class="text-blue-500" role="status">Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la page de connexion.</p>
    </div>
  </div>
</template>