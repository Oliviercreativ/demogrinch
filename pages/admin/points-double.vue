<!-- pages/admin/points-double.vue -->
<template>
    <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h1 class="text-2xl font-bold text-gray-800 mb-8 text-center">Points Compte Double</h1>

            <!-- Status actuel -->
            <div class="mb-8">
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-semibold text-gray-700">Status Actuel</h2>
                            <p class="text-sm text-gray-600 mt-1">
                                Système de points compte double
                            </p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div :class="isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                                class="px-3 py-1 rounded-full text-sm font-medium">
                                {{ isActive ? 'ACTIF' : 'INACTIF' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toggle d'activation -->
            <div class="mb-8">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Activation</h3>

                    <div class="flex items-center justify-center">
                        <label class="flex items-center cursor-pointer">
                            <input v-model="isActive" type="checkbox" class="sr-only" @change="toggleDoublePoints"
                                :disabled="loading" />
                            <div class="relative">
                                <div :class="isActive ? 'bg-green-600' : 'bg-gray-300'"
                                    class="block w-16 h-8 rounded-full transition-colors duration-300 ease-in-out">
                                </div>
                                <div :class="isActive ? 'translate-x-8' : 'translate-x-0'"
                                    class="absolute left-0 top-0 bg-white w-8 h-8 rounded-full transition-transform duration-300 ease-in-out shadow-md border border-gray-200">
                                </div>
                            </div>
                            <span class="ml-4 text-lg font-medium text-gray-700">
                                {{ isActive ? 'Points x2 activés' : 'Points x2 désactivés' }}
                            </span>
                        </label>
                    </div>

                    <p class="text-sm text-gray-500 text-center mt-4">
                        {{ isActive
                            ? 'Tous les scans rapportent maintenant 2 points au lieu de 1'
                            : 'Les scans rapportent 1 point normal'
                        }}
                    </p>
                </div>
            </div>

            <!-- Loading indicator -->
            <div v-if="loading" class="text-center">
                <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    Mise à jour en cours...
                </div>
            </div>

            <!-- Informations système -->
            <div v-if="settings" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-gray-800 mb-2">Dernière modification</h3>
                <p class="text-sm text-gray-600">
                    {{ settings.updated_at ? formatDate(settings.updated_at) : 'Jamais modifié' }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Middleware d'authentification admin
definePageMeta({
    middleware: 'auth',
    showHeader: false,
})

// Variables réactives
const supabase = useSupabaseClient()
const loading = ref(false)
const isActive = ref(false)
const settings = ref(null)

// Méthodes
const fetchSettings = async () => {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        if (data) {
            settings.value = data
            isActive.value = data.double_points_active || false
        } else {
            // Créer un enregistrement par défaut si il n'existe pas
            await createDefaultSettings()
        }
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        // En cas d'erreur, créer les paramètres par défaut
        await createDefaultSettings()
    }
}

const createDefaultSettings = async () => {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .insert([{
                double_points_active: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) throw error

        settings.value = data
        isActive.value = false
    } catch (error) {
        console.error('Erreur lors de la création des paramètres:', error)
    }
}

const toggleDoublePoints = async () => {
    loading.value = true

    try {
        const newValue = isActive.value
        const settingsData = {
            double_points_active: newValue,
            updated_at: new Date().toISOString()
        }

        let result
        if (settings.value?.id) {
            // Mise à jour
            result = await supabase
                .from('admin_settings')
                .update(settingsData)
                .eq('id', settings.value.id)
                .select()
                .single()
        } else {
            // Création (cas de backup)
            settingsData.created_at = new Date().toISOString()
            result = await supabase
                .from('admin_settings')
                .insert([settingsData])
                .select()
                .single()
        }

        if (result.error) throw result.error

        settings.value = result.data

        // Notification de succès
        console.log(`Points double ${newValue ? 'activés' : 'désactivés'} avec succès !`)

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error)
        // Rollback en cas d'erreur
        isActive.value = !isActive.value
        alert('Erreur lors de la mise à jour des paramètres')
    } finally {
        loading.value = false
    }
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Lifecycle
onMounted(async () => {
    await fetchSettings()
})
</script>

<style scoped>
.container {
    max-width: 600px;
}
</style>