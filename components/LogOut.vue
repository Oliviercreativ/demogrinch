<script setup>
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const logout = async () => {
  try {
    await supabase.auth.signOut()
    navigateTo('/', )
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error.message)
  }
}
</script>

<template>
  <div class="p-2">
    <div v-if="user" class="flex items-start justify-start">
      <button @click="logout">
        <p class="text-center uppercase font-sm font-semibold text-xs font-semibold text-blue-800 uppercase dark:text-white">Se déconnecter</p>
      </button>
    </div>
    <div v-else>
      <NuxtLink to="/login">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-power w-6" width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M7 6a7.75 7.75 0 1 0 10 0" />
          <path d="M12 4l0 8" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>
