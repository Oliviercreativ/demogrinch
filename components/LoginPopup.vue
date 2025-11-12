<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'

const email = ref('')
const password = ref('')
const errorMessage = ref('')

const { $supabase } = useNuxtApp()

const signInUser = async () => {
  const { data, error } = await $supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    errorMessage.value = error.message
  } else {
    navigateTo('/profile')
  }
}
</script>
<template>
  <div class="popup fixed inset-0 z-10 w-screen overflow-y-auto">
    <div class="flex w-scren items-end justify-center p-4 radius-lg text-center sm:items-center sm:p-0">
      <div class="w-full flex align-center bg-white rounded-lg shadow-xl flex-col">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start relative">
            <div class="flex justify-end items-center absolute right-2">
              <button class="close-button" @click="$emit('close')">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-square-x" width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
                  <path d="M9 9l6 6m0 -6l-6 6" />
                </svg>
              </button>
            </div>
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon class="h-6 w-6 text-cyan-600" aria-hidden="true" />
            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <div class="text-base leading-6 text-gray-900">Se connecter</div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <form @submit.prevent="signInUser" class="flex align-baseline justify-center flex-col gap-6">
            <div class="mt-1">
              <label for="email" class="block text-sm text-left font-normal text-gray-500">Email</label>
              <input v-model="email" type="email" placeholder="Email" required />
            </div>
            <div class="mt-1">
              <label for="password" class="block text-sm text-left font-normal text-gray-500">Mot de passe</label>
              <input v-model="password" type="password" placeholder="Mot de passe" name="password" required />
            </div>
            <div class="mt-1">
              <button type="submit">Se connecter</button>
            </div>
          </form>
          <div class="mt-1">
            <p v-if="errorMessage">{{ errorMessage }}</p>
            <p>Pas encore de compte ? <NuxtLink to="/register">S'inscrire</NuxtLink></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>