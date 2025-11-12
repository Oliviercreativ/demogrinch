<template>
  <div class="">
    <div class="p-4 pb-24 h-[100vh] flex flex-col items-stretch justify-center">
      <form @submit.prevent="handlePasswordReset">
        <div class="flex flex-col items-center justify-center gap-5 py-10">
          <p class="text-lg uppercase font-semibold text-blue-800 text-center">Nouveau mot de passe</p>
          <input v-model="newPassword" type="password" placeholder="Nouveau mot de passe" required class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3">
          <input v-model="confirmPassword" type="password" placeholder="Confirmer le mot de passe" required class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3">
          <button type="submit" class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white">
            Changer le mot de passe
          </button>
        </div>
      </form>
      <p v-if="message" :class="{'text-red-500': isError, 'text-blue-500': !isError}" class="text-center">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useRouter } from '#imports'


const supabase = useSupabaseClient()
const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const isError = ref(false)

const handlePasswordReset = async () => {
  if (newPassword.value !== confirmPassword.value) {
    message.value = 'Les mots de passe ne correspondent pas.'
    isError.value = true
    return
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })

    if (error) throw error

    message.value = 'Mot de passe mis à jour avec succès. Redirection...'
    isError.value = false

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    message.value = error.message
    isError.value = true
  }
}
</script>