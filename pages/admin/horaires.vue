<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

definePageMeta({
    showHeader: false,
    showNavbar: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isLoading = ref(true)
const error = ref(null)
const success = ref(false)
const boutiqueUid = ref(null)

// Générer les horaires...
const timeSlots = ref([
    'Fermé',
    ...Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2)
        const minute = (i % 2) * 30
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    })
])


const days = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' }
]

const schedule = ref({
    monday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    },
    tuesday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    },
    wednesday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    },
    thursday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    },
    friday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    },
    saturday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    },
    sunday: {
        isOpen: false,
        isSplit: false,
        morning: { start: 'Fermé', end: 'Fermé' },
        afternoon: { start: 'Fermé', end: 'Fermé' },
        continuous: { start: 'Fermé', end: 'Fermé' }
    }
})

const fetchBoutiqueUid = async () => {
    try {
        if (!user.value) return

        const { data, error: boutiqueError } = await supabase
            .from('boutique')
            .select('uid')
            .eq('owner', user.value.id)
            .single()

        if (boutiqueError) throw boutiqueError

        if (data) {
            boutiqueUid.value = data.uid
            await fetchSchedule() // Charger les horaires une fois l'uid récupéré
        }
    } catch (e) {
        console.error('Erreur boutique:', e)
        error.value = "Erreur lors de la récupération des informations de la boutique"
    }
}

const fetchSchedule = async () => {
    if (!boutiqueUid.value) return

    try {
        const { data, error: fetchError } = await supabase
            .from('horaires')
            .select('*')
            .eq('boutique_uid', boutiqueUid.value)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError
        }

        if (data) {
            days.forEach(day => {
                if (data[day.id]) {
                    schedule.value[day.id] = {
                        ...schedule.value[day.id],
                        ...data[day.id]
                    }
                }
            })
        }
    } catch (e) {
        console.error('Erreur lors du chargement des horaires:', e)
    } finally {
        isLoading.value = false
    }
}

const saveSchedule = async () => {
    if (!boutiqueUid.value) return

    isLoading.value = true
    error.value = null
    success.value = false

    try {
        const scheduleData = {
            boutique_uid: boutiqueUid.value,
        }
        days.forEach(day => {
            scheduleData[day.id] = schedule.value[day.id]
        })

        const { data: existing } = await supabase
            .from('horaires')
            .select('id')
            .eq('boutique_uid', boutiqueUid.value)
            .single()

        if (existing) {
            // Mise à jour
            const { error: updateError } = await supabase
                .from('horaires')
                .update(scheduleData)
                .eq('boutique_uid', boutiqueUid.value)

            if (updateError) throw updateError
        } else {
            // Création
            const { error: insertError } = await supabase
                .from('horaires')
                .insert(scheduleData)

            if (insertError) throw insertError
        }

        success.value = true
    } catch (e) {
        error.value = "Erreur lors de l'enregistrement des horaires"
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    await fetchBoutiqueUid()
})
</script>

<template>
    <div class="max-w-4xl mx-auto p-4 pb-24">
        <h2 class="text-xl font-bold text-blue-800 mb-6">Horaires d'ouverture</h2>

        <div class="space-y-4">
            <div v-for="day in days" :key="day.id" class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <label class="inline-flex items-center">
                            <input type="checkbox" v-model="schedule[day.id].isOpen"
                                class="rounded border-gray-300 text-blue-800 focus:ring-blue-500">
                            <span class="ml-2 font-medium">{{ day.label }}</span>
                        </label>
                        <label v-if="schedule[day.id].isOpen" class="inline-flex items-center">
                            <input type="checkbox" v-model="schedule[day.id].isSplit"
                                class="rounded border-gray-300 text-blue-800 focus:ring-blue-500">
                            <span class="ml-2 text-sm">Coupure déjeuner</span>
                        </label>
                    </div>
                </div>

                <div v-if="schedule[day.id].isOpen" class="space-y-4">
                    <template v-if="schedule[day.id].isSplit">
                        <div class="flex items-center space-x-4">
                            <span class="text-sm font-medium w-24">Matin :</span>
                            <select v-model="schedule[day.id].morning.start"
                                class="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
                            </select>
                            <span class="text-sm">à</span>
                            <select v-model="schedule[day.id].morning.end"
                                class="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
                            </select>
                        </div>

                        <div class="flex items-center space-x-4">
                            <span class="text-sm font-medium w-24">Après-midi :</span>
                            <select v-model="schedule[day.id].afternoon.start"
                                class="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
                            </select>
                            <span class="text-sm">à</span>
                            <select v-model="schedule[day.id].afternoon.end"
                                class="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
                            </select>
                        </div>
                    </template>

                    <template v-else>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm font-medium w-24">Horaires :</span>
                            <select v-model="schedule[day.id].continuous.start"
                                class="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
                            </select>
                            <span class="text-sm">à</span>
                            <select v-model="schedule[day.id].continuous.end"
                                class="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
                                <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
                            </select>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <div class="mt-6 flex justify-end">
            <button @click="saveSchedule" :disabled="isLoading"
                class="bg-blue-800 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer les horaires' }}
            </button>
        </div>

        
        <div v-if="success" class="mt-4 p-4 bg-green-100 text-green-700 rounded-lg">
            Horaires enregistrés avec succès !
        </div>
        <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {{ error }}
        </div>
    </div>
    <div v-if="!boutiqueUid" class="text-center text-red-600 py-4">
        Vous devez être propriétaire d'une boutique pour gérer les horaires
    </div>
    <div v-else-if="isLoading" class="flex justify-center items-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
    </div>
</template>