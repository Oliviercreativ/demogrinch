<template>
  <div class="">
    <div class="p-4 pb-24 h-[100vh] flex flex-col items-stretch justify-center">
      <form @submit.prevent="handleResetPassword">
        <div class="flex flex-col items-center justify-center gap-5 py-10">
          <p class="text-lg uppercase font-semibold text-blue-800 text-center">Réinitialisation du mot de passe</p>
          <p class="text-xs font-semibold text-blue-800 uppercase text-left">Votre email</p>
          <input v-model="email" type="email" placeholder="Email" required class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3">
          <button type="submit" class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white">
            Réinitialiser le mot de passe
          </button>
        </div>
      </form>
      <p v-if="message" :class="{'text-red-500': isError, 'text-blue-500': !isError}" class="text-center">{{ message }}</p>
      <div class="flex justify-center items-center flex-col gap-5 py-5">
        <NuxtLink to="/login">
          <button class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-normal text-white">Retour à la connexion</button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const email = ref('')
const message = ref('')
const isError = ref(false)

const handleResetPassword = async () => {
  try {
    message.value = ''
    isError.value = false

    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error

    message.value = 'Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.'
    isError.value = false
  } catch (error) {
    message.value = error.message
    isError.value = true
  }
}
</script>