<template>
  <div class="mx-auto max-w-2xl">
    <div class="p-4 pb-24 h-[100vh] flex flex-col items-stretch justify-center">
      <div class="flex items-center justify-center gap-3 pb-6">
        <button @click="goBack" class="text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <p class="text-lg uppercase font-semibold text-blue-800 text-center">Modifier le mot de passe</p>
      </div>
      
      <form @submit.prevent="changePassword" class="space-y-6">
        <div>
          <label for="current-password" class="text-xs font-semibold text-blue-800 uppercase">Mot de passe actuel</label>
          <div class="relative mt-1">
            <input 
              v-model="currentPassword" 
              :type="showCurrentPassword ? 'text' : 'password'" 
              id="current-password" 
              required 
              class="w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3 pr-10"
            >
            <button 
              type="button" 
              @click="showCurrentPassword = !showCurrentPassword" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label for="new-password" class="text-xs font-semibold text-blue-800 uppercase">Nouveau mot de passe</label>
          <div class="relative mt-1">
            <input 
              v-model="newPassword" 
              :type="showNewPassword ? 'text' : 'password'" 
              id="new-password" 
              required 
              class="w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3 pr-10"
            >
            <button 
              type="button" 
              @click="showNewPassword = !showNewPassword" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label for="confirm-password" class="text-xs font-semibold text-blue-800 uppercase">Confirmer le nouveau mot de passe</label>
          <div class="relative mt-1">
            <input 
              v-model="confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              id="confirm-password" 
              required 
              class="w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3 pr-10"
            >
            <button 
              type="button" 
              @click="showConfirmPassword = !showConfirmPassword" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </button>
          </div>
        </div>
        <button 
          type="submit" 
          class="w-full rounded-lg bg-blue-800 px-5 py-3 font-normal text-white"
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
import { useSupabaseClient, useRouter, useSupabaseUser } from '#imports'

definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const user = useSupabaseUser()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const isError = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    message.value = 'Les nouveaux mots de passe ne correspondent pas.'
    isError.value = true
    return
  }

  if (!user.value || !user.value.email) {
    message.value = 'Erreur : Utilisateur non connecté.'
    isError.value = true
    return
  }

  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.value.email,
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
  router.push('/profil')
}
</script>