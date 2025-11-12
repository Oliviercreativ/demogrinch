<template>
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">🔔 Gestion des notifications</h3>

        <!-- Statut actuel -->
        <div class="mb-4 p-3 rounded-lg" :class="statusClass">
            <p class="font-medium">{{ statusText }}</p>
            <p class="text-sm opacity-90">{{ statusDetails }}</p>
        </div>

        <!-- Tokens actifs -->
        <div v-if="activeTokens.length > 0" class="mb-4">
            <h4 class="font-medium mb-2">Appareils connectés ({{ activeTokens.length }})</h4>
            <div class="space-y-2">
                <div v-for="token in activeTokens" :key="token.id"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div class="flex-1">
                        <p class="text-sm font-medium">
                            {{ getDeviceName(token.device_info) }}
                        </p>
                        <p class="text-xs text-gray-600">
                            Dernière activité: {{ formatDate(token.updated_at) }}
                        </p>
                    </div>
                    <button @click="deactivateToken(token.id)" class="text-red-600 hover:text-red-800 text-sm">
                        Désactiver
                    </button>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="space-y-2">
            <button v-if="!hasActiveNotifications" @click="enableNotifications" :disabled="isLoading"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {{ isLoading ? 'Activation...' : '🔔 Activer les notifications' }}
            </button>

            <button v-else @click="refreshToken" :disabled="isLoading"
                class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {{ isLoading ? 'Actualisation...' : '🔄 Actualiser le token' }}
            </button>

            <button v-if="hasActiveNotifications" @click="disableAllNotifications" :disabled="isLoading"
                class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50">
                🔕 Désactiver toutes les notifications
            </button>
        </div>
    </div>
</template>

<script setup>
const {
    requestPermission,
    saveTokenForUser,
    getUserActiveTokens,
    refreshUserToken
} = useFirebaseMessaging()

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const isLoading = ref(false)
const activeTokens = ref([])

const hasActiveNotifications = computed(() => activeTokens.value.length > 0)

const statusClass = computed(() => {
    if (hasActiveNotifications.value) {
        return 'bg-green-50 text-green-800 border border-green-200'
    } else {
        return 'bg-gray-50 text-gray-800 border border-gray-200'
    }
})

const statusText = computed(() => {
    if (hasActiveNotifications.value) {
        return '✅ Notifications activées'
    } else {
        return '🔕 Notifications désactivées'
    }
})

const statusDetails = computed(() => {
    if (hasActiveNotifications.value) {
        return `Connecté sur ${activeTokens.value.length} appareil(s)`
    } else {
        return 'Activez les notifications pour recevoir les alertes'
    }
})

onMounted(async () => {
    if (user.value) {
        await loadUserTokens()
    }
})

const loadUserTokens = async () => {
    if (!user.value) return

    try {
        activeTokens.value = await getUserActiveTokens(user.value.id)
    } catch (error) {
        console.error('Erreur chargement tokens:', error)
    }
}

const enableNotifications = async () => {
    if (!user.value) return

    isLoading.value = true

    try {
        const token = await requestPermission()
        if (token) {
            await saveTokenForUser(token, user.value.id)
            await loadUserTokens()
        }
    } catch (error) {
        console.error('Erreur activation notifications:', error)
    } finally {
        isLoading.value = false
    }
}

const refreshToken = async () => {
    if (!user.value) return

    isLoading.value = true

    try {
        await refreshUserToken(user.value.id)
        await loadUserTokens()
    } catch (error) {
        console.error('Erreur actualisation token:', error)
    } finally {
        isLoading.value = false
    }
}

const deactivateToken = async (tokenId) => {
    try {
        await supabase
            .from('user_fcm_tokens')
            .update({ active: false })
            .eq('id', tokenId)

        await loadUserTokens()
    } catch (error) {
        console.error('Erreur désactivation token:', error)
    }
}

const disableAllNotifications = async () => {
    if (!user.value) return

    try {
        await supabase
            .from('user_fcm_tokens')
            .update({ active: false })
            .eq('user_id', user.value.id)

        await loadUserTokens()
    } catch (error) {
        console.error('Erreur désactivation notifications:', error)
    }
}

const getDeviceName = (deviceInfo) => {
    if (!deviceInfo) return 'Appareil inconnu'

    const ua = deviceInfo.userAgent || ''

    if (ua.includes('iPhone')) return '📱 iPhone'
    if (ua.includes('iPad')) return '📱 iPad'
    if (ua.includes('Android')) return '📱 Android'
    if (ua.includes('Mac')) return '💻 Mac'
    if (ua.includes('Windows')) return '💻 Windows'

    return '🖥️ Navigateur'
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>
