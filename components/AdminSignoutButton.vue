<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      Gestion des sessions utilisateurs
    </h3>

    <!-- Recherche d'utilisateur -->
    <div class="space-y-4 mb-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Rechercher et déconnecter un utilisateur
        </label>

        <!-- Champ de recherche -->
        <div class="relative mb-3">
          <input v-model="searchQuery" @input="handleSearch" type="text"
            placeholder="Rechercher par email, nom ou ID utilisateur..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div v-if="isSearching" class="absolute right-3 top-2">
            <div class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>

        <!-- Résultats de recherche -->
        <div v-if="searchResults.length > 0" class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          <div v-for="user in searchResults" :key="user.id"
            class="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0">
            <div class="flex-1">
              <p class="font-medium text-sm">{{ user.email }}</p>
              <p class="text-xs text-gray-500">ID: {{ user.id }}</p>
              <p class="text-xs text-gray-500">
                Dernière connexion: {{ user.lastSignIn }}
              </p>
            </div>
            <button @click="signOutSpecificUser(user.id)" :disabled="isLoading"
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors">
              Déconnecter
            </button>
          </div>
        </div>

        <!-- Message si aucun résultat -->
        <div v-if="searchQuery && !isSearching && searchResults.length === 0"
          class="text-sm text-gray-500 italic p-3 border border-gray-200 rounded-lg">
          Aucun utilisateur trouvé pour "{{ searchQuery }}"
        </div>

        <!-- Déconnexion par ID direct -->
        <div class="mt-4 pt-4 border-t">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Ou déconnecter directement par ID
          </label>
          <div class="flex gap-3">
            <input v-model="userIdToSignOut" type="text" placeholder="ID utilisateur exact"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button @click="signOutSpecificUser" :disabled="isLoading || !userIdToSignOut.trim()"
              class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              <span v-if="isLoading">...</span>
              <span v-else>Déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Déconnexion globale -->
    <div class="border-t pt-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h4 class="font-medium text-red-800 mb-2">⚠️ Action dangereuse</h4>
        <p class="text-red-700 text-sm">
          Cette action déconnectera <strong>TOUS</strong> les utilisateurs connectés.
          Ils devront se reconnecter sur tous leurs appareils.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <input v-model="confirmGlobalSignout" type="checkbox" id="confirm-global" class="rounded text-red-600">
        <label for="confirm-global" class="text-sm text-gray-700">
          Je confirme vouloir déconnecter tous les utilisateurs
        </label>
      </div>

      <button @click="signOutAllUsers" :disabled="isLoading || !confirmGlobalSignout"
        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2">
        <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <span v-if="isLoading">Déconnexion en cours...</span>
        <span v-else>Déconnecter tous les utilisateurs</span>
      </button>
    </div>

    <!-- Messages de statut -->
    <div v-if="statusMessage" class="mt-4 p-4 rounded-lg" :class="{
      'bg-green-50 border border-green-200 text-green-800': statusType === 'success',
      'bg-red-50 border border-red-200 text-red-800': statusType === 'error',
      'bg-blue-50 border border-blue-200 text-blue-800': statusType === 'info'
    }">
      {{ statusMessage }}
    </div>

    <!-- Liste des sessions actives (repliable) -->
    <div v-if="activeSessions.length > 0" class="mt-6 border-t pt-6">
      <button @click="showActiveSessions = !showActiveSessions"
        class="flex items-center gap-2 font-medium text-gray-900 mb-4 hover:text-blue-600 transition-colors">
        <svg :class="{ 'rotate-90': showActiveSessions }" class="w-4 h-4 transition-transform" fill="currentColor"
          viewBox="0 0 20 20">
          <path
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
        </svg>
        Sessions récemment actives ({{ activeSessions.length }})
      </button>

      <div v-show="showActiveSessions" class="space-y-2 max-h-64 overflow-y-auto">
        <div v-for="session in activeSessions" :key="session.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p class="font-medium text-sm">{{ session.email }}</p>
            <p class="text-xs text-gray-500">
              Dernière activité: {{ formatDate(session.lastActivity) }}
            </p>
          </div>
          <button @click="signOutSpecificUser(session.id)" :disabled="isLoading"
            class="text-red-600 hover:text-red-800 text-sm disabled:opacity-50">
            Déconnecter
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

// État
const isLoading = ref(false)
const isSearching = ref(false)
const userIdToSignOut = ref('')
const confirmGlobalSignout = ref(false)
const statusMessage = ref('')
const statusType = ref('info')
const activeSessions = ref([])
const showActiveSessions = ref(false)

// Recherche
const searchQuery = ref('')
const searchResults = ref([])
let searchTimeout = null

// Recherche d'utilisateurs
const handleSearch = async () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      isSearching.value = true

      const response = await $fetch('/api/admin/search-users', {
        method: 'POST',
        body: {
          query: searchQuery.value.trim()
        }
      })

      if (response.success) {
        searchResults.value = response.users || []
      }
    } catch (error) {
      console.error('Erreur de recherche:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 500) // Délai de 500ms pour éviter trop de requêtes
}

// Déconnecter un utilisateur spécifique
const signOutSpecificUser = async (userId = null) => {
  const targetUserId = userId || userIdToSignOut.value.trim()

  if (!targetUserId) {
    showStatus('Veuillez entrer un ID utilisateur', 'error')
    return
  }

  try {
    isLoading.value = true

    const response = await $fetch('/api/admin/signout-user', {
      method: 'POST',
      body: {
        userId: targetUserId
      }
    })

    if (response.success) {
      showStatus(`Utilisateur déconnecté avec succès (banni 2 minutes)`, 'success')
      userIdToSignOut.value = ''
      searchQuery.value = ''
      searchResults.value = []
      await loadActiveSessions()
    } else {
      throw new Error(response.message || 'Erreur inconnue')
    }

  } catch (error) {
    console.error('Erreur de déconnexion:', error)
    showStatus(`Erreur: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// Déconnecter tous les utilisateurs
const signOutAllUsers = async () => {
  if (!confirmGlobalSignout.value) return

  try {
    isLoading.value = true

    const response = await $fetch('/api/admin/signout-all-users', {
      method: 'POST'
    })

    if (response.success) {
      showStatus(`${response.count || 0} utilisateurs déconnectés`, 'success')
      confirmGlobalSignout.value = false
      activeSessions.value = []
    } else {
      throw new Error(response.message || 'Erreur inconnue')
    }

  } catch (error) {
    console.error('Erreur de déconnexion globale:', error)
    showStatus(`Erreur: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// Charger les sessions actives
const loadActiveSessions = async () => {
  try {
    const response = await $fetch('/api/admin/list-users')
    activeSessions.value = response.sessions || []
  } catch (error) {
    console.error('Erreur lors du chargement des sessions:', error)
  }
}

// Utilitaires
const showStatus = (message, type = 'info') => {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 5000)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('fr-FR')
}

// Charger les sessions au montage
onMounted(() => {
  loadActiveSessions()
})
</script>