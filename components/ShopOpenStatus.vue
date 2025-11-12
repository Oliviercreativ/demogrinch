<script setup>
import { ref, onMounted, computed } from 'vue'
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

const getStatus = computed(() => {
  if (!schedule.value) return { isOpen: false, closingSoon: false }

  const now = new Date()
  const currentDay = days[now.getDay() - 1]?.id
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const daySchedule = schedule.value[currentDay]
  if (!daySchedule?.isOpen) return { isOpen: false, closingSoon: false }

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const isWithinLastHour = (endTime) => {
    const end = timeToMinutes(endTime)
    return currentTime >= end - 60 && currentTime <= end
  }

  if (daySchedule.isSplit) {
    const morningStart = timeToMinutes(daySchedule.morning.start)
    const morningEnd = timeToMinutes(daySchedule.morning.end)
    const afternoonStart = timeToMinutes(daySchedule.afternoon.start)
    const afternoonEnd = timeToMinutes(daySchedule.afternoon.end)

    const isOpen = (currentTime >= morningStart && currentTime <= morningEnd) ||
                  (currentTime >= afternoonStart && currentTime <= afternoonEnd)
    
    const closingSoon = isWithinLastHour(daySchedule.morning.end) || 
                       isWithinLastHour(daySchedule.afternoon.end)

    return { isOpen, closingSoon }
  } else {
    const start = timeToMinutes(daySchedule.continuous.start)
    const end = timeToMinutes(daySchedule.continuous.end)
    const isOpen = currentTime >= start && currentTime <= end
    const closingSoon = isWithinLastHour(daySchedule.continuous.end)

    return { isOpen, closingSoon }
  }
})

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

    <div v-else-if="schedule" class="space-y-2 flex flex-col justify-start items-start">
      <div class="flex items-center justify-start gap-2">
        <span class="text-sm font-medium text-blue-800">Actuellement</span> 
        <span 
          class="px-3 py-1 rounded-full text-sm font-medium"
          :class="{
            'bg-green-100 text-green-800': getStatus.isOpen && !getStatus.closingSoon,
            'bg-yellow-100 text-yellow-800': getStatus.isOpen && getStatus.closingSoon,
            'bg-red-100 text-red-800': !getStatus.isOpen
          }"
        >
          {{ !getStatus.isOpen ? 'Fermé' : getStatus.closingSoon ? 'Ferme bientôt' : 'Ouvert' }}
        </span>
      </div>
      <div v-for="day in days" :key="day.id" class="flex justify-between items-center py-2 w-full">
        <span class="text-sm font-medium text-blue-800">{{ day.label }}</span>
        <span class="text-sm" :class="{
          'text-red-500 font-normal': !schedule[day.id]?.isOpen || formatSchedule(schedule[day.id]) === 'Fermé',
          'text-gray-900': schedule[day.id]?.isOpen && formatSchedule(schedule[day.id]) !== 'Fermé'
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