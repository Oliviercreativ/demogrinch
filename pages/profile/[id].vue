<!-- pages/profile/[id].vue - Version avec API add-point -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue'
import HistoryReward from '@/components/HistoryReward.vue'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const currentUser = useSupabaseUser()
const profile = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isOwner = ref(false)
const historyRewardRef = ref(null)
const defaultAvatarUrl = '/logo-mic.svg'
const defaultCoverUrl = '/cover-madeinconflans.jpg'
const totalRewards = ref(0)
const uniqueStores = ref(0)
const totalptsreward = ref(0)
const storeRewards = ref([])
const users = ref([])
const userId = ref(null)
const boutiqueSlug = ref('')
const ownedBoutiques = ref('')

// ✅ NOUVEAUX ÉTATS POUR L'API
const isAddingPoints = ref({}) // Tracking des boutiques en cours d'ajout

const protectedUserId = 'd04dad76-47de-468b-ba95-b5269b1d5385'
const isProtectedUser = computed(() => {
  return currentUser.value?.id === protectedUserId
})

// 🔒 RGPD: Slugs des boutiques autorisées pour cet owner (null si admin)
const allowedBoutiqueSlugs = computed(() => {
  if (isProtectedUser.value) {
    return null // Admin voit tout
  }
  // Owner ne voit que ses boutiques
  return ownedBoutiques.value.map(b => b.slug)
})

// 🔒 RGPD: Statistiques filtrées selon les droits
const displayedTotalRewards = computed(() => {
  if (isProtectedUser.value) {
    return totalRewards.value // Admin voit tout
  }
  // Owner voit uniquement ses boutiques
  return storeRewards.value.reduce((sum, store) => sum + store.points, 0)
})

const displayedUniqueStores = computed(() => {
  if (isProtectedUser.value) {
    return uniqueStores.value // Admin voit tout
  }
  // Owner voit uniquement ses boutiques
  return storeRewards.value.length
})

const fetchProfileAndStats = async () => {
  const { id } = route.params
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError) throw profileError

    if (profileData) {
      profile.value = profileData

      const { data: rewards, error: rewardsError } = await supabase
        .from('reward')
        .select('id, store_slug, new_solde')
        .eq('user_uid_reward', id)
        .order('hit_date', { ascending: false })

      if (rewardsError) throw rewardsError

      // Nouvelle logique de calcul
      const storePointsMap = new Map()

      // Garder le dernier solde pour chaque boutique
      rewards.forEach(reward => {
        if (!storePointsMap.has(reward.store_slug)) {
          storePointsMap.set(reward.store_slug, reward.new_solde)
        }
      })

      // Calculer les statistiques
      totalRewards.value = rewards.length
      uniqueStores.value = storePointsMap.size

      // Calculer le total des points en additionnant le dernier solde de chaque boutique
      totalptsreward.value = Array.from(storePointsMap.values()).reduce((sum, points) => sum + points, 0)

      // Préparer les données pour l'affichage
      let allStoreRewards = Array.from(storePointsMap, ([store_slug, points]) => ({
        store_slug,
        points
      }))

      // 🔒 RGPD: Filtrer les statistiques si pas admin
      if (!isProtectedUser.value && ownedBoutiques.value.length > 0) {
        const ownerSlugs = ownedBoutiques.value.map(b => b.slug)
        allStoreRewards = allStoreRewards.filter(store => ownerSlugs.includes(store.store_slug))
      }

      storeRewards.value = allStoreRewards
    }
  } catch (e) {
    console.error("Erreur lors de la récupération du profil ou des statistiques:", e)
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchProfileAndStats)

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const options = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Intl.DateTimeFormat('fr-FR', options).format(date)
}

const getAvatarUrl = (url) => {
  return url || defaultAvatarUrl
}

const getCoverUrl = (url) => {
  return url || defaultCoverUrl
}

const handleRewardAdded = (newReward) => {
  // Mettre à jour les statistiques après l'ajout d'un reward
  console.log('Nouvelle récompense ajoutée:', newReward)
  // Rafraîchir les données du profil pour afficher les nouveaux points
  fetchProfileAndStats()
}

// ✅ NOUVELLE FONCTION UTILISANT L'API ADD-POINT
const addMultipleRewards = async (boutiqueSlug, quantity) => {
  if (!quantity || quantity < 1) {
    alert('Veuillez spécifier une quantité valide')
    return
  }

  // Marquer cette boutique comme en cours de traitement
  isAddingPoints.value[boutiqueSlug] = true

  try {
    console.log(`🎯 Ajout de ${quantity} point(s) pour ${boutiqueSlug} via API add-point`)

    // ✅ APPEL À L'API ADD-POINT
    const response = await $fetch('/api/rewards/add-point', {
      method: 'POST',
      body: {
        user_id: route.params.id, // ID de l'utilisateur consulté
        boutique_slug: boutiqueSlug,
        source: 'owner',
        points_to_add: quantity,
        is_read: false,
        check_scan_limit: false, // Pas de limite de scan pour l'admin
        check_geolocation: false, // Pas de géolocalisation pour l'admin
        admin_notes: `Ajout manuel par ${user.value.email || user.value.id} depuis le profil dans admin`
      }
    })

    if (response.success) {
      console.log('✅ Points ajoutés avec succès:', response)

      // Afficher le message de succès avec les détails
      const message = response.data.reward_earned
        ? `🎉 ${quantity} point(s) ajouté(s) ! ${response.data.boutique_name} - RÉCOMPENSE GAGNÉE: ${response.data.reward_description} !`
        : `✅ ${quantity} point(s) ajouté(s) avec succès ! ${response.data.new_solde}/${response.data.boutique_limit} points chez ${response.data.boutique_name}`

      alert(message)

      // Rafraîchir les données
      await fetchProfileAndStats()

      // Réinitialiser le champ de quantité
      const boutique = ownedBoutiques.value.find(b => b.slug === boutiqueSlug)
      if (boutique) {
        boutique.pointsToAdd = 1
      }

    } else {
      throw new Error(response.message || 'Erreur lors de l\'ajout des points')
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des points:', error)

    // Gestion des erreurs spécifiques
    let errorMessage = 'Une erreur est survenue lors de l\'ajout des points'

    if (error.statusCode === 409) {
      errorMessage = 'Limite journalière de scan atteinte pour cette boutique'
    } else if (error.statusCode === 404) {
      if (error.message?.includes('Boutique')) {
        errorMessage = 'Boutique non trouvée ou inactive'
      } else if (error.message?.includes('Utilisateur')) {
        errorMessage = 'Utilisateur non trouvé'
      }
    } else if (error.statusCode === 400) {
      errorMessage = error.message || 'Paramètres invalides'
    } else if (error.message) {
      errorMessage = error.message
    }

    alert(`❌ Erreur: ${errorMessage}`)

  } finally {
    // Retirer le marqueur de traitement en cours
    isAddingPoints.value[boutiqueSlug] = false
  }
}

const handleSignOutAllSessions = async () => {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) throw error
    router.push('/')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    alert('Une erreur est survenue lors de la déconnexion')
  }
}

onMounted(async () => {
  if (!user.value) {
    router.push('/')
    return
  }

  // Récupérer le profil et les stats
  await fetchProfileAndStats()

  // Vérifier si propriétaire de boutiques
  const { data: boutiques, error } = await supabase
    .from('boutique')
    .select('*')
    .eq('owner', user.value.id)

  if (boutiques && boutiques.length > 0) {
    isOwner.value = true
    ownedBoutiques.value = boutiques.map(b => ({
      ...b,
      pointsToAdd: 1
    }))
  } else {
    isOwner.value = false
    router.push('/')
  }

  isLoading.value = false
})
</script>

<template>
  <div class="container mx-auto pb-24">
    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-else-if="error" class="text-red-600">
      {{ error }}
    </div>
    <div v-else-if="isOwner && profile" class="overflow-hidden sm:rounded-lg">
      <div class="px-4 py-2 sm:px-6 relative">
        <p class="text-lg text-blue-800 font-medium uppercase">{{ profile.full_name }}</p>
      </div>

      <!-- Section pour ajouter des points (avec API) -->
      <div class="px-4 mt-2 mb-6" v-if="ownedBoutiques && ownedBoutiques.length > 0">
        <div v-for="boutique in ownedBoutiques" :key="boutique.id" class="mb-4 bg-white p-4 rounded-lg shadow">
          <p class="text-sm text-blue-800 font-medium mb-2">{{ boutique.name_shop }}</p>
          <p class="text-xs text-gray-600 mb-3">Limite: {{ boutique.limite }} points - Récompense: {{ boutique.lot ||
            'Non définie' }}</p>

          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Ajouter des points de fidélité
                <span class="text-xs text-gray-500">(via API add-point)</span>
              </label>
              <input type="number" v-model.number="boutique.pointsToAdd" min="1" max="50"
                :disabled="isAddingPoints[boutique.slug]"
                class="w-full text-blue-800 rounded-md border border-blue-800 p-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                :placeholder="'Nombre de points (max 50)'">
            </div>

            <button @click="addMultipleRewards(boutique.slug, boutique.pointsToAdd || 1)"
              :disabled="isAddingPoints[boutique.slug]"
              class="mt-6 px-4 py-2 bg-blue-800 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
              <span v-if="isAddingPoints[boutique.slug]" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                Ajout...
              </span>
              <span v-else>Ajouter</span>
            </button>
          </div>

          <!-- Indicateur de statut -->
          <div v-if="isAddingPoints[boutique.slug]" class="mt-2 text-xs text-blue-600 flex items-center">
            <svg class="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Traitement via API add-point...
          </div>
        </div>
      </div>

      <!-- 🔒 RGPD: Statistiques filtrées selon les droits -->
      <div class="px-4 pb-5">
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-blue-100 rounded-lg flex justify-center flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award stroke-blue-800"
              width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
              stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
              <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
              <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
            </svg>
            <p class="text-3xl font-bold text-blue-800">{{ displayedTotalRewards }}</p>
            <p class="text-sm text-blue-600">
              {{ isProtectedUser ? 'Points de fidélité total' : 'Points dans vos boutiques' }}
            </p>
          </div>
          <div class="text-center p-4 bg-green-100 rounded-lg flex justify-center flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gift-card stroke-green-800"
              width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
              stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
              <path d="M7 16l3 -3l3 3" />
              <path
                d="M8 13c-.789 0 -2 -.672 -2 -1.5s.711 -1.5 1.5 -1.5c1.128 -.02 2.077 1.17 2.5 3c.423 -1.83 1.372 -3.02 2.5 -3c.789 0 1.5 .672 1.5 1.5s-1.211 1.5 -2 1.5h-4z" />
            </svg>
            <p class="text-3xl font-bold text-green-800">{{ displayedUniqueStores }}</p>
            <p class="text-sm text-green-600">
              {{ isProtectedUser ? 'Cartes de fidélité total' : 'Vos boutiques' }}
            </p>
          </div>
        </div>
      </div>
      <!-- 🔒 RGPD: Informations personnelles (admin uniquement) -->
      <div class="px-4" v-if="isProtectedUser">
        <div class="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800">
          <dl>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Téléphone</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">{{ profile.tel || 'Non renseigné' }}</dd>
            </div>
            <div class="bg-blue-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Code postal</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">{{ profile.adresse || 'Non renseigné' }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Dernière connexion</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">{{ formatDate(profile.last_seen) }}</dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Date d'inscription</dt>
              <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">{{ formatDate(profile.created_at) }}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div>
        <!-- 🔒 RGPD: Section "Points par boutique" affichée selon les droits -->
        <div class="px-4 mt-6" v-if="storeRewards.length > 0">
          <p class="text-lg uppercase text-blue-800 font-medium mb-4">
            {{ isProtectedUser ? 'Points par boutique (toutes)' : 'Points dans vos boutiques' }}
          </p>
          <div>
            <div class="overflow-hidden shadow rounded-lg border dark:bg-gray-800">
              <dl>
                <div v-for="store in storeRewards" :key="store.store_slug" class="flex justify-between items-center">
                  <div class="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">{{ store.store_slug }}
                    </dt>
                    <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">{{ store.points }} points</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        <!-- 🔒 RGPD: Historique filtré selon les boutiques autorisées -->
        <HistoryReward ref="historyRewardRef" :allowedSlugs="allowedBoutiqueSlugs" />
      </div>
    </div>
  </div>
</template>