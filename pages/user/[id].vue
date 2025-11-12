<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { Html5Qrcode } from 'html5-qrcode'
import { vibrate, VIBRATION_PATTERNS } from '@/utils/vibration'
import confetti from 'canvas-confetti'
import ProgressBar from '@/components/ProgressBar.vue'
import Loader from '@/components/Loader.vue'
import BoutiqueRewardMessage from '@/components/BoutiqueRewardMessage.vue'

definePageMeta({
  showHeader: false,
  showFooter: false,
  showNavbar: false,
  showAdminbar: false
})

const route = useRoute()
const supabase = useSupabaseClient()

// Récupérer l'ID utilisateur depuis l'URL
const userId = route.params.id

// États du scanner
const isLoading = ref(true)
const showScanner = ref(true)
const scanResult = ref(null)
const scanError = ref(false)
let isProcessing = false
let html5QrCode = null

// États après le scan
const scanCompleted = ref(false)
const error = ref(null)
const scannedBoutique = ref(null)
const userPoints = ref(0)
const pointsAdded = ref(0)
const previousSolde = ref(0)
const reward = ref(null)
const pointLimitReached = ref(false)
const rewardDescription = ref('')
const pendingReward = ref(null)
const scanHistory = ref([])

// Vérifier que l'utilisateur existe
const userExists = ref(false)
const userName = ref('')

// Fonction pour formater les dates
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Vérifier que l'utilisateur existe
const checkUserExists = async () => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      error.value = 'Utilisateur non trouvé'
      userExists.value = false
      return false
    }

    userExists.value = true
    userName.value = profile.full_name || 'Utilisateur'
    return true
  } catch (err) {
    console.error('Erreur vérification utilisateur:', err)
    error.value = 'Erreur lors de la vérification de l\'utilisateur'
    userExists.value = false
    return false
  }
}

// Scanner QR Code
const stopScanner = () => {
  if (html5QrCode) {
    html5QrCode.stop().catch(err => console.log('Erreur lors de l\'arrêt du scanner:', err))
    html5QrCode = null
  }
  showScanner.value = false
}

const initQRCodeScanner = () => {
  if (process.client && document.getElementById("qr-reader")) {
    html5QrCode = new Html5Qrcode("qr-reader")
    
    // Calculer la taille optimale du qrbox adaptée à la vidéo de la caméra
    // Utiliser 40% de la largeur minimale avec un maximum de 250px pour un meilleur rendu
    const maxSize = Math.min(window.innerWidth, window.innerHeight) * 1
    const qrboxSize = Math.min(maxSize, 400)
    
    html5QrCode.start(
      { facingMode: "environment" },
      { 
        fps: 10, 
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
        disableFlip: false
      },
      (decodedText) => {
        if (!isProcessing) {
          isProcessing = true
          stopScanner()
          handleScanResult(decodedText)
        }
      },
      (errorMessage) => {
        console.warn(`Erreur lors du scan : ${errorMessage}`)
      }
    ).catch((err) => {
      console.error('Erreur lors du démarrage du scanner QR Code:', err)
      scanError.value = true
      scanResult.value = 'Impossible d\'accéder à la caméra'
    })
  }
}

const handleScanResult = async (decodedText) => {
  try {
    console.log('📱 QR Code scanné:', decodedText)

    // Extraire le scan_uid de l'URL
    const urlParts = decodedText.split('/')
    const scan_uid = urlParts[urlParts.length - 1]

    if (!scan_uid) {
      throw new Error('QR code invalide.')
    }

    // Vibration de succès
    vibrate(VIBRATION_PATTERNS.SUCCESS)

    // Appeler l'API pour ajouter le point
    await processReward(scan_uid)

  } catch (error) {
    console.error('❌ Erreur lors du scan:', error)
    scanResult.value = error.message || 'QR code invalide ou illisible'
    scanError.value = true
    vibrate(VIBRATION_PATTERNS.ERROR)
    isProcessing = false
  }
}

const processReward = async (scanUid) => {
  try {
    isLoading.value = true
    scanError.value = false
    scanResult.value = null

    console.log('🔄 Appel API add-point pour user:', userId, 'boutique:', scanUid)

    // Appeler l'API
    const response = await $fetch('/api/rewards/add-point', {
      method: 'POST',
      body: {
        user_id: userId,
        boutique_slug: scanUid,
        source: 'scanner', // Source physique pour activer la vérification des scans
        points_to_add: 1,
        check_scan_limit: true, // Active la vérification dans la table scans
        check_geolocation: false // Pas de géoloc pour cette page
      }
    })

    console.log('✅ Réponse API:', response)

    // ✅ Vérifier si une récompense a été gagnée
    if (response.data.reward_earned) {
      console.log('🎉 RÉCOMPENSE GAGNÉE !')
      console.log('📱 Webhook Make.com devrait être déclenché pour envoyer le SMS')
      console.log('📊 Détails:', {
        boutique: response.data.boutique_name,
        limite: response.data.boutique_limit,
        points: response.data.new_solde,
        reward_description: response.data.reward_description,
        notifications: response.notifications
      })
    }

    if (response.success) {
      // Récupérer les infos de la boutique et afficher le résultat
      await fetchBoutiqueAndReward(response.data.boutique_slug)
      scanCompleted.value = true
    } else {
      throw new Error(response.message || 'Erreur inconnue de l\'API')
    }

  } catch (error) {
    console.error('❌ Erreur lors du traitement de la récompense:', error)

    // Gestion des erreurs spécifiques
    if (error.statusCode === 409) {
      scanResult.value = 'Vous avez déjà scanné cette boutique aujourd\'hui'
    } else if (error.statusCode === 404) {
      scanResult.value = error.message || 'Boutique non trouvée'
    } else {
      scanResult.value = error.message || 'Une erreur est survenue lors du scan'
    }

    scanError.value = true
  } finally {
    isLoading.value = false
    isProcessing = false
  }
}

// Récupérer les infos de la boutique et du reward après le scan
const fetchBoutiqueAndReward = async (boutiqueSlug) => {
  try {
    // Récupérer la boutique
    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', false)
      .eq('demo', true)
      .eq('slug', boutiqueSlug)
      .single()

    if (boutiqueError || !boutique) {
      throw new Error('Boutique non trouvée')
    }

    scannedBoutique.value = boutique

    // Récupérer les données de récompense
    const { data: rewardData, error: rewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', userId)
      .eq('store_slug', boutiqueSlug)
      .order('hit_date', { ascending: false })
      .limit(2)

    if (rewardError) {
      throw rewardError
    }

    // Calculer les points
    if (rewardData && rewardData.length > 0) {
      userPoints.value = Number(rewardData[0].new_solde) || 0
      previousSolde.value = Number(rewardData[0].solde) || 0
      pointsAdded.value = userPoints.value - previousSolde.value
      reward.value = rewardData[0]
    } else {
      userPoints.value = 1
      previousSolde.value = 0
      pointsAdded.value = 1
      reward.value = {
        new_solde: 1,
        hit_date: new Date().toISOString(),
        store_slug: boutiqueSlug,
        user_uid_reward: userId
      }
    }

    // Vérifier si limite atteinte
    if (boutique.limite && !isNaN(parseInt(boutique.limite))) {
      const limite = parseInt(boutique.limite)
      pointLimitReached.value = userPoints.value >= limite
      rewardDescription.value = boutique.lot || 'une récompense'

      // Vérifier récompense en attente
      await checkForPendingReward(boutiqueSlug, limite)

      // Créer message goodies si premier point
      if (userPoints.value === 1 && pointsAdded.value === 1) {
        await createGoodiesMessage(boutique)
      }
    }

    // Récupérer l'historique
    await fetchScanHistory(boutiqueSlug)

  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    scanError.value = true
    scanResult.value = error.message || 'Erreur lors de la récupération des données'
  }
}

// Créer message goodies
const createGoodiesMessage = async (boutique) => {
  try {
    const { data: existingMessages } = await supabase
      .from('user_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('boutique_slug', boutique.slug)
      .eq('is_read', false)

    if (existingMessages && existingMessages.length > 0) {
      return
    }

    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 2)

    let messageText = ''
    if (boutique.enable_auto_messages && boutique.message_1_point) {
      messageText = boutique.message_1_point
    } else {
      messageText = `Félicitations ! Vous avez gagné un goodies chez ${boutique.name_shop}. Rendez-vous à l'accueil et présentez ce message pour récupérer votre cadeau !`
    }

    await supabase
      .from('user_messages')
      .insert({
        user_id: userId,
        boutique_slug: boutique.slug,
        message: messageText,
        is_read: false,
        expiry_date: expiryDate.toISOString()
      })

    console.log('✅ Message goodies créé')
  } catch (error) {
    console.error('Erreur création message goodies:', error)
  }
}

// Vérifier récompense en attente
const checkForPendingReward = async (boutiqueSlug, limite) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentRewards } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', userId)
      .eq('store_slug', boutiqueSlug)
      .eq('is_used', false)
      .gte('hit_date', fiveMinutesAgo)
      .gte('new_solde', limite)
      .order('hit_date', { ascending: false })
      .limit(1)

    if (recentRewards && recentRewards.length > 0) {
      pendingReward.value = recentRewards[0]
      setTimeout(() => {
        triggerConfetti()
        vibrate(VIBRATION_PATTERNS.SUCCESS)
      }, 300)
      return true
    }

    // Fallback
    const { data: lastReward } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', userId)
      .eq('store_slug', boutiqueSlug)
      .eq('is_used', false)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single()

    if (lastReward && lastReward.new_solde >= limite) {
      pendingReward.value = lastReward
      setTimeout(() => {
        triggerConfetti()
        vibrate(VIBRATION_PATTERNS.SUCCESS)
      }, 300)
      return true
    }

    pendingReward.value = null
    return false
  } catch (error) {
    console.error('Erreur vérification récompense:', error)
    return false
  }
}

// Confettis
function triggerConfetti() {
  const duration = 3 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    })
  }, 250)
}

// Historique des scans
const fetchScanHistory = async (boutiqueSlug) => {
  try {
    const { data } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', userId)
      .eq('store_slug', boutiqueSlug)
      .order('hit_date', { ascending: false })
      .limit(10)

    scanHistory.value = data || []
  } catch (error) {
    console.error('Erreur historique:', error)
    scanHistory.value = []
  }
}

// Relancer le scanner
const startScanner = async () => {
  if (isProcessing) return

  try {
    showScanner.value = true
    scanCompleted.value = false
    scanResult.value = null
    scanError.value = false
    await nextTick()
    initQRCodeScanner()
  } catch (error) {
    scanResult.value = error.message
    scanError.value = true
  }
}

onMounted(async () => {
  // Vérifier que l'utilisateur existe
  const exists = await checkUserExists()
  
  if (!exists) {
    isLoading.value = false
    return
  }

  isLoading.value = false
  await nextTick()
  startScanner()
})

onBeforeUnmount(() => {
  stopScanner()
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Erreur utilisateur non trouvé -->
    <div v-if="!userExists && !isLoading" class="flex flex-col items-center justify-center min-h-screen p-8">
      <div class="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Utilisateur non trouvé</h2>
        <p class="text-gray-600">{{ error || 'Cet identifiant utilisateur n\'existe pas' }}</p>
      </div>
    </div>

    <!-- Loading initial -->
    <div v-else-if="isLoading && !scanCompleted" class="flex justify-center items-center min-h-screen">
      <Loader />
    </div>

    <!-- Scanner actif -->
    <div v-else-if="showScanner && !scanCompleted" class="bg-black fixed inset-0 w-screen h-screen">
      <div class="w-full h-full relative">
        <!-- Scanner QR en plein écran -->
        <div id="qr-reader" class="w-full h-full"></div>
      </div>
    </div>

    <!-- Erreur scan -->
    <div v-else-if="scanError && !scanCompleted" class="flex justify-center items-center min-h-screen p-8">
      <div class="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Erreur de scan</h2>
        <p class="text-gray-600 mb-6">{{ scanResult }}</p>
      </div>
    </div>

    <!-- Résultat après scan (comme merci.vue) -->
    <div v-else-if="scanCompleted && scannedBoutique" class="flex flex-col items-center justify-center gap-y-10 pb-48 pt-8">
      <div class="relative px-4 w-full max-w-2xl">
        <NuxtLink :to="`/shop/${scannedBoutique.slug}`"
          class="flex items-center justify-center flex-col gap-5 py-6">
          <figure class="bg-white rounded-lg p-2">
            <img :src="scannedBoutique.logo_shop" width="150" alt="Logo" />
          </figure>
        </NuxtLink>
        
        <p class="text-blue-800 font-medium text-center text-balance">
          Votre{{ pointsAdded > 1 ? 's' : '' }} {{ pointsAdded }} point{{ pointsAdded > 1 ? 's' : '' }} de fidélité
          {{ pointsAdded > 1 ? 'ont' : 'a' }} bien été ajouté{{ pointsAdded > 1 ? 's' : '' }}
          sur votre carte {{ scannedBoutique.name_shop }}.
        </p>

        <!-- Message récompense -->
        <BoutiqueRewardMessage 
          :boutique-id="scannedBoutique.id" 
          :boutique-name="scannedBoutique.name_shop"
          :boutique-slug="scannedBoutique.slug" 
          :points-added="pointsAdded" 
          :current-points="userPoints"
          :pending-reward="pendingReward" 
          :enable-auto-messages="scannedBoutique.enable_auto_messages || false"
          :custom-message1-point="scannedBoutique.message_1_point || null"
          :custom-message-recompense="scannedBoutique.message_recompense || null"
          :boutique-limit="scannedBoutique.limite" 
        />

        <!-- Barre de progression -->
        <div class="w-full mt-6">
          <ProgressBar 
            :is-loading="false" 
            :error="error" 
            :reward="reward" 
            :shop="scannedBoutique"
            :format-date="formatDate"
          >
            <template #loader>
              <div class="flex justify-center items-center p-4">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            </template>
            <template #no-reward>
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <p>Aucun point de fidélité trouvé pour cette boutique.</p>
              </div>
            </template>
          </ProgressBar>
        </div>

        <!-- Historique des scans -->
        <div v-if="scanHistory.length > 0" class="w-full mt-6">
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="divide-y divide-gray-200">
              <div v-for="(scan, index) in scanHistory" :key="scan.id"
                class="p-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {{ index + 1 }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ formatDate(scan.hit_date) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-blue-800">
                      {{ scan.new_solde }} pt{{ scan.new_solde > 1 ? 's' : '' }}
                    </div>
                  </div>
                </div>
                <div v-if="scan.is_used"
                  class="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Récompense récupérée
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bouton scanner à nouveau -->
        <div class="w-full flex items-center justify-center py-4 mt-6">
          <NuxtLink to="/login"
            class="bg-blue-800 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg">
            Voir mes points de fidélité
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Personnalisation du scanner Html5Qrcode */
:deep(#qr-reader) {
  position: relative;
}

/* Masquer complètement le carré de scan */
:deep(#qr-reader__scan_region) {
  display: none !important;
}

/* Améliorer l'apparence générale */
:deep(#qr-reader__dashboard) {
  display: none !important;
}

/* Masquer les messages d'erreur internes si nécessaire */
:deep(#qr-reader__status_span) {
  display: none !important;
}
</style>

