<template>
  <div class="flex items-center justify-center min-h-screen p-5 bg-gray-50">
    <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
      <div v-if="loading" class="text-center">
        <h1 class="text-2xl font-bold text-blue-800 mb-4">Vérification en cours</h1>
        <p class="text-gray-600">Nous vérifions votre identité...</p>
        <div class="mt-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto"></div>
        </div>
      </div>
      <div v-else-if="error" class="text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <NuxtLink to="/login" class="text-blue-800 hover:underline">
          Retourner à la page de connexion
        </NuxtLink>
      </div>
      <div v-else class="text-center">
        <h1 class="text-2xl font-bold text-blue-800 mb-4">Connexion réussie!</h1>
        <p class="text-gray-600 mb-4">Vous allez être redirigé...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const loading = ref(true)
const error = ref(null)

// Fonction pour gérer l'authentification réussie
const handleSuccessfulAuth = async (user) => {
  try {
    // Vérifier si l'utilisateur a un profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError
    }

    // Rediriger vers la création de profil si pas de profil
    if (!profile) {
      router.push({ path: '/create-profil', query: { userId: user.id } })
    } else {
      router.push('/')
    }
  } catch (e) {
    throw e
  }
}

// Gérer la confirmation de l'authentification
onMounted(async () => {
  try {
    // Attendre que la session soit initialisée
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) throw sessionError
    
    if (session) {
      // Si nous avons une session valide, procéder avec l'authentification
      await handleSuccessfulAuth(session.user)
    } else {
      error.value = "Session non trouvée. Veuillez réessayer de vous connecter."
    }
  } catch (e) {
    console.error('Erreur d\'authentification:', e)
    error.value = e.message || "Une erreur s'est produite lors de l'authentification."
  } finally {
    loading.value = false
  }
})

// Redirection automatique si déjà connecté
watchEffect(() => {
  if (user.value && !loading.value && !error.value) {
    router.push('/')
  }
})
</script>
