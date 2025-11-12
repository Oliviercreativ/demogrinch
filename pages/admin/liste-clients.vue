<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue'
import ScannedUsersList from '@/components/ScannedUsersList.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const isLoading = ref(true)
const ownedBoutiques = ref([])

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

async function fetchBoutiqueData(boutique) {
  const [rewardCountResult, rewardsResult] = await Promise.all([
    supabase
      .from('reward')
      .select('count', { count: 'exact' })
      .eq('store_slug', boutique.slug),
    supabase
      .from('reward')
      .select('user_uid_reward')
      .eq('store_slug', boutique.slug)
  ])

  if (rewardCountResult.error) {
    console.error('Erreur lors du comptage des récompenses:', rewardCountResult.error)
  }

  if (rewardsResult.error) {
    console.error('Erreur lors de la récupération des récompenses:', rewardsResult.error)
  } else {
    const uniqueUserIds = new Set(rewardsResult.data.map(reward => reward.user_uid_reward))
    boutique.uniqueUserCount = uniqueUserIds.size
  }

  boutique.rewardCount = rewardCountResult.count
}

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
  <div>
    <div v-if="isLoading"><Loader /></div>
    <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</div>
    <div v-else>
      <div class="pt-8 pb-24 px-4 mx-auto max-w-2xl">  
        <p class="text-lg uppercase font-semibold text-blue-800 text-center pb-10">mes clients</p>
        <div class="flex flex-col justify-center items-start w-full">
          <ScannedUsersList />
        </div>
      </div>
    </div>
  </div>
</template>