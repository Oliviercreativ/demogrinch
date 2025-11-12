<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const isLoading = ref(true)
const boutiques = ref([])
const allUsers = ref([])
const searchUser = ref('')
const searchBoutique = ref('')
const isProcessing = ref(false)
const lastResults = ref([])

const ADMIN_ID = 'd04dad76-47de-468b-ba95-b5269b1d5385'

const isAdmin = computed(() => {
  return currentUser.value?.id === ADMIN_ID
})

const newReward = ref({
  user_uid_reward: '',
  store_slug: '',
  points_to_add: 1,
  action: 'add' // 'add' ou 'subtract'
})

const actionError = ref('')
const actionSuccess = ref('')

// Computed pour filtrer les utilisateurs
const filteredUsers = computed(() => {
  if (!searchUser.value) return allUsers.value.slice(0, 50) // Limiter à 50 pour les performances

  return allUsers.value.filter(user =>
    user.full_name?.toLowerCase().includes(searchUser.value.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUser.value.toLowerCase()) ||
    user.id.includes(searchUser.value)
  ).slice(0, 50)
})

// Computed pour filtrer les boutiques
const filteredBoutiques = computed(() => {
  if (!searchBoutique.value) return boutiques.value

  return boutiques.value.filter(boutique =>
    boutique.name_shop?.toLowerCase().includes(searchBoutique.value.toLowerCase()) ||
    boutique.slug?.toLowerCase().includes(searchBoutique.value.toLowerCase())
  )
})

// Computed pour vérifier si le formulaire est valide
const isFormValid = computed(() => {
  return newReward.value.user_uid_reward &&
    newReward.value.store_slug &&
    newReward.value.points_to_add > 0
})

// Computed pour le texte du bouton
const actionButtonText = computed(() => {
  if (isProcessing.value) {
    return newReward.value.action === 'add' ? 'Ajout en cours...' : 'Retrait en cours...'
  }
  return newReward.value.action === 'add' ?
    `Ajouter ${newReward.value.points_to_add} point(s)` :
    `Retirer ${newReward.value.points_to_add} point(s)`
})

// Computed pour la couleur du bouton
const actionButtonClass = computed(() => {
  const baseClass = 'flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  if (newReward.value.action === 'add') {
    return `${baseClass} bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-200`
  } else {
    return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-200`
  }
})

// Watcher pour réinitialiser les messages
watch([() => newReward.value.user_uid_reward, () => newReward.value.store_slug], () => {
  actionError.value = ''
  actionSuccess.value = ''
})

onMounted(async () => {
  if (!isAdmin.value) {
    await navigateTo('/')
    return
  }

  try {
    // Charger toutes les boutiques
    const { data: boutiquesData, error: boutiquesError } = await supabase
      .from('boutique')
      .select('slug, name_shop, limite, lot')
      .eq('statut', true)
      .order('name_shop')

    if (boutiquesError) throw boutiquesError
    boutiques.value = boutiquesData

    // Charger tous les utilisateurs
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name')

    if (usersError) throw usersError
    allUsers.value = usersData

  } catch (error) {
    console.error('Erreur lors du chargement:', error)
    actionError.value = `Erreur lors du chargement: ${error.message}`
  } finally {
    isLoading.value = false
  }
})

// ✅ NOUVELLE FONCTION UTILISANT L'API ADD-POINT
const processReward = async () => {
  if (!isFormValid.value) {
    actionError.value = "Veuillez remplir tous les champs requis"
    return
  }

  isProcessing.value = true
  actionError.value = ''
  actionSuccess.value = ''

  try {
    const selectedUser = allUsers.value.find(u => u.id === newReward.value.user_uid_reward)
    const selectedBoutique = boutiques.value.find(b => b.slug === newReward.value.store_slug)

    console.log(`🎯 ${newReward.value.action === 'add' ? 'Ajout' : 'Retrait'} de ${newReward.value.points_to_add} point(s) pour ${selectedUser?.full_name} chez ${selectedBoutique?.name_shop}`)

    if (newReward.value.action === 'subtract') {
      // Pour le retrait, utiliser une API spécifique ou gérer différemment
      throw new Error('Fonctionnalité de retrait de points non encore implémentée avec l\'API add-point')
    }

    // ✅ APPEL À L'API ADD-POINT
    const response = await $fetch('/api/rewards/add-point', {
      method: 'POST',
      body: {
        user_id: newReward.value.user_uid_reward,
        boutique_slug: newReward.value.store_slug,
        source: 'admin', // Source admin
        points_to_add: newReward.value.points_to_add,
        check_scan_limit: false, // Pas de limite pour l'admin
        check_geolocation: false, // Pas de géolocalisation pour l'admin
        admin_notes: `Ajout manuel par l'administrateur ${currentUser.value.email || currentUser.value.id} depuis la page d'administration`
      }
    })

    if (response.success) {
      console.log('✅ Points traités avec succès:', response)

      // Message de succès détaillé
      const successMessage = response.data.reward_earned
        ? `🎉 ${newReward.value.points_to_add} point(s) ajouté(s) avec succès ! ${selectedUser?.full_name} a gagné: ${response.data.reward_description} chez ${response.data.boutique_name} ! SMS en cours d'envoi...`
        : `✅ ${newReward.value.points_to_add} point(s) ajouté(s) avec succès ! ${selectedUser?.full_name} a maintenant ${response.data.new_solde}/${response.data.boutique_limit} points chez ${response.data.boutique_name}${response.data.double_points_campaign ? ' (campagne x2 active)' : ''}`

      actionSuccess.value = successMessage

      // Ajouter aux résultats récents
      lastResults.value.unshift({
        id: Date.now(),
        user: selectedUser,
        boutique: selectedBoutique,
        action: newReward.value.action,
        points: newReward.value.points_to_add,
        result: response.data,
        timestamp: new Date().toISOString()
      })

      // Garder seulement les 10 derniers résultats
      if (lastResults.value.length > 10) {
        lastResults.value = lastResults.value.slice(0, 10)
      }

      // Réinitialiser le formulaire
      newReward.value = {
        user_uid_reward: '',
        store_slug: '',
        points_to_add: 1,
        action: 'add'
      }
      searchUser.value = ''
      searchBoutique.value = ''

    } else {
      throw new Error(response.message || 'Erreur lors du traitement des points')
    }

  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error)

    // Gestion des erreurs spécifiques
    let errorMessage = 'Une erreur est survenue lors du traitement'

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

    actionError.value = errorMessage

  } finally {
    isProcessing.value = false
  }
}

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const clearMessages = () => {
  actionError.value = ''
  actionSuccess.value = ''
}
</script>

<template>
  <div v-if="isAdmin" class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Administration des Points de Fidélité</h1>
        <p class="mt-2 text-gray-600">Ajouter ou retirer des points pour n'importe quel utilisateur et boutique</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Formulaire principal -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Gestion des Points
            </h2>

            <div v-if="isLoading" class="text-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-4 text-gray-600">Chargement des données...</p>
            </div>

            <div v-else class="space-y-6">
              <!-- Sélection de l'action -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Type d'action</label>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="newReward.action = 'add'; clearMessages()" :class="[
                    'p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center',
                    newReward.action === 'add'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                  ]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter des points
                  </button>
                  <button @click="newReward.action = 'subtract'; clearMessages()" :class="[
                    'p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center',
                    newReward.action === 'subtract'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                  ]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                    Retirer des points
                  </button>
                </div>
              </div>

              <!-- Sélection de l'utilisateur -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Utilisateur</label>
                <div class="space-y-3">
                  <input v-model="searchUser" type="text" placeholder="Rechercher un utilisateur (nom, email, ID...)"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <select v-model="newReward.user_uid_reward"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    @change="clearMessages">
                    <option value="">Sélectionner un utilisateur</option>
                    <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
                      {{ user.full_name || 'Sans nom' }} ({{ user.email }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Sélection de la boutique -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Boutique</label>
                <div class="space-y-3">
                  <input v-model="searchBoutique" type="text" placeholder="Rechercher une boutique..."
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <select v-model="newReward.store_slug"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    @change="clearMessages">
                    <option value="">Sélectionner une boutique</option>
                    <option v-for="boutique in filteredBoutiques" :key="boutique.slug" :value="boutique.slug">
                      {{ boutique.name_shop }} (Limite: {{ boutique.limite }}, Récompense: {{ boutique.lot || 'Nondéfinie' }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Nombre de points -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de points</label>
                <input v-model.number="newReward.points_to_add" type="number" min="1" max="100"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  @input="clearMessages">
              </div>

              <!-- Messages -->
              <div v-if="actionError" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd" />
                  </svg>
                  <p class="text-red-800 text-sm">{{ actionError }}</p>
                </div>
              </div>

              <div v-if="actionSuccess" class="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd" />
                  </svg>
                  <p class="text-green-800 text-sm">{{ actionSuccess }}</p>
                </div>
              </div>

              <!-- Bouton d'action -->
              <button @click="processReward" :disabled="!isFormValid || isProcessing" :class="actionButtonClass">
                <svg v-if="isProcessing" class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ actionButtonText }}
              </button>
            </div>
          </div>
        </div>

        <!-- Historique des actions récentes -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Actions Récentes
            </h3>

            <div v-if="lastResults.length === 0" class="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p class="text-sm">Aucune action récente</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="result in lastResults" :key="result.id"
                class="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div class="flex items-center justify-between mb-2">
                  <span :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    result.action === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]">
                    {{ result.action === 'add' ? '+' : '-' }}{{ result.points }} pts
                  </span>
                  <span class="text-xs text-gray-500">{{ formatDate(result.timestamp) }}</span>
                </div>
                <p class="text-sm font-medium text-gray-900">{{ result.user?.full_name }}</p>
                <p class="text-xs text-gray-600">{{ result.boutique?.name_shop }}</p>
                <div v-if="result.result?.reward_earned" class="mt-2 text-xs text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Récompense gagnée !
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-red-500" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
      <p class="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
    </div>
  </div>
</template>