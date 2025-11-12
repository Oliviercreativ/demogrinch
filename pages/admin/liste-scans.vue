<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue';

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const rewards = ref([])
const isLoading = ref(true)


definePageMeta({
  showHeader: false,
  showNavbar: false
})

const fetchRewards = async () => {
 isLoading.value = true
 try {
   const { data } = await supabase
     .from('reward')
     .select(`
       *,
       profiles:user_uid_reward (full_name)
     `)
     .order('hit_date', { ascending: false })
   
   rewards.value = data
 } finally {
   isLoading.value = false
 }
}
onMounted(fetchRewards)
onMounted(async () => {
  if (user.value) {
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)

    if (boutiques && boutiques.length > 0) {
      isOwner.value = true
      ownedBoutiques.value = boutiques

      await Promise.all(ownedBoutiques.value.map(fetchBoutiqueData))
    }
  }
  isLoading.value = false
})
</script>

<template>
 <div class="p-4 pb-24">
   <div v-if="isLoading"><Loader /></div>
   <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</div>
   <div v-else class="grid gap-4">
     <div v-for="reward in rewards" :key="reward.id" class="p-4 border rounded">
      <NuxtLink :to="`/profile/${reward.user_uid_reward}`">
        <p class="font-medium text-blue-800">{{ reward.profiles?.full_name }}</p>
        <p class="text-sm">{{ reward.new_solde }} points chez {{ reward.store_slug }}</p>
        <p class="text-sm">Date : 
          {{ new Date(reward.hit_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          }) }}
        </p>
      </NuxtLink>
     </div>
   </div>
 </div>
</template>