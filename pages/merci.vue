<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRoute } from 'vue-router'
import confetti from 'canvas-confetti'
import ProgressBar from '@/components/ProgressBar.vue'
import { vibrate, VIBRATION_PATTERNS } from '@/utils/vibration'


const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const boutiques = ref([])
const scannedBoutique = ref(null)
const userPoints = ref(0) // Nombre de points de l'utilisateur pour cette boutique
const totalPoints = ref(0) // Nombre total de points de l'utilisateur
const pointLimitReached = ref(false) // Indique si l'utilisateur a atteint la limite de points
const rewardDescription = ref('') // Description de la récompense
const reward = ref(null) // Objet reward pour le composant ProgressBar
const isLoading = ref(true) // État de chargement pour le composant ProgressBar
const error = ref(null) // Message d'erreur pour le composant ProgressBar
const pendingReward = ref(null)
const showReviewModal = ref(false)
const pointsAdded = ref(0) // Nombre de points ajoutés lors de ce scan
const previousSolde = ref(0) // Solde avant ce scan
const scanHistory = ref([]) // Historique des scans pour cette boutique

definePageMeta({
  showHeader: false
})

const scannedBoutiques = computed(() => {
  return boutiques.value.filter(boutique => boutique.scanned)
})

const unscannedBoutiques = computed(() => {
  return boutiques.value.filter(boutique => !boutique.scanned)
})

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

const fetchBoutiques = async () => {
  try {
    const { data: userRewards, error: rewardsError } = await supabase
      .from('reward')
      .select('store_slug')
      .eq('user_uid_reward', user.value.id)

    if (rewardsError) throw rewardsError

    const scannedSlugs = userRewards.map(reward => reward.store_slug)

    const { data: allBoutiques, error: boutiquesError } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', false)
      .eq('demo', true)

    if (boutiquesError) throw boutiquesError

    boutiques.value = allBoutiques.map(boutique => ({
      ...boutique,
      scanned: scannedSlugs.includes(boutique.slug)
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des boutiques:', error)
  }
}

const fetchScannedBoutique = async () => {
  const boutiqueSlug = route.query.boutique
  isLoading.value = true
  error.value = null

  if (boutiqueSlug && user.value) {
    try {
      // Récupérer les informations de la boutique
      const { data: boutique, error: boutiqueError } = await supabase
        .from('boutique')
        .select('*')
        .eq('statut', true)
        .eq('slug', boutiqueSlug)
        .single()

      if (boutiqueError) {
        error.value = boutiqueError.message
        throw boutiqueError
      }

      scannedBoutique.value = boutique

      // Récupérer les données de récompense pour cette boutique spécifique
      const { data: rewardData, error: rewardError } = await supabase
        .from('reward')
        .select('*')
        .eq('user_uid_reward', user.value.id)
        .eq('store_slug', boutiqueSlug)
        .order('hit_date', { ascending: false })
        .limit(2) // Prendre les 2 derniers pour calculer les points ajoutés

      if (rewardError) {
        error.value = rewardError.message
        throw rewardError
      }

      // Si nous avons des données de récompense, utiliser le new_solde de la dernière entrée
      if (rewardData && rewardData.length > 0) {
        // ✅ Convertir en nombres pour éviter les problèmes de types (solde peut être string)
        userPoints.value = Number(rewardData[0].new_solde) || 0
        previousSolde.value = Number(rewardData[0].solde) || 0
        
        // Calculer le nombre de points ajoutés lors de ce scan
        pointsAdded.value = userPoints.value - previousSolde.value
        
        reward.value = rewardData[0]
      } else {
        // Si aucune récompense n'existe encore, initialiser à 1 (premier scan)
        userPoints.value = 1
        previousSolde.value = 0
        pointsAdded.value = 1
        reward.value = {
          new_solde: 1,
          hit_date: new Date().toISOString(),
          store_slug: boutiqueSlug,
          user_uid_reward: user.value.id
        }
      }

      console.log(`Points pour ${boutiqueSlug}:`, userPoints.value)
      console.log(`Points ajoutés:`, pointsAdded.value)
      console.log(`Solde précédent:`, previousSolde.value)
      console.log(`Type userPoints:`, typeof userPoints.value)
      console.log(`Type pointsAdded:`, typeof pointsAdded.value)

      // ✅ LOGIQUE SIMPLIFIÉE : Vérifier si une récompense est en attente
      if (boutique.limite && !isNaN(parseInt(boutique.limite))) {
        const limite = parseInt(boutique.limite)
        pointLimitReached.value = userPoints.value >= limite
        rewardDescription.value = boutique.lot || 'une récompense'

        // ✅ DÉCLENCHEMENT CONFETTIS : Seulement si récompense vraiment gagnée
        await checkForPendingReward(boutiqueSlug, limite)

        console.log(`Limite de points: ${limite}, Atteinte: ${pointLimitReached.value}`)
      }

      // Récupérer le nombre total de points de l'utilisateur
      const { count: totalPointsCount, error: totalPointsError } = await supabase
        .from('reward')
        .select('*', { count: 'exact', head: true })
        .eq('user_uid_reward', user.value.id)

      if (totalPointsError) {
        error.value = totalPointsError.message
        throw totalPointsError
      }

      totalPoints.value = totalPointsCount || 0
      console.log('Points totaux:', totalPoints.value)

      // ✅ Créer un message automatique si l'utilisateur atteint 1 point
      if (userPoints.value === 1 && pointsAdded.value === 1) {
        await createGoodiesMessage(boutique)
      }

      // Récupérer l'historique des scans pour cette boutique
      await fetchScanHistory(boutiqueSlug)
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
}

// Fonction pour créer un message automatique quand l'utilisateur gagne un goodies (1 point)
const createGoodiesMessage = async (boutique) => {
  try {
    // Vérifier si un message similaire existe déjà (non lu)
    const { data: existingMessages, error: checkError } = await supabase
      .from('user_messages')
      .select('id')
      .eq('user_id', user.value.id)
      .eq('boutique_slug', boutique.slug)
      .eq('is_read', false)

    if (checkError) {
      console.error('Erreur vérification messages existants:', checkError)
      return
    }

    // Si un message non lu existe déjà, ne pas en créer un nouveau
    if (existingMessages && existingMessages.length > 0) {
      console.log('Message goodies déjà existant pour cette boutique')
      return
    }

    // ✅ VÉRIFIER enable_auto_messages AVANT DE CRÉER LE MESSAGE
    if (!boutique.enable_auto_messages) {
      console.log('⚠️ Messages automatiques désactivés pour cette boutique - aucun message ne sera créé')
      return
    }

    // Date d'expiration : 2 mois
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 2)

    // ✅ Utiliser le message personnalisé si défini, sinon message par défaut
    let messageText = ''
    
    if (boutique.message_1_point) {
      // Message personnalisé de la boutique
      messageText = boutique.message_1_point
      console.log('✅ Utilisation du message personnalisé de la boutique:', messageText)
    } else {
      // Message par défaut générique (seulement si enable_auto_messages est true mais pas de message personnalisé)
      messageText = `Félicitations ! Vous avez gagné un goodies chez ${boutique.name_shop}. Rendez-vous à l'accueil et présentez ce message pour récupérer votre cadeau !`
      console.log('✅ Utilisation du message par défaut (enable_auto_messages activé mais pas de message personnalisé)')
    }

    const { error: insertError } = await supabase
      .from('user_messages')
      .insert({
        user_id: user.value.id,
        boutique_slug: boutique.slug,
        message: messageText,
        is_read: false,
        expiry_date: expiryDate.toISOString()
      })

    if (insertError) {
      console.error('Erreur création message goodies:', insertError)
      return
    }

    console.log('✅ Message goodies créé avec succès')
  } catch (error) {
    console.error('Erreur lors de la création du message goodies:', error)
  }
}

// Fonction pour récupérer l'historique des scans de cette boutique
const fetchScanHistory = async (boutiqueSlug) => {
  try {
    const { data, error } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', user.value.id)
      .eq('store_slug', boutiqueSlug)
      .order('hit_date', { ascending: false })
      .limit(10) // Limiter aux 10 derniers scans

    if (error) throw error

    scanHistory.value = data || []
    console.log('Historique des scans:', scanHistory.value)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    scanHistory.value = []
  }
}

// ✅ NOUVELLE FONCTION : Vérifier si une récompense vient d'être gagnée
const checkForPendingReward = async (boutiqueSlug, limite) => {
  try {
    // ✅ RECHERCHE ÉLARGIE : Chercher les rewards récents (dernières 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    console.log(`🔍 Recherche récompenses récentes pour ${boutiqueSlug} depuis ${fiveMinutesAgo}`)

    const { data: recentRewards, error } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', user.value.id)
      .eq('store_slug', boutiqueSlug)
      .eq('is_used', false) // Pas encore récupéré
      .gte('hit_date', fiveMinutesAgo) // ✅ Élargi à 5 minutes
      .gte('new_solde', limite) // Atteint la limite
      .order('hit_date', { ascending: false })
      .limit(1) // ✅ Prendre plus de rewards pour être sûr

    console.log(`📊 Rewards récents trouvés:`, recentRewards)

    if (!error && recentRewards && recentRewards.length > 0) {
      const recentReward = recentRewards[0]
      console.log('🎉 Récompense récente confirmée:', recentReward)

      pendingReward.value = recentReward

      // ✅ Déclencher les confettis immédiatement
      console.log('🎊 Déclenchement des confettis...')
      setTimeout(() => {
        triggerConfetti()
        vibrate(VIBRATION_PATTERNS.SUCCESS)
      }, 300) // ✅ Délai réduit à 300ms

      return true
    } else {
      console.log('❌ Aucune récompense récente trouvée')

      // ✅ FALLBACK : Vérifier si le dernier reward atteint la limite (même si plus ancien)
      const { data: lastReward } = await supabase
        .from('reward')
        .select('*')
        .eq('user_uid_reward', user.value.id)
        .eq('store_slug', boutiqueSlug)
        .eq('is_used', false)
        .order('hit_date', { ascending: false })
        .limit(1)
        .single()

      if (lastReward && lastReward.new_solde >= limite) {
        console.log('🎉 Récompense en attente trouvée (fallback):', lastReward)
        pendingReward.value = lastReward

        setTimeout(() => {
          triggerConfetti()
          vibrate(VIBRATION_PATTERNS.SUCCESS)
        }, 300)

        return true
      }

      pendingReward.value = null
      return false
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des récompenses récentes:', error)
    return false
  }
}

// ✅ FONCTION CONFETTIS CONSERVÉE (mais pas de SMS)
function triggerConfetti() {
  console.log('🎉 Déclenchement des confettis !')

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

    // Confettis de chaque côté
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

const handleReviewSubmitted = (review) => {
  console.log('Nouvel avis soumis:', review)
}

const openReviewModal = () => {
  showReviewModal.value = true
}

const closeReviewModal = () => {
  showReviewModal.value = false
}

onMounted(() => {
  fetchBoutiques()
  fetchScannedBoutique()

  // ✅ Utiliser useRoute() au lieu de window.location
  const route = useRoute()
  const isRewardEarned = route.query.reward === 'true' ||
    route.query.gagné === 'true'
  // Pas besoin de checkIfRewardEarned() si vous n'avez pas cette fonction

  if (isRewardEarned) {
    // Délai pour laisser le temps à la page de se charger et à l'utilisateur de voir
    setTimeout(() => {
      console.log('🎉 Déclenchement vibration de célébration !')
      vibrate(VIBRATION_PATTERNS.CELEBRATION)

      // Optionnel : vibration bonus après 1 seconde
      setTimeout(() => {
        vibrate([100, 100, 100])
      }, 1000)

    }, 500) // 500ms après le chargement de la page
  }
})
</script>

<template>
  <div>
    <div class="flex flex-col items-center justify-center gap-y-10 pb-48">

      <div v-if="scannedBoutique">
        <div>
          <div class="relative px-4 ">
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

            <!-- ✅ COMPOSANT DE MESSAGES RÉCOMPENSE BOUTIQUE SPÉCIFIQUE -->
            <BoutiqueRewardMessage :boutique-id="scannedBoutique.id" :boutique-name="scannedBoutique.name_shop"
              :boutique-slug="scannedBoutique.slug" :points-added="pointsAdded" :current-points="userPoints"
              :pending-reward="pendingReward" :enable-auto-messages="scannedBoutique.enable_auto_messages || false"
              :custom-message1-point="scannedBoutique.message_1_point || null"
              :custom-message-recompense="scannedBoutique.message_recompense || null"
              :boutique-limit="scannedBoutique.limite" />

            <div class="w-full">
              <AdSidebar type="boutique" position="medium" />
            </div>

            <div v-if="scannedBoutique && scannedBoutique.avis_google && scannedBoutique.lien_avis_google"
              class="flex justify-center py-4">
              <a :href="scannedBoutique.lien_avis_google" target="_blank" rel="noopener"
                class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg shadow transition-colors">
                <!-- Logo Google coloré -->
                <svg class="w-5 h-5 mr-2" viewBox="0 0 48 48">
                  <g>
                    <path fill="#4285F4"
                      d="M24 9.5c3.54 0 6.01 1.53 7.39 2.81l5.48-5.48C33.61 4.36 29.28 2 24 2 14.82 2 6.98 7.98 3.69 15.44l6.91 5.36C12.18 14.09 17.62 9.5 24 9.5z" />
                    <path fill="#34A853"
                      d="M46.1 24.5c0-1.64-.15-3.21-.42-4.74H24v9.24h12.42c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.02 46.1 31.25 46.1 24.5z" />
                    <path fill="#FBBC05"
                      d="M10.6 28.09A14.48 14.48 0 019.5 24c0-1.42.24-2.8.66-4.09l-6.91-5.36A23.93 23.93 0 002 24c0 3.77.9 7.34 2.49 10.45l7.11-6.36z" />
                    <path fill="#EA4335"
                      d="M24 44c5.28 0 9.7-1.75 12.93-4.76l-7.18-5.59c-2 1.36-4.56 2.17-7.75 2.17-6.38 0-11.82-4.59-13.4-10.64l-7.11 6.36C6.98 40.02 14.82 44 24 44z" />
                    <path fill="none" d="M2 2h44v44H2z" />
                  </g>
                </svg>
                Laisser un avis Google
              </a>
            </div>

            <div class="w-full">
              <div v-if="isLoading" class="flex justify-center items-center p-4 bg-white rounded-lg">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>

              <div v-else-if="error"
                class="bg-red-100 border border-red-400 text-red-700 py-3 px-4 text-center rounded-lg" role="alert">
                <strong class="font-bold text-center">Erreur :</strong>
                <span class="block sm:inline text-center">{{ error }}</span>
              </div>

              <ProgressBar v-else :is-loading="false" :error="error" :reward="reward" :shop="scannedBoutique"
                :format-date="formatDate">
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
            <div class="w-full flex items-center justify-center py-4">
              <button @click="openReviewModal"
                class="bg-white text-blue-800 px-8 py-4 rounded-xl font-semibold hover:bg-opacity-90 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1">
                Laisser un avis
              </button>
            </div>
            <div class="w-full flex items-center justify-center py-4">
              <NotificationButton />
            </div>
            <!-- Historique des scans -->
            <div v-if="scanHistory.length > 0" class="w-full mt-6">
              <div class="bg-white rounded-lg overflow-hidden">
                <div class="divide-y divide-gray-200">
                  <div v-for="(scan, index) in scanHistory" :key="scan.id"
                    class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <!-- Numéro du scan -->
                        <div
                          class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {{ index + 1 }}
                        </div>

                        <!-- Date et heure -->
                        <div>
                          <div class="text-sm font-medium text-gray-900">
                            {{ formatDate(scan.hit_date) }}
                          </div>
                          <div class="text-xs text-gray-500">
                            {{ new Date(scan.hit_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                            }) }}
                          </div>
                        </div>
                      </div>

                      <!-- Points -->
                      <div class="text-right">
                        <div class="text-lg font-bold text-blue-800">
                          {{ scan.new_solde }} pt{{ scan.new_solde > 1 ? 's' : '' }}
                        </div>
                        <div v-if="scan.new_solde > scan.solde" class="text-xs text-green-600 font-medium">
                          +{{ scan.new_solde - scan.solde }}
                        </div>
                      </div>
                    </div>

                    <!-- Badge si récompense utilisée -->
                    <div v-if="scan.is_used"
                      class="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Récompense récupérée
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <AppReviewSystem v-if="showReviewModal" :as_modal="true" :show_existing_reviews="false"
    :boutique_slug="scannedBoutique?.slug" @review-submitted="handleReviewSubmitted" @close-modal="closeReviewModal" />
</template>

<style scoped>
.container {
  text-align: center;
  padding: 20px;
}
</style>