<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import { useRoute, useRouter } from 'vue-router'
import Loader from '@/components/Loader.vue'
import AuthForm from '@/components/AuthForm.vue'
import { v4 as uuidv4 } from 'uuid';

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const scanResult = ref('')
const scanError = ref(false)
const boutiqueSlug = ref('')
const debugLog = ref([])
const showAuthForm = ref(false)
const storedBoutiqueId = ref('')

const addDebugLog = (message) => {
  debugLog.value.push(`${new Date().toISOString()}: ${message}`)
  console.log(message)
}

definePageMeta({
  showHeader: false
})

// Fonction pour vérifier le profil de l'utilisateur sans redirection automatique
const checkUserProfile = async () => {
  if (!user.value) {
    addDebugLog('User not logged in, showing auth form')
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
      addDebugLog('Profile not found')
      scanError.value = true
      scanResult.value = "Veuillez compléter votre profil avant de continuer."
      isLoading.value = false
      return 'no_profile'
    }
    
    return 'ok'
  } catch (error) {
    addDebugLog(`Error checking profile: ${error.message}`)
    scanError.value = true
    scanResult.value = "Une erreur est survenue lors de la vérification de votre profil."
    isLoading.value = false
    return 'error'
  }
}

onMounted(async () => {
  addDebugLog('Component mounted')
  
  const scanUid = route.query.scan_uid
  if (scanUid) {
    addDebugLog(`Scan UID found: ${scanUid}`)
    storedBoutiqueId.value = scanUid
    
    if (user.value) {
      // Si l'utilisateur est connecté, vérifier son profil avant de traiter la récompense
      const profileResult = await checkUserProfile()
      if (profileResult === 'ok') {
        await processReward(scanUid)
      }
    } else {
      addDebugLog('User not logged in, showing auth form')
      showAuthForm.value = true
      isLoading.value = false
    }
  } else {
    addDebugLog('No scan_uid found in URL')
    scanError.value = true
    scanResult.value = "Aucun identifiant de boutique trouvé dans l'URL."
    isLoading.value = false
  }
})

// Gérer l'authentification réussie
const handleUserAuthenticated = async (authenticatedUser) => {
  try {
    isLoading.value = true
    user.value = authenticatedUser
    showAuthForm.value = false
    
    addDebugLog(`User authenticated: ${authenticatedUser.id}`)
    addDebugLog(`Stored boutique ID: ${storedBoutiqueId.value}`)
    
    // Vérifier le profil de l'utilisateur avant de traiter la récompense
    const profileResult = await checkUserProfile()
    addDebugLog(`Profile check result: ${profileResult}`)
    
    // Traiter la récompense après connexion si le profil est valide
    if (profileResult === 'ok' && storedBoutiqueId.value) {
      addDebugLog(`Processing reward for boutique ID: ${storedBoutiqueId.value}`)
      await processReward(storedBoutiqueId.value)
    } else {
      addDebugLog(`Cannot process reward: profileResult=${profileResult}, storedBoutiqueId=${storedBoutiqueId.value}`)
      if (profileResult !== 'ok') {
        // Déjà géré par checkUserProfile
      } else if (!storedBoutiqueId.value) {
        scanResult.value = "Aucun identifiant de boutique trouvé. Veuillez scanner à nouveau."
        scanError.value = true
      }
      isLoading.value = false
    }
  } catch (error) {
    console.error('Erreur après authentification:', error)
    addDebugLog(`Authentication error: ${error.message}`)
    scanResult.value = error.message || 'Erreur lors du traitement de la récompense'
    scanError.value = true
    isLoading.value = false
  }
}

// Gérer les erreurs d'authentification
const handleAuthError = (errorMessage) => {
  scanResult.value = errorMessage
  scanError.value = true
  isLoading.value = false
}

const processReward = async (scanUid) => {
  try {
    addDebugLog('Starting processReward')
    
    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutique')
      .select('*')
      .eq('scan_uid', scanUid)
      .single()

    if (boutiqueError) {
      addDebugLog(`Boutique error: ${boutiqueError.message}`)
      throw new Error('Erreur lors de la récupération de la boutique: ' + boutiqueError.message)
    }
    if (!boutique) {
      addDebugLog('No boutique found with this ID')
      throw new Error('Aucune boutique trouvée avec cet ID.')
    }

    addDebugLog(`Boutique found: ${boutique.slug}`)
    
    // Vérifier si la boutique a une valeur VIP configurée
    const vipPoints = boutique.vip || 0
    addDebugLog(`VIP points configured: ${vipPoints}`)
    
    if (vipPoints <= 0) {
      addDebugLog('No VIP points configured for this boutique')
      throw new Error('Aucun point VIP configuré pour cette boutique.')
    }

    // Récupérer la dernière récompense sans vérifier les scans
    addDebugLog('Fetching last reward')
    const { data: lastReward, error: lastRewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('store_slug', boutique.slug)
      .eq('user_uid_reward', user.value.id)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single()

    if (lastRewardError && lastRewardError.code !== 'PGRST116') {
      addDebugLog(`Last reward fetch error: ${lastRewardError.message}`)
      throw lastRewardError
    }

    addDebugLog(`Last reward: ${JSON.stringify(lastReward)}`)

    // Initialiser les variables
    let currentSolde = lastReward ? lastReward.new_solde : 0
    let seriesUid = lastReward ? lastReward.series_uid : uuidv4()
    let rewardMessage = ''
    let finalSolde = currentSolde
    
    // Créer un enregistrement reward pour chaque point VIP
    addDebugLog(`Creating ${vipPoints} individual reward records`)
    
    const rewardRecords = []
    
    for (let i = 0; i < vipPoints; i++) {
      // Calculer le nouveau solde pour cet enregistrement
      currentSolde = finalSolde
      finalSolde = currentSolde + 1
      
      // Vérifier si on atteint ou dépasse la limite avec ce point
      let isUsed = false
      
      if (finalSolde === boutique.limite) {
        // L'utilisateur atteint exactement la limite
        isUsed = true
        seriesUid = uuidv4() // Nouveau cycle
        finalSolde = 0
      } else if (finalSolde > boutique.limite) {
        // L'utilisateur dépasse la limite
        isUsed = true
        finalSolde = finalSolde - boutique.limite
        seriesUid = uuidv4() // Nouveau cycle
      }
      
      // Créer l'enregistrement
      rewardRecords.push({
        hit_date: new Date(Date.now() + i * 100).toISOString(), // Légère différence de temps pour éviter les conflits
        solde: currentSolde,
        new_solde: finalSolde,
        store_slug: boutique.slug,
        rewardSlug: seriesUid,
        user_uid_reward: user.value.id,
        is_used: isUsed,
        series_uid: seriesUid
      })
    }
    
    // Insérer tous les enregistrements
    addDebugLog(`Inserting ${rewardRecords.length} reward records`)
    const { error: newRewardError } = await supabase
      .from('reward')
      .insert(rewardRecords)

    if (newRewardError) {
      addDebugLog(`Reward insertion error: ${newRewardError.message}`)
      throw new Error('Erreur lors de l\'ajout des rewards: ' + newRewardError.message)
    }

    addDebugLog('Reward records inserted successfully')
    
    // Redirection immédiate vers la page de remerciement sans afficher l'écran intermédiaire
    addDebugLog(`Redirecting immediately to /merci?boutique=${boutique.slug}`)
    await router.push(`/merci?boutique=${boutique.slug}`)

  } catch (error) {
    addDebugLog(`Error in processReward: ${error.message}`)
    console.error('Erreur lors du traitement de la récompense:', error)
    scanResult.value = error.message
    scanError.value = true
    isLoading.value = false
  }
}

</script>

<template>
  <div class="bg-gray-100 min-h-screen">
    <!-- Afficher le loader pendant le traitement -->
    <div v-if="isLoading" class="flex justify-center items-center h-screen">
      <Loader />
    </div>
    
    <!-- Formulaire d'authentification -->
    <div v-else-if="showAuthForm" class="mx-auto max-w-md p-6">
      <AuthForm 
        @user-authenticated="handleUserAuthenticated"
        @auth-error="handleAuthError"
      />
    </div>
    
    <!-- Afficher uniquement en cas d'erreur -->
    <div v-else-if="scanError" class="mx-auto max-w-2xl">
      <div class="flex justify-center items-center flex-col p-6 md:p-24 gap-5">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <div class="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x stroke-red-600" width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <circle cx="12" cy="12" r="9" />
              <path d="M10 10l4 4m0 -4l-4 4" />
            </svg>
          </div>
          
          <p class="text-center text-lg font-medium mb-6 text-red-600">
            {{ scanResult }}
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