<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import { useRoute, useRouter } from 'vue-router'
import Loader from '@/components/Loader.vue'
import AuthForm from '@/components/AuthForm.vue'

definePageMeta({
  showHeader: false,
  showFooter: false,
  showNavbar: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const scanResult = ref('')
const scanError = ref(false)
const boutiqueSlug = ref('')
const debugLog = ref([])

const addDebugLog = (msg) => {
  debugLog.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
  console.log('[DEBUG]', msg)
}

definePageMeta({
  showHeader: false
})

const { checkProfile } = useProfileCheck()

onMounted(async () => {
  addDebugLog('Component mounted')
  await checkProfile()
  if (!user.value) {
    addDebugLog('User not logged in, auth required')
    isLoading.value = false
    return
  }
  
  const boutiqueId = route.query.scan_uid
  if (boutiqueId) {
    addDebugLog(`BoutiqueId found: ${boutiqueId}`)
    // Nouvelle logique : redirection comme scanner.vue
    try {
      addDebugLog(`Redirection vers /boutique/${boutiqueId}?source=nfc`)
      await router.push(`/boutique/${boutiqueId}?source=nfc`)
    } catch (error) {
      addDebugLog(`Erreur lors de la redirection: ${error.message}`)
      scanError.value = true
      scanResult.value = error.message
    }
  } else {
    addDebugLog('No boutiqueId found in URL')
    scanError.value = true
    scanResult.value = "Aucun ID de boutique trouvé dans l'URL."
  }
  
  isLoading.value = false
})
</script>

<template>
  <div class="bg-gray-100 h-[99vh]">
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <Loader />
    </div>
    <!-- Formulaire d'authentification si l'utilisateur n'est pas connecté -->
    <div v-else-if="showAuthForm" class="container mx-auto p-6">
      <div class="">
        <div class="flex justify-center mb-4">
          <img src="https://media.madeinconflans.fr/wp-content/uploads/2020/04/logo.svg" alt="Logo" class="h-16 mb-2" />
        </div>
        <h2 class="text-xl font-semibold text-center mb-6 text-blue-800">Connectez-vous pour obtenir vos points de
          fidélité</h2>
        <AuthForm @user-authenticated="handleUserAuthenticated" @auth-error="handleAuthError" />
      </div>
    </div>
    <div v-else class="mx-auto max-w-2xl">
      <div class="flex justify-center items-center flex-col max-h-screen p-24 gap-5">
        <svg v-if="!scanError" xmlns="http://www.w3.org/2000/svg"
          class="icon icon-tabler icon-tabler-circle-check stroke-blue-800" width="96" height="96" viewBox="0 0 24 24"
          stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M9 12l2 2l4 -4" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x stroke-red-600"
          width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none"
          stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <circle cx="12" cy="12" r="9" />
          <path d="M10 10l4 4m0 -4l-4 4" />
        </svg>
        <p class="text-center mt-2 font-normal" :class="scanError ? 'text-red-600' : 'text-blue-800'">
          {{ scanResult }}
        </p>
        <NuxtLink v-if="boutiqueSlug" :to="`/shop/${boutiqueSlug}`"
          class="text-white bg-blue-800 px-4 py-3 rounded-lg cursor-pointer">
          Visiter la boutique
        </NuxtLink>
      </div>
    </div>
  </div>
</template>