<!-- components/HistoryReward.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useRoute } from '#imports'
import Loader from './Loader.vue';

const props = defineProps({
  allowedSlugs: {
    type: Array,
    default: null // null = admin (voir tout), Array = owner (filtrer par slugs)
  }
})

const route = useRoute()
const supabase = useSupabaseClient()
const rewards = ref([])
const isLoading = ref(true)

const fetchRewards = async () => {
  isLoading.value = true
  try {
    let query = supabase
      .from('reward')
      .select(`
        *,
        profiles:user_uid_reward (full_name)
      `)
      .eq('user_uid_reward', route.params.id)
      .eq('is_read', false)
      .order('hit_date', { ascending: false })
    
    // 🔒 RGPD: Si allowedSlugs est défini (owner), filtrer par boutiques autorisées
    if (props.allowedSlugs && props.allowedSlugs.length > 0) {
      query = query.in('store_slug', props.allowedSlugs)
    }
    // Si allowedSlugs = null (admin), on ne filtre pas
    
    const { data } = await query
    
    rewards.value = data || []
  } finally {
    isLoading.value = false
  }
}

// Exposer la méthode fetchRewards pour qu'elle puisse être appelée depuis le parent
defineExpose({
  fetchRewards
})

onMounted(fetchRewards)
</script>

<template>
<div class="mt-6 mb-6  px-4">
  <p class="text-lg uppercase text-blue-800 font-medium mb-4">Historique des scans</p>
  <div v-if="rewards.length > 0">
    <div v-if="isLoading"><Loader /></div>
    <div v-else class="space-y-4 rounded-lg shadow">
      <div v-for="reward in rewards" :key="reward.id" class="bg-white  px-4 py-2 ">
          <p class="text-blue-800 text-xs mt-1">
            {{ reward.solde }} -> {{ reward.new_solde }} points de fidélité chez {{ reward.store_slug }}
          </p>
        <p class="font-normal text-xs">
          {{ new Date(reward.hit_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          }) }}
        </p>
      </div>
    </div>
  </div>
  <div v-else class="text-center text-gray-500">
    Aucun historique de récompenses
  </div>
</div>
</template>