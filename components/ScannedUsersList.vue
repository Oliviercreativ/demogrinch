<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const users = ref([])
const isLoading = ref(true)
const error = ref(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const boutiqueSlug = ref('')
const boutiqueData = ref(null)
const userPointsState = ref({})

// ✅ NOUVEAUX ÉTATS POUR L'API
const isAddingPoints = ref({}) // Tracking des utilisateurs en cours d'ajout

const fetchUsers = async () => {
  // Vérifier que l'utilisateur actuel est connecté
  if (!currentUser.value?.id) {
    error.value = 'Utilisateur non connecté'
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null
  try {
    // Récupérer la boutique du propriétaire
    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', currentUser.value.id)
      .single()

    if (boutiqueError) throw boutiqueError

    boutiqueSlug.value = boutique.slug
    boutiqueData.value = boutique

    // Récupérer tous les rewards pour cette boutique avec les informations des profiles
    const { data: rewards, error: rewardsError } = await supabase
      .from('reward')
      .select(`
        *,
        profiles:user_uid_reward (*)
      `)
      .eq('store_slug', boutiqueSlug.value)
      .order('hit_date', { ascending: false })

    if (rewardsError) throw rewardsError

    // Créer une map des utilisateurs avec leurs statistiques
    const userMap = {}
    rewards.forEach(reward => {
      const userId = reward.user_uid_reward
      if (!userMap[userId]) {
        userMap[userId] = {
          ...reward.profiles,
          totalScans: 0,
          lastScanDate: null,
          currentPoints: 0,
          lastReward: null
        }
        userPointsState.value[userId] = 0
      }
      userMap[userId].totalScans++

      // Pour l'affichage, on prend le new_solde du dernier reward
      // Si le dernier reward est utilisé (is_used: true), on affiche 0 pour le nouveau cycle
      if (!userMap[userId].lastScanDate || new Date(reward.hit_date) > new Date(userMap[userId].lastScanDate)) {
        userMap[userId].lastScanDate = reward.hit_date
        userMap[userId].lastReward = reward

        // Si ce reward est utilisé, on affiche 0 (nouveau cycle), sinon on affiche le new_solde
        userMap[userId].currentPoints = reward.is_used ? 0 : reward.new_solde
        userPointsState.value[userId] = userMap[userId].currentPoints
      }
    })

    users.value = Object.values(userMap)

  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

const totalUsers = computed(() => {
  return users.value.filter(user => user.totalScans > 0).length
})

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const handleImageError = (e) => {
  e.target.src = '/apple-touch-icon-180x180.png'
}

// ✅ NOUVELLE FONCTION UTILISANT L'API ADD-POINT
const addQuickReward = async (userId) => {
  if (!userId || !boutiqueSlug.value) {
    alert('Données manquantes pour ajouter le point')
    return
  }

  // Marquer cet utilisateur comme en cours de traitement
  isAddingPoints.value[userId] = true

  try {
    console.log(`🎯 Ajout d'un point pour utilisateur ${userId} via API add-point`)

    // ✅ APPEL À L'API ADD-POINT
    const response = await $fetch('/api/rewards/add-point', {
      method: 'POST',
      body: {
        user_id: userId,
        boutique_slug: boutiqueSlug.value,
        source: 'owner', // Source owner pour identifier que ça vient du propriétaire
        points_to_add: 1,
        check_scan_limit: false, // Pas de limite de scan pour le propriétaire
        check_geolocation: false, // Pas de géolocalisation pour le propriétaire
        admin_notes: `Ajout manuel par le propriétaire ${currentUser.value.email || currentUser.value.id} depuis la liste des clients`
      }
    })

    if (response.success) {
      console.log('✅ Point ajouté avec succès:', response)

      // Afficher le message de succès avec les détails
      const message = response.data.reward_earned
        ? `🎉 Point ajouté ! ${response.data.boutique_name} - RÉCOMPENSE GAGNÉE: ${response.data.reward_description} ! SMS en cours d'envoi...`
        : `✅ Point ajouté avec succès ! ${response.data.new_solde}/${response.data.boutique_limit} points${response.data.double_points_campaign ? ' (campagne x2 active)' : ''}`

      alert(message)

      // Mettre à jour l'état local
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex].totalScans++
        users.value[userIndex].currentPoints = response.data.new_solde
        users.value[userIndex].lastScanDate = new Date().toISOString()
        userPointsState.value[userId] = response.data.new_solde
      }

    } else {
      throw new Error(response.message || 'Erreur lors de l\'ajout du point')
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du point:', error)

    // Gestion des erreurs spécifiques
    let errorMessage = 'Une erreur est survenue lors de l\'ajout du point'

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
    isAddingPoints.value[userId] = false
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

onMounted(() => {
  // Attendre que l'utilisateur soit disponible avant de charger les données
  if (currentUser.value) {
    fetchUsers()
  } else {
    // Surveiller les changements d'état de l'utilisateur
    const unwatch = watch(currentUser, (newUser) => {
      if (newUser?.id) {
        fetchUsers()
        unwatch() // Arrêter de surveiller une fois qu'on a l'utilisateur
      }
    }, { immediate: true })
  }
})
</script>

<template>
  <div class="scanned-users-list w-full">
    <h2 class="text-md text-blue-900 font-medium mb-4 text-balance text-center">
      {{ totalUsers }} clients ayant scanné votre QR code
    </h2>

    <!-- Informations de la boutique -->
    <div v-if="boutiqueData" class="mb-4 p-3 bg-blue-50 rounded-lg">
      <p class="text-sm font-medium text-blue-800">{{ boutiqueData.name_shop }}</p>
      <p class="text-xs text-gray-600">
        Limite: {{ boutiqueData.limite }} points - Récompense: {{ boutiqueData.lot || 'Non définie' }}
      </p>
    </div>

    <div class="mb-4">
      <div class="flex w-full rounded bg-white border border-gray-300">
        <input v-model="searchTerm" type="text" placeholder="Rechercher un utilisateur"
          class="w-full border-none bg-white px-4 py-1 text-gray-700 outline-none focus:outline-none">
        <button type="submit" class="m-2 rounded bg-blue-800 px-4 py-2 text-white">
          <svg class="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.966 56.966">
            <path
              d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-else-if="error">Une erreur est survenue : {{ error }}</div>
    <div v-else>
      <div class="mt-4 flex justify-between items-center pb-4">
        <button @click="previousPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300">
          &lt;
        </button>
        <span>{{ currentPage }} sur {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages"
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300">
          &gt;
        </button>
      </div>

      <div class="grid gap-4 mb-6">
        <div v-for="user in paginatedUsers" :key="user.id"
          class="bg-white rounded-lg overflow-hidden  duration-300">
          <div class="flex items-center p-4 border-b border-gray-100">
            <div class="relative">
              <NuxtLink :to="`/profile/${user.id}`" class="block">
                <img :src="user.avatar_url" :alt="`Avatar de ${user.full_name || 'l\'utilisateur'}`"
                  @error="handleImageError" class="w-16 h-16 rounded-full object-cover border-2 border-blue-100" />
              </NuxtLink>
              <div
                class="absolute -bottom-1 -right-1 bg-blue-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {{ userPointsState[user.id] || 0 }}
              </div>
            </div>

            <div class="ml-4 flex-grow">
              <div class="flex justify-between items-center">
                <NuxtLink :to="`/profile/${user.id}`" class="block">
                  <h3 class="font-medium text-blue-800 text-lg">{{ user.full_name || 'Utilisateur sans nom' }}</h3>
                </NuxtLink>

                <!-- ✅ BOUTON AMÉLIORÉ AVEC ÉTAT DE CHARGEMENT -->
                <button @click.prevent="addQuickReward(user.id)" :disabled="isAddingPoints[user.id]"
                  class="flex items-center justify-center bg-blue-800 text-white rounded-full w-8 h-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="isAddingPoints[user.id] ? 'Ajout en cours...' : 'Ajouter un point'">
                  <!-- Icône de chargement -->
                  <svg v-if="isAddingPoints[user.id]" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>

                  <!-- Icône plus -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div class="grid grid-cols-1 gap-2 mt-2">
                <div class="flex items-center text-xs text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-800" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ formatDate(user.last_seen) }}</span>
                </div>

                <div class="flex items-center text-xs text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-800" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 003 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>{{ new Date(user.lastScanDate).toLocaleDateString('fr-FR') }}</span>
                </div>

                <!-- ✅ INDICATEUR DE TRAITEMENT -->
                <div v-if="isAddingPoints[user.id]" class="flex items-center text-xs text-blue-600">
                  <svg class="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  Ajout en cours via API...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-between items-center">
        <button @click="previousPage" :disabled="currentPage === 1"
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300">
          &lt;
        </button>
        <span>{{ currentPage }} sur {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages"
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300">
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>