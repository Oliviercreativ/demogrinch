<template>
  <div class="container mx-auto p-4 py-24 h-[100vh] flex items-center justify-center flex-col">
    <p class="text-lg uppercase font-semibold text-blue-800 text-center mb-6">Modifier le profil</p>
    <form @submit.prevent="updateProfile" class="space-y-10 w-full">
      <div class="relative space-y-2">
        <label for="username" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Prénom et Nom</label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
        </svg>
        <input type="text" id="username" v-model="profile.full_name" class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200">
      </div>

      <div class="relative space-y-2">
        <label for="tel" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Téléphone</label>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-blue-800 icon icon-tabler icon-tabler-device-remote absolute top-8 left-1" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M7 3m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" />
          <path d="M12 3v2" />
          <path d="M10 15v.01" />
          <path d="M10 18v.01" />
          <path d="M14 18v.01" />
          <path d="M14 15v.01" />
        </svg>
        <input type="tel" id="tel" v-model="profile.tel" class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200">
      </div>

      <div class="relative space-y-2">
        <label for="adresse" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Code postal</label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
          <path d="M11.87 21.48a1.992 1.992 0 0 1 -1.283 -.58l-4.244 -4.243a8 8 0 1 1 13.355 -3.474" />
          <path d="M15 19l2 2l4 -4" />
        </svg>
        <textarea type="text" id="adresse" v-model="profile.adresse" class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200"></textarea>
      </div>

      <div>
        <button type="submit" class="inline-flex justify-center py-2 px-4 w-full border border-white shadow-sm text-sm font-normal rounded-md text-white bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Mettre à jour le profil
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

definePageMeta({
  showHeader: false
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

const profile = ref({
  full_name: '',
  tel: '',
  adresse: '',
})

const fetchProfile = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (error) throw error

    profile.value = data
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error.message)
  }
}

const updateProfile = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(profile.value)
      .eq('id', user.value.id)

    if (error) throw error

    alert('Profil mis à jour avec succès')
    router.push('/profil')  // Rediriger vers la page de profil après la mise à jour
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error.message)
    alert('Erreur lors de la mise à jour du profil')
  }
}

onMounted(() => {
  if (user.value) {
    fetchProfile()
  } else {
    router.push('/login')  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  }
})
</script>