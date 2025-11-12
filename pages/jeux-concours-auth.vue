<template>
  <div class="bg-white min-h-screen">
    <!-- Afficher le loader pendant le traitement -->
    <div v-if="isLoading" class="flex justify-center items-center h-screen">
      <Loader />
    </div>
    
    <!-- Formulaire d'authentification -->
    <div v-else-if="showAuthForm" class="mx-auto max-w-md p-6">
      <div class="text-center mb-6">
        <div class="flex items-center justify-center gap-4">
          <img src="https://media.madeinconflans.fr/wp-content/uploads/2024/05/6452416fef45718de89d7925_giagia-beige-2-p-500.png" class="w-1/2 h-48 object-contain mx-auto">
          <img src="https://api.grinch.fr/storage/v1/object/public/image//Logo%20creativconflans.png" class="w-1/2 h-48 object-contain mx-auto">
        </div>
        <h1 class="text-2xl text-blue-800 font-bold text-center mb-2">Jeu Concours 1 an Giagia <br> Giagia x Mysteria Ingenium</h1>
        <p class="text-gray-600 mb-2">Dimanche 25 mai 2025</p>
         <p class="text-gray-600 mb-2">Tenter de gagner 1 des 2 goûters offert par Giagia, bonne chance</p>
      </div>

      
      <AuthForm 
        @user-authenticated="handleUserAuthenticated"
        @auth-error="handleAuthError"
      />
    </div>
    
    <!-- Afficher uniquement en cas d'erreur -->
    <div v-else-if="authError" class="mx-auto max-w-2xl">
      <div class="flex justify-center items-center flex-col p-6 md:p-24 gap-5">
        <div class="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <div class="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x stroke-red-600" width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <circle cx="12" cy="12" r="9" />
              <path d="M10 10l4 4m0 -4l-4 4" />
            </svg>
          </div>
          
          <p class="text-center text-lg font-medium mb-6 text-red-600">
            {{ errorMessage }}
          </p>
          
          <div class="flex justify-center">
            <NuxtLink to="/" class="text-white bg-blue-800 px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
              Retour à l'accueil
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import { useRouter } from 'vue-router'
import Loader from '@/components/Loader.vue'
import AuthForm from '@/components/AuthForm.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const isLoading = ref(true)
const authError = ref(false)
const errorMessage = ref('')
const showAuthForm = ref(false)

definePageMeta({
  showHeader: false,
  showNavbar: false
})

// Fonction pour vérifier le profil de l'utilisateur sans redirection automatique
const checkUserProfile = async () => {
  if (!user.value) {
    showAuthForm.value = true
    isLoading.value = false
    return 'not_logged_in'
  }

  const userId = user.value.id

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!profile) {
      authError.value = true
      errorMessage.value = "Veuillez compléter votre profil avant de continuer."
      isLoading.value = false
      return 'no_profile'
    }
    
    return 'ok'
  } catch (error) {
    console.error(`Error checking profile: ${error.message}`)
    authError.value = true
    errorMessage.value = "Une erreur est survenue lors de la vérification de votre profil."
    isLoading.value = false
    return 'error'
  }
}

onMounted(async () => {
  if (user.value) {
    // Si l'utilisateur est connecté, vérifier son profil
    const profileResult = await checkUserProfile()
    if (profileResult === 'ok') {
      // Rediriger vers la page du jeu concours
      await router.push('/jeu-concours-1-an-giagia')
    }
  } else {
    // Afficher le formulaire d'authentification
    showAuthForm.value = true
    isLoading.value = false
  }
})

// Gérer l'authentification réussie
const handleUserAuthenticated = async (authenticatedUser) => {
  try {
    isLoading.value = true
    user.value = authenticatedUser
    showAuthForm.value = false
    
    // Vérifier le profil de l'utilisateur
    const profileResult = await checkUserProfile()
    
    if (profileResult === 'ok') {
      // Rediriger vers la page du jeu concours
      await router.push('jeu-concours-1-an-giagia')
    }
  } catch (error) {
    console.error('Erreur après authentification:', error)
    authError.value = true
    errorMessage.value = error.message || "Une erreur est survenue lors de l'authentification."
    isLoading.value = false
  }
}

// Gérer les erreurs d'authentification
const handleAuthError = (errorMsg) => {
  authError.value = true
  errorMessage.value = errorMsg
  isLoading.value = false
}
</script>
