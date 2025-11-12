<template>
  <div class="">
    <div class="p-4 pb-24 h-[100vh] flex flex-col items-stretch justify-center">
      <div class="flex items-center mb-6">
        <button @click="goBack" class="text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-blue-800 ml-4">Modifier le mot de passe</h1>
      </div>
      
      <form @submit.prevent="changePassword" class="space-y-6">
        <div>
          <label for="current-password" class="text-xs font-semibold text-blue-800 uppercase">Mot de passe actuel</label>
          <input 
            v-model="currentPassword" 
            type="password" 
            id="current-password" 
            required 
            class="mt-1 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
          >
        </div>
        <div>
          <label for="new-password" class="text-xs font-semibold text-blue-800 uppercase">Nouveau mot de passe</label>
          <input 
            v-model="newPassword" 
            type="password" 
            id="new-password" 
            required 
            class="mt-1 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
          >
        </div>
        <div>
          <label for="confirm-password" class="text-xs font-semibold text-blue-800 uppercase">Confirmer le nouveau mot de passe</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            id="confirm-password" 
            required 
            class="mt-1 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
          >
        </div>
        <button 
          type="submit" 
          class="w-full rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white"
        >
          Changer le mot de passe
        </button>
      </form>
      
      <p v-if="message" :class="{'text-red-600': isError, 'text-blue-800': !isError}" class="mt-4 text-center">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useRouter } from '#imports'

const supabase = useSupabaseClient()
const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const isError = ref(false)

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    message.value = 'Les nouveaux mots de passe ne correspondent pas.'
    isError.value = true
    return
  }

  try {
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword.value,
    })

    if (signInError) throw new Error('Le mot de passe actuel est incorrect.')

    const { error: updateError } = await supabase.auth.updateUser({ 
      password: newPassword.value 
    })

    if (updateError) throw updateError

    message.value = 'Mot de passe mis à jour avec succès.'
    isError.value = false
    setTimeout(() => goBack(), 2000) // Retour automatique après 2 secondes
  } catch (error) {
    message.value = error.message
    isError.value = true
  }
}

const goBack = () => {
  router.push('/profile')
}
</script>