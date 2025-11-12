<!-- pages/admin/test-sms.vue -->
<template>
    <div class="container mx-auto p-6 pb-24 max-w-4xl">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">🧪 Test Service SMS</h1>

        <!-- Test direct du serveur SMS -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">📡 Test Direct Serveur SMS</h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input v-model="directTest.phone" type="text" placeholder="0686913820"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <input v-model="directTest.message" type="text" placeholder="Test direct"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Token</label>
                    <input v-model="directTest.token" type="text" placeholder="azerty"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <button @click="testDirectSMS" :disabled="isTestingDirect"
                class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isTestingDirect ? 'Test en cours...' : '🚀 Test Direct' }}
            </button>

            <div v-if="directResult" class="mt-4 p-4 rounded-md"
                :class="directResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <h3 class="font-medium" :class="directResult.success ? 'text-green-800' : 'text-red-800'">
                    {{ directResult.success ? '✅ Succès' : '❌ Erreur' }}
                </h3>
                <pre
                    class="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(directResult, null, 2) }}</pre>
            </div>
        </div>

        <!-- Test via API Nuxt -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">🔄 Test via API Nuxt</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input v-model="apiTest.phone" type="text" placeholder="0686913820"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <input v-model="apiTest.message" type="text" placeholder="Test API Nuxt"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <button @click="testNuxtAPI" :disabled="isTestingAPI"
                class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isTestingAPI ? 'Test en cours...' : '📱 Test API Nuxt' }}
            </button>

            <div v-if="apiResult" class="mt-4 p-4 rounded-md"
                :class="apiResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <h3 class="font-medium" :class="apiResult.success ? 'text-green-800' : 'text-red-800'">
                    {{ apiResult.success ? '✅ Succès' : '❌ Erreur' }}
                </h3>
                <pre
                    class="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(apiResult, null, 2) }}</pre>
            </div>
        </div>

        <!-- Test Queue SMS -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">⏳ Gestion Queue SMS</h2>

            <div class="flex gap-4 mb-4">
                <button @click="checkQueue" :disabled="isCheckingQueue"
                    class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50">
                    {{ isCheckingQueue ? 'Vérification...' : '👀 Vérifier Queue' }}
                </button>

                <button @click="processQueue" :disabled="isProcessingQueue"
                    class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50">
                    {{ isProcessingQueue ? 'Traitement...' : '⚡ Traiter Queue' }}
                </button>
            </div>

            <div v-if="queueResult" class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 class="font-medium text-gray-800 mb-2">Résultat Queue :</h3>
                <pre class="text-sm text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(queueResult, null, 2) }}</pre>
            </div>
        </div>

        <!-- Statut global -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">📊 Statut Global</h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-lg" :class="getStatusClass('direct')">
                    <h3 class="font-medium">Serveur SMS Direct</h3>
                    <p class="text-sm mt-1">{{ getStatusText('direct') }}</p>
                </div>

                <div class="p-4 rounded-lg" :class="getStatusClass('api')">
                    <h3 class="font-medium">API Nuxt</h3>
                    <p class="text-sm mt-1">{{ getStatusText('api') }}</p>
                </div>

                <div class="p-4 rounded-lg" :class="getStatusClass('queue')">
                    <h3 class="font-medium">Queue SMS</h3>
                    <p class="text-sm mt-1">{{ getStatusText('queue') }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
    middleware: 'admin',
    showHeader: false,
    showFooter: false,
    showNavbar: false,
    showSidebar: false
})

// Variables réactives
const directTest = ref({
    phone: '0686913820',
    message: 'Test direct serveur',
    token: 'azerty'
})

const apiTest = ref({
    phone: '0686913820',
    message: 'Test API Nuxt'
})

const isTestingDirect = ref(false)
const isTestingAPI = ref(false)
const isCheckingQueue = ref(false)
const isProcessingQueue = ref(false)

const directResult = ref(null)
const apiResult = ref(null)
const queueResult = ref(null)

// Status tracking
const status = ref({
    direct: null, // null, 'success', 'error'
    api: null,
    queue: null
})

// Test direct du serveur SMS
const testDirectSMS = async () => {
    isTestingDirect.value = true
    directResult.value = null

    try {
        const url = `http://88.202.237.36/sendsms.php?num=${directTest.value.phone}&message=${encodeURIComponent(directTest.value.message)}&token=${directTest.value.token}`

        console.log('🚀 Test direct URL:', url)

        // Note: fetch direct depuis le navigateur peut être bloqué par CORS
        // On passe par notre API pour faire le test
        const response = await $fetch('/api/admin/test-direct-sms', {
            method: 'POST',
            body: {
                phone: directTest.value.phone,
                message: directTest.value.message,
                token: directTest.value.token
            }
        })

        directResult.value = response
        status.value.direct = response.success ? 'success' : 'error'

    } catch (error) {
        directResult.value = {
            success: false,
            error: error.message || 'Erreur inconnue',
            timestamp: new Date().toISOString()
        }
        status.value.direct = 'error'
        console.error('❌ Erreur test direct:', error)
    } finally {
        isTestingDirect.value = false
    }
}

// Test via API Nuxt
const testNuxtAPI = async () => {
    isTestingAPI.value = true
    apiResult.value = null

    try {
        const response = await $fetch('/api/sendsms', {
            method: 'POST',
            body: {
                phone: apiTest.value.phone,
                message: apiTest.value.message,
                user_id: 'admin-test'
            }
        })

        apiResult.value = response
        status.value.api = response.success ? 'success' : 'error'

    } catch (error) {
        apiResult.value = {
            success: false,
            error: error.message || 'Erreur inconnue',
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
        }
        status.value.api = 'error'
        console.error('❌ Erreur test API:', error)
    } finally {
        isTestingAPI.value = false
    }
}

// Vérifier la queue
const checkQueue = async () => {
    isCheckingQueue.value = true

    try {
        const response = await $fetch('/api/sms/check-queue', {
            method: 'GET'
        })

        queueResult.value = {
            action: 'check',
            ...response,
            timestamp: new Date().toISOString()
        }
        status.value.queue = response.success ? 'success' : 'error'

    } catch (error) {
        queueResult.value = {
            action: 'check',
            success: false,
            error: error.message || 'Erreur vérification queue',
            timestamp: new Date().toISOString()
        }
        status.value.queue = 'error'
    } finally {
        isCheckingQueue.value = false
    }
}

// Traiter la queue
const processQueue = async () => {
    isProcessingQueue.value = true

    try {
        const response = await $fetch('/api/sms/process-queue', {
            method: 'POST'
        })

        queueResult.value = {
            action: 'process',
            ...response,
            timestamp: new Date().toISOString()
        }
        status.value.queue = response.success ? 'success' : 'error'

    } catch (error) {
        queueResult.value = {
            action: 'process',
            success: false,
            error: error.message || 'Erreur traitement queue',
            timestamp: new Date().toISOString()
        }
        status.value.queue = 'error'
    } finally {
        isProcessingQueue.value = false
    }
}

// Helpers pour les statuts
const getStatusClass = (type) => {
    const statusValue = status.value[type]
    if (statusValue === 'success') return 'bg-green-100 border border-green-200'
    if (statusValue === 'error') return 'bg-red-100 border border-red-200'
    return 'bg-gray-100 border border-gray-200'
}

const getStatusText = (type) => {
    const statusValue = status.value[type]
    if (statusValue === 'success') return 'Fonctionnel'
    if (statusValue === 'error') return 'Erreur détectée'
    return 'Non testé'
}

// Métadonnées de la page
definePageMeta({
    layout: 'admin' // ou votre layout admin
})
</script>