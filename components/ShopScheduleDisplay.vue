<!-- components/ShopScheduleDisplay.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  uid: {
    type: String,
    required: true
  }
})

const supabase = useSupabaseClient()
const schedule = ref(null)
const isLoading = ref(true)
const error = ref(null)

const days = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' }
]

const fetchSchedule = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('horaires')
      .select('*')
      .eq('boutique_uid', props.uid)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    schedule.value = data
  } catch (e) {
    console.error('Erreur lors du chargement des horaires:', e)
    error.value = "Impossible de charger les horaires"
  } finally {
    isLoading.value = false
  }
}

const formatSchedule = (daySchedule) => {
  if (!daySchedule || !daySchedule.isOpen) {
    return 'Fermé'
  }

  if (daySchedule.isSplit) {
    return `${daySchedule.morning.start} - ${daySchedule.morning.end}, ${daySchedule.afternoon.start} - ${daySchedule.afternoon.end}`
  }

  return `${daySchedule.continuous.start} - ${daySchedule.continuous.end}`
}

onMounted(() => {
  if (props.uid) {
    fetchSchedule()
  }
})
</script>

<template>
  <div class="w-full">
    <div class="flex justify-start items-center gap-5">
      <p class="text-lg uppercase font-semibold text-blue-800 dark:text-white">Horaires d'ouverture</p>
    </div>

    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-4">
      {{ error }}
    </div>

    <div v-else-if="schedule" class="space-y-2">
      <div v-for="day in days" :key="day.id" class="flex justify-between items-center py-2">
        <span class="text-sm font-medium text-zinc-800">{{ day.label }}</span>
        <span class="text-sm" :class="{
          'text-red-500 font-normal': !schedule[day.id]?.isOpen || formatSchedule(schedule[day.id]) === 'Fermé',
          'text-blue-800': schedule[day.id]?.isOpen && formatSchedule(schedule[day.id]) !== 'Fermé'
        }">
          {{ formatSchedule(schedule[day.id]) }}
        </span>
      </div>
    </div>

    <div v-else class="text-center py-4 text-gray-500">
      Aucun horaire disponible
    </div>
  </div>
</template>