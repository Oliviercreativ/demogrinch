<script setup>
import { ref } from 'vue'
import { useSupabaseClient, navigateTo } from '#imports'
import BackButton from '@/components/BackButton.vue'

definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const email = ref('')
const error = ref(null)
const success = ref(false)
const isLoading = ref(false)

const resetPassword = async () => {
  if (!email.value) {
    error.value = "Veuillez entrer une adresse email."
    return
  }

  isLoading.value = true
  error.value = null
  success.value = false

  try {
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (supabaseError) throw supabaseError
    
    success.value = true
    setTimeout(() => navigateTo('/login'), 3000) // Redirection après 3 secondes
  } catch (e) {
    error.value = "Une erreur s'est produite lors de l'envoi de l'email de réinitialisation. Veuillez réessayer."
    console.error('Erreur de réinitialisation du mot de passe:', e)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="pt-8 pb-24 px-4 h-[100vh] flex flex-col items-stretch justify-center">
      <div>
        <p class="text-lg uppercase font-semibold text-blue-800 text-center mb-6">Mot de passe perdu</p>
        <form @submit.prevent="resetPassword">
          <div class="flex flex-col items-center justify-center gap-5 py-10">
            <div class="w-full">
              <label for="email" class="sr-only">Votre email</label>
              <input 
                type="email" 
                id="email"
                v-model="email" 
                placeholder="Votre email" 
                required 
                class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 px-5 py-3"
                :disabled="isLoading"
              >
            </div>
            <button 
              type="submit" 
              class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-normal text-white disabled:opacity-50"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Envoi en cours...' : 'Réinitialiser le mot de passe' }}
            </button>
          </div>
        </form>
        <p v-if="error" class="text-red-800" role="alert">{{ error }}</p>
        <p v-if="success" class="text-blue-800" role="status">
          Si un compte existe avec cette adresse email, un lien de réinitialisation du mot de passe a été envoyé. 
          Veuillez vérifier votre boîte de réception. Vous allez être redirigé vers la page de connexion.
        </p>
      </div>
    </div>
  </div>
</template>