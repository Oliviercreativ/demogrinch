<template>
  <div class="scan-count">
    <p class="text-sm text-gray-600"><span class="font-bold">{{ count }}</span> scans au total</p>
    <p class="text-sm text-gray-600"><span class="font-bold">{{ recentCount }}</span> scans sur les 30 derniers jours</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  boutiqueId: {
    type: String,
    required: true
  }
})

const supabase = useSupabaseClient()
const count = ref(0)
const recentCount = ref(0)

onMounted(async () => {
  // Récupérer le nombre total de scans
  const { count: totalCount, error: totalError } = await supabase
    .from('scans')
    .select('count', { count: 'exact' })
    .eq('boutique_id', props.boutiqueId)

  if (totalError) {
    console.error('Erreur lors de la récupération du nombre total de scans:', totalError)
  } else {
    count.value = totalCount
  }
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: recentTotal, error: recentError } = await supabase
    .from('scans')
    .select('count', { count: 'exact' })
    .eq('boutique_id', props.boutiqueId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (recentError) {
    console.error('Erreur lors de la récupération des scans récents:', recentError)
  } else {
    recentCount.value = recentTotal
  }
})
</script>