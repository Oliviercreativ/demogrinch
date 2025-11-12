// components/NotificationDebugTester.vue
<template>
  <div class="p-6 bg-gray-50 rounded-lg space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">🔧 Debug Notifications FCM</h3>

    <!-- Infos utilisateur -->
    <div class="bg-white p-4 rounded border">
      <h4 class="font-medium mb-2">👤 Utilisateur</h4>
      <p>Connecté: {{ user ? '✅ Oui' : '❌ Non' }}</p>
      <p v-if="user">ID: {{ user.id }}</p>
      <p v-if="user">Email: {{ user.email }}</p>
    </div>

    <!-- Statut notifications -->
    <div class="bg-white p-4 rounded border">
      <h4 class="font-medium mb-2">🔔 Statut Notifications</h4>
      <p>Permission: {{ notificationPermission }}</p>
      <p>Support: {{ notificationSupport ? '✅' : '❌' }}</p>
    </div>

    <!-- Actions de test -->
    <div class="bg-white p-4 rounded border space-y-2">
      <h4 class="font-medium mb-2">🧪 Tests</h4>

      <button @click="testDatabase" class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
        1. Tester la base de données
      </button>

      <button @click="testFCMSetup" :disabled="isLoading"
        class="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50">
        2. Tester FCM Setup {{ isLoading ? '(en cours...)' : '' }}
      </button>

      <button @click="testFullFlow" :disabled="isLoading"
        class="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50">
        3. Test complet {{ isLoading ? '(en cours...)' : '' }}
      </button>
    </div>

    <!-- Console de debug -->
    <div class="bg-black text-green-400 p-4 rounded text-sm font-mono max-h-96 overflow-y-auto">
      <div v-for="(log, index) in debugLogs" :key="index">
        {{ log }}
      </div>
    </div>

    <!-- Bouton pour vider les logs -->
    <button @click="debugLogs = []" class="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
      Vider les logs
    </button>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
const { requestPermission, saveTokenForUser, testDatabaseConnection } = useFirebaseMessaging()

const isLoading = ref(false)
const debugLogs = ref([])

const notificationPermission = ref('unknown')
const notificationSupport = ref(false)

// Fonction pour ajouter des logs
const addLog = (message) => {
  const timestamp = new Date().toLocaleTimeString()
  debugLogs.value.push(`[${timestamp}] ${message}`)
}

onMounted(() => {
  notificationSupport.value = 'Notification' in window
  notificationPermission.value = Notification?.permission || 'unknown'

  addLog('🚀 Composant de debug initialisé')
  addLog(`👤 Utilisateur: ${user.value ? user.value.email : 'Non connecté'}`)
  addLog(`🔔 Support notifications: ${notificationSupport.value ? 'Oui' : 'Non'}`)
  addLog(`🔔 Permission: ${notificationPermission.value}`)
})

const testDatabase = async () => {
  addLog('🧪 Test de la base de données...')

  try {
    const result = await testDatabaseConnection()

    if (result.success) {
      addLog('✅ Base de données OK - Table user_fcm_tokens accessible')
    } else {
      addLog(`❌ Erreur base de données: ${result.error.message}`)
      addLog(`💡 Code erreur: ${result.error.code}`)

      if (result.error.code === '42P01') {
        addLog('💡 Solution: La table user_fcm_tokens n\'existe pas')
        addLog('💡 Créez-la dans Supabase SQL Editor')
      }
    }
  } catch (error) {
    addLog(`❌ Erreur test DB: ${error.message}`)
  }
}

const testFCMSetup = async () => {
  if (!user.value) {
    addLog('❌ Utilisateur non connecté - connectez-vous d\'abord')
    return
  }

  isLoading.value = true
  addLog('🧪 Test FCM Setup...')

  try {
    const token = await requestPermission()

    if (token) {
      addLog(`✅ Token FCM obtenu: ${token.substring(0, 30)}...`)
      addLog(`🔑 Longueur: ${token.length} caractères`)
      notificationPermission.value = Notification.permission
    } else {
      addLog('❌ Aucun token FCM obtenu')
    }

  } catch (error) {
    addLog(`❌ Erreur FCM: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const testFullFlow = async () => {
  if (!user.value) {
    addLog('❌ Utilisateur non connecté - connectez-vous d\'abord')
    return
  }

  isLoading.value = true
  addLog('🧪 Test du flux complet...')

  try {
    // 1. Obtenir le token
    addLog('📍 Étape 1: Obtention token FCM...')
    const token = await requestPermission()

    if (!token) {
      throw new Error('Impossible d\'obtenir le token FCM')
    }

    addLog(`✅ Token obtenu: ${token.substring(0, 30)}...`)

    // 2. Sauvegarder en base
    addLog('📍 Étape 2: Sauvegarde en base...')
    await saveTokenForUser(token, user.value.id)

    addLog('✅ Test complet réussi !')

  } catch (error) {
    addLog(`❌ Erreur flux complet: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}
</script>