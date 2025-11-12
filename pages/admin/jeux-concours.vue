<template>
  <div class="container mx-auto px-4 pt-8 pb-24">
    <h1 class="text-2xl font-bold mb-6 text-blue-800">Administration des Jeux Concours</h1>
    
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else>
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2 text-blue-700">Statistiques</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-lg shadow">
            <p class="text-gray-600">Total des participants</p>
            <p class="text-2xl font-bold">{{ totalParticipants }}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow">
            <p class="text-gray-600">Gagnants</p>
            <p class="text-2xl font-bold text-green-600">{{ gagnants.length }}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow">
            <p class="text-gray-600">Perdants</p>
            <p class="text-2xl font-bold text-red-600">{{ perdants.length }}</p>
          </div>
        </div>
      </div>
      
      <!-- Liste des gagnants -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4 text-green-700">Gagnants</h2>
        <div v-if="gagnants.length === 0" class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Aucun gagnant pour le moment
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(gagnant, index) in gagnants" :key="index" class="bg-white rounded-lg shadow overflow-hidden  duration-300">
            <div class="border-l-4 border-green-500 p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ userProfiles[gagnant.user_id]?.full_name || 'Utilisateur #' + gagnant.user_id.substring(0, 8) }}
                </h3>
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Gagnant</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm" :class="gagnant.used ? 'text-green-600' : 'text-cyan-600'">
                  {{ gagnant.used ? 'Lot distribué' : 'Lot en attente' }}
                </span>
                <button 
                  v-if="user && authorizedUserIds.includes(user.id || (user.value && user.value.id))"
                  @click="marquerCommeDistribue(gagnant.id)" 
                  class="px-3 py-1 text-xs font-medium rounded-md" 
                  :class="gagnant.used ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'"
                  :disabled="gagnant.used"
                >
                  {{ gagnant.used ? 'Distribué' : 'Marquer comme distribué' }}
                </button>
                <span v-else-if="gagnant.used" class="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-500">
                  Distribué
                </span>
                <span v-else class="text-xs text-gray-500">
                  (Action réservée à l'administrateur)
                </span>
              </div>
              <div class="text-sm text-gray-600 mb-2">
                <div class="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ID: {{ gagnant.user_id }}
                </div>
                <div class="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(gagnant.created_date) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Liste des perdants -->
      <div>
        <h2 class="text-xl font-semibold mb-4 text-red-700">Perdants</h2>
        <div v-if="perdants.length === 0" class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Aucun perdant pour le moment
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(perdant, index) in perdants" :key="index" class="bg-white rounded-lg shadow overflow-hidden  duration-300">
            <div class="border-l-4 border-red-500 p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ userProfiles[perdant.user_id]?.full_name || 'Utilisateur #' + perdant.user_id.substring(0, 8) }}
                </h3>
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Perdant</span>
              </div>
              <div class="text-sm text-gray-600 mb-2">
                <div class="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ID: {{ perdant.user_id }}
                </div>
                <div class="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(perdant.created_date) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loading = ref(true)
const participants = ref([])
const userProfiles = ref({})
const authorizedUserIds = ['374432a7-64d7-4c5c-9390-8781e2f33ae5', 'd04dad76-47de-468b-ba95-b5269b1d5385']

// Données calculées
const gagnants = computed(() => {
  return participants.value.filter(p => p.lot_name === 'gagnant')
})

// Afficher l'ID de l'utilisateur actuel pour débogage
onMounted(() => {
  if (user && user.value) {
    console.log('ID utilisateur actuel:', user.value.id)
    console.log('Utilisateurs autorisés:', authorizedUserIds)
    console.log('Est autorisé:', authorizedUserIds.includes(user.value.id))
  } else {
    console.log('Aucun utilisateur connecté')
  }
})

const perdants = computed(() => {
  return participants.value.filter(p => p.lot_name === 'perdu')
})

const totalParticipants = computed(() => {
  return participants.value.length
})

// Charger les données
onMounted(async () => {
  try {
    // Récupérer tous les participants
    const { data, error } = await supabase
      .from('user_wins')
      .select('*')
      .order('created_date', { ascending: false })
    
    if (error) throw error
    
    participants.value = data || []
    
    // Récupérer les profils des utilisateurs
    if (participants.value.length > 0) {
      await fetchUserProfiles()
    }
  } catch (error) {
    console.error('Erreur lors du chargement des participants:', error)
  } finally {
    loading.value = false
  }
})

// Récupérer les profils des utilisateurs
async function fetchUserProfiles() {
  try {
    // Extraire tous les IDs utilisateurs uniques
    const userIds = [...new Set(participants.value.map(p => p.user_id))]
    
    // Récupérer les profils pour ces IDs
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    
    if (error) throw error
    
    // Créer un objet pour un accès facile par ID
    const profiles = {}
    data.forEach(profile => {
      profiles[profile.id] = profile
    })
    
    userProfiles.value = profiles
  } catch (error) {
    console.error('Erreur lors du chargement des profils:', error)
  }
}

// Formater la date
function formatDate(dateString) {
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

// Marquer un lot comme distribué
async function marquerCommeDistribue(id) {
  try {
    // Vérifier si l'utilisateur est autorisé
    const userId = user?.id || (user?.value && user.value.id)
    console.log('ID utilisateur dans la fonction:', userId)
    
    if (!userId || !authorizedUserIds.includes(userId)) {
      alert('Vous n\'avez pas les droits pour effectuer cette action.')
      return
    }
    
    console.log('Tentative de mise à jour pour ID:', id)
    
    const { data, error } = await supabase
      .from('user_wins')
      .update({ used: true })
      .eq('id', id)
      .select()
    
    console.log('Réponse de la mise à jour:', { data, error })
    
    if (error) {
      console.error('Erreur détaillée:', error)
      throw error
    }
    
    // Mettre à jour localement
    const index = participants.value.findIndex(p => p.id === id)
    if (index !== -1) {
      participants.value[index].used = true
    }
    
    alert('Le lot a été marqué comme distribué avec succès!')
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    alert('Une erreur est survenue lors de la mise à jour du statut.')
  }
}
</script>

<style scoped>
/* Styles supplémentaires si nécessaire */
</style>