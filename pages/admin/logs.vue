<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-24">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Logs d'Activité</h1>
        <button @click="refreshLogs" :disabled="loading"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
          <svg class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loading ? 'Actualisation...' : 'Actualiser' }}
        </button>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Filtre par boutique -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Boutique</label>
            <select v-model="filters.boutique"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les boutiques</option>
              <option v-for="boutique in uniqueBoutiques" :key="boutique" :value="boutique">
                {{ boutique }}
              </option>
            </select>
          </div>

          <!-- Filtre par type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select v-model="filters.type"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              <option value="activity">Activité</option>
              <option value="reward_sms">SMS</option>
            </select>
          </div>

          <!-- Filtre par statut -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select v-model="filters.status"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="sent">Envoyé</option>
              <option value="delivered">Livré</option>
              <option value="failed">Échec</option>
              <option value="processing">En traitement</option>
              <option value="completed">Terminé</option>
            </select>
          </div>

          <!-- Filtre par utilisateur -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Utilisateur</label>
            <input v-model="filters.user" type="text" placeholder="Nom ou ID utilisateur"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <!-- Bouton reset et pagination -->
        <div class="mt-4 flex justify-between items-center">
          <button @click="resetFilters"
            class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            Réinitialiser les filtres
          </button>

          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">Logs par page:</span>
            <select v-model="pageSize" @change="currentPage = 1"
              class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Tous</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Compteur de résultats et statistiques -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-4 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ totalLogs }}</div>
            <div class="text-sm text-gray-500">Total logs</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ activityLogsCount }}</div>
            <div class="text-sm text-gray-500">Activités</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ smsLogsCount }}</div>
            <div class="text-sm text-gray-500">SMS</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-600">{{ filteredLogs.length }}</div>
            <div class="text-sm text-gray-500">{{ hasActiveFilters ? 'Filtrés' : 'Affichés' }}</div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Chargement des logs...</span>
      </div>

      <div v-else class="space-y-4">
        <!-- Pagination en haut -->
        <div v-if="totalPages > 1"
          class="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="text-sm text-gray-500">
            Affichage {{ ((currentPage - 1) * parseInt(pageSize)) + 1 }} à
            {{ Math.min(currentPage * parseInt(pageSize), filteredLogs.length) }}
            sur {{ filteredLogs.length }} entrées
          </div>
          <div class="flex space-x-2">
            <button @click="currentPage--" :disabled="currentPage <= 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Précédent
            </button>
            <span class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
              Page {{ currentPage }} / {{ totalPages }}
            </span>
            <button @click="currentPage++" :disabled="currentPage >= totalPages"
              class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Suivant
            </button>
          </div>
        </div>

        <div v-for="log in paginatedLogs" :key="`${log.type}-${log.id}`"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <!-- En-tête du log -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-3">
              <span :class="log.type === 'activity' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
                class="px-2 py-1 text-xs font-medium rounded-full">
                {{ log.type === 'activity' ? 'Activité' : 'SMS' }}
              </span>
              <span v-if="log.status" :class="getStatusClass(log.status)"
                class="px-2 py-1 text-xs font-medium rounded-full">
                {{ formatStatus(log.status) }}
              </span>
              <span v-if="log.action" class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {{ formatAction(log.action) }}
              </span>
            </div>
            <span class="text-sm text-gray-500">
              {{ formatDate(log.created_at) }}
            </span>
          </div>

          <!-- Informations principales -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div>
              <span class="text-sm font-medium text-gray-500">Boutique:</span>
              <p class="text-sm text-gray-900">{{ log.boutique_slug || 'N/A' }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">Utilisateur:</span>
              <p class="text-sm text-gray-900 truncate" :title="log.user_name">
                {{ log.user_name || log.user_id?.substring(0, 8) + '...' }}
              </p>
            </div>
            <div v-if="log.type === 'reward_sms' && log.phones_display">
              <span class="text-sm font-medium text-gray-500">Téléphone:</span>
              <p class="text-sm text-gray-900">{{ log.phones_display }}</p>
            </div>
          </div>

          <!-- Bouton Détails avec collapse -->
          <div class="border-t border-gray-100 pt-3">
            <button @click="toggleDetails(`${log.type}-${log.id}`)"
              class="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded p-2 -m-2">
              <span class="text-sm font-medium text-gray-500">Détails</span>
              <svg :class="{ 'rotate-180': expandedLogs.has(`${log.type}-${log.id}`) }"
                class="w-4 h-4 transition-transform duration-200 text-gray-400" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Contenu des détails -->
            <div v-if="expandedLogs.has(`${log.type}-${log.id}`)" class="mt-2 p-3 bg-gray-50 rounded-md">
              <pre class="text-sm text-gray-700 whitespace-pre-wrap font-sans">{{ log.details }}</pre>
            </div>
          </div>
        </div>

        <!-- Message si aucun log -->
        <div v-if="filteredLogs.length === 0"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun log trouvé</h3>
          <p class="text-gray-500">
            {{ hasActiveFilters ? 'Aucun log ne correspond aux filtres sélectionnés.' : 'Aucun log disponible.' }}
          </p>
        </div>

        <!-- Pagination en bas -->
        <div v-if="totalPages > 1"
          class="flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex space-x-2">
            <button @click="currentPage = 1" :disabled="currentPage <= 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Début
            </button>
            <button @click="currentPage--" :disabled="currentPage <= 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Précédent
            </button>
            <span class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button @click="currentPage++" :disabled="currentPage >= totalPages"
              class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Suivant
            </button>
            <button @click="currentPage = totalPages" :disabled="currentPage >= totalPages"
              class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
              Fin
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const loading = ref(true)
const logs = ref([])
const expandedLogs = ref(new Set())

// Pagination
const currentPage = ref(1)
const pageSize = ref('50')

definePageMeta({
  middleware: 'admin', // Changé de 'auth' à 'admin'
  showHeader: false,
  showFooter: false,
  showNavbar: false,
  showSidebar: false
})

// Filtres
const filters = ref({
  boutique: '',
  type: '',
  status: '',
  user: ''
})

// Computed
const uniqueBoutiques = computed(() => {
  if (!logs.value || logs.value.length === 0) return []
  const boutiques = [...new Set(logs.value.map(log => log.boutique_slug).filter(Boolean))]
  return boutiques.sort()
})

const hasActiveFilters = computed(() => {
  return filters.value.boutique || filters.value.type || filters.value.status || filters.value.user
})

const totalLogs = computed(() => logs.value.length)
const activityLogsCount = computed(() => logs.value.filter(log => log.type === 'activity').length)
const smsLogsCount = computed(() => logs.value.filter(log => log.type === 'reward_sms').length)

const filteredLogs = computed(() => {
  if (!logs.value || logs.value.length === 0) return []

  let filtered = logs.value

  if (filters.value.boutique) {
    filtered = filtered.filter(log => log.boutique_slug === filters.value.boutique)
  }

  if (filters.value.type) {
    filtered = filtered.filter(log => log.type === filters.value.type)
  }

  if (filters.value.status) {
    filtered = filtered.filter(log => log.status === filters.value.status)
  }

  if (filters.value.user) {
    const userFilter = filters.value.user.toLowerCase()
    filtered = filtered.filter(log =>
      log.user_name?.toLowerCase().includes(userFilter) ||
      log.user_id?.toLowerCase().includes(userFilter)
    )
  }

  return filtered
})

const totalPages = computed(() => {
  if (pageSize.value === 'all') return 1
  return Math.ceil(filteredLogs.value.length / parseInt(pageSize.value))
})

const paginatedLogs = computed(() => {
  if (pageSize.value === 'all') return filteredLogs.value

  const start = (currentPage.value - 1) * parseInt(pageSize.value)
  const end = start + parseInt(pageSize.value)
  return filteredLogs.value.slice(start, end)
})

// Fonctions utilitaires
const parseJSONToValues = (str) => {
  if (!str || typeof str !== 'string') return str

  try {
    const parsed = JSON.parse(str)
    if (typeof parsed === 'object' && parsed !== null) {
      const entries = Object.entries(parsed)
      return entries
        .map(([key, value]) => {
          const readableKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase()
          const capitalizedKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1)
          return `${capitalizedKey}: ${formatSimpleValue(value)}`
        })
        .join('\n')
    }
    return str
  } catch {
    return str
  }
}

const formatSimpleValue = (value) => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatStatus = (status) => {
  const statusMap = {
    'pending': 'En attente',
    'sent': 'Envoyé',
    'delivered': 'Livré',
    'failed': 'Échec',
    'processing': 'En traitement',
    'completed': 'Terminé'
  }
  return statusMap[status] || status
}

const formatAction = (action) => {
  const actionMap = {
    'add_points': 'Ajout points',
    'redeem_reward': 'Récupération récompense',
    'scan_qr': 'Scan QR',
    'manual_add': 'Ajout manuel'
  }
  return actionMap[action] || action
}

const getStatusClass = (status) => {
  const statusClasses = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'sent': 'bg-green-100 text-green-800',
    'delivered': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'processing': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800'
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800'
}

const toggleDetails = (logId) => {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId)
  } else {
    expandedLogs.value.add(logId)
  }
}

const resetFilters = () => {
  filters.value = {
    boutique: '',
    type: '',
    status: '',
    user: ''
  }
  currentPage.value = 1
}

const refreshLogs = async () => {
  await fetchLogs()
}

// Chargement des données avec une meilleure gestion
const fetchLogs = async () => {
  try {
    loading.value = true

    console.log('🔄 Début du chargement des logs...')

    // Récupération des logs d'activité avec gestion d'erreur améliorée
    console.log('📊 Chargement des activity_logs...')
    const { data: activityLogs, error: activityError, count: activityCount } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles (
          full_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    console.log(`✅ Activity logs récupérés: ${activityLogs?.length || 0} (count: ${activityCount})`)

    // Récupération des logs SMS
    console.log('📱 Chargement des reward_sms_queue...')
    const { data: smsLogs, error: smsError, count: smsCount } = await supabase
      .from('reward_sms_queue')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    console.log(`✅ SMS logs récupérés: ${smsLogs?.length || 0} (count: ${smsCount})`)

    // Récupération de tous les profils utilisateurs pour les SMS
    let smsLogsWithProfiles = smsLogs || []
    if (smsLogs && smsLogs.length > 0) {
      const userIds = [...new Set(smsLogs.map(log => log.user_id).filter(Boolean))]
      console.log(`👥 Chargement des profils pour ${userIds.length} utilisateurs...`)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      // Joindre manuellement les profiles aux SMS logs
      smsLogsWithProfiles = smsLogs.map(log => ({
        ...log,
        profiles: profiles?.find(profile => profile.id === log.user_id) || null
      }))
    }

    // Gestion des erreurs
    if (activityError) {
      console.error('❌ Erreur activity logs:', activityError)
    }
    if (smsError) {
      console.error('❌ Erreur SMS logs:', smsError)
    }

    // Formatage et combinaison des logs
    const formattedActivityLogs = (activityLogs || []).map(log => {
      const parsedDetails = parseJSONToValues(log.details || `Action: ${log.action}`)
      return {
        ...log,
        type: 'activity',
        user_name: log.profiles?.full_name || `User ${log.user_id?.substring(0, 8)}`,
        details: parsedDetails
      }
    })

    const formattedSmsLogs = (smsLogsWithProfiles || []).map(log => {
      // Gérer le champ phones qui est un JSON avec des objets
      let phonesText = ''
      try {
        if (log.phones && typeof log.phones === 'string') {
          const phonesArray = JSON.parse(log.phones)
          if (Array.isArray(phonesArray)) {
            const phoneNumbers = phonesArray.map(p => p.phone).filter(Boolean)
            phonesText = phoneNumbers.join(', ')
          }
        }
      } catch (e) {
        phonesText = log.phones || 'N/A'
      }

      let details = log.details || `SMS vers ${phonesText} - Récompense #${log.reward_id}`
      const parsedDetails = parseJSONToValues(details)

      return {
        ...log,
        type: 'reward_sms',
        user_name: log.profiles?.full_name || `User ${log.user_id?.substring(0, 8)}`,
        details: parsedDetails,
        phones_display: phonesText
      }
    })

    // Combinaison et tri par date (récent au plus ancien)
    const allLogs = [...formattedActivityLogs, ...formattedSmsLogs]
    logs.value = allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    console.log(`🎉 Chargement terminé:`, {
      activity: formattedActivityLogs.length,
      sms: formattedSmsLogs.length,
      total: logs.value.length
    })

    // Reset pagination
    currentPage.value = 1

  } catch (error) {
    console.error('💥 Erreur lors du chargement des logs:', error)
  } finally {
    loading.value = false
  }
}

// Watchers pour réinitialiser la pagination lors des filtres
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

// Lifecycle
onMounted(() => {
  fetchLogs()
})
</script>