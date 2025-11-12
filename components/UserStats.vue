<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useSwipe } from '@vueuse/core'
import Loader from './Loader.vue'
import ShareButton from '@/components/ShareButton'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const totalLoyaltyPoints = ref(0)
const uniqueStores = ref(0)
const totalRewards = ref(0)
const totalScans = ref(0)
const lastScanDate = ref(null)
const isLoading = ref(true)
const error = ref(null)

const statsContainer = ref(null)

const { isSwiping, direction } = useSwipe(statsContainer, {
  onSwipe(e) {
    if (direction.value === 'left') {
      statsContainer.value.scrollLeft += 100
    } else if (direction.value === 'right') {
      statsContainer.value.scrollLeft -= 100
    }
  }
})

const fetchUserStats = async () => {
  if (!user.value) return

  try {
    const { data: rewards, error: rewardsError } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', user.value.id)
      .eq('is_read', false)
      .order('hit_date', { ascending: false })

    if (rewardsError) throw rewardsError

    const storePointsMap = new Map()
    rewards.forEach(reward => {
      if (!storePointsMap.has(reward.store_slug) || reward.new_solde > storePointsMap.get(reward.store_slug)) {
        storePointsMap.set(reward.store_slug, reward.new_solde)
      }
    })

    totalLoyaltyPoints.value = Array.from(storePointsMap.values()).reduce((sum, points) => sum + points, 0)
    uniqueStores.value = storePointsMap.size
    totalRewards.value = rewards.length
    totalScans.value = rewards.length
    lastScanDate.value = rewards.length > 0 ? rewards[0].hit_date : null

  } catch (e) {
    console.error("Erreur lors de la récupération des statistiques:", e)
    error.value = "Impossible de charger les statistiques"
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUserStats)
</script>

<template>
  <div class="overflow-hidden sm:rounded-lg">
    <div v-if="isLoading" class="text-center">
      <p class="text-gray-500"><Loader /></p>
    </div>
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    <div v-else ref="statsContainer" class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
      <div class="flex-shrink-0 w-[45%] p-2 snap-center">
        <NuxtLink to="/cartes-de-fidelite">
          <div class="bg-blue-100 rounded-lg p-4 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award stroke-blue-800" width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
              <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
              <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
            </svg>
            <p class="text-xl font-bold text-blue-800">{{ totalRewards }}</p>
            <p class="text-xs text-blue-600">Nombre de scans</p>
          </div>
        </NuxtLink>
      </div>
      <div class="flex-shrink-0 w-[45%] p-2 snap-center">
        <NuxtLink to="/boutiques">
          <div class="bg-green-100 rounded-lg p-4 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gift-card stroke-green-800" width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
              <path d="M7 16l3 -3l3 3" />
              <path d="M8 13c-.789 0 -2 -.672 -2 -1.5s.711 -1.5 1.5 -1.5c1.128 -.02 2.077 1.17 2.5 3c.423 -1.83 1.372 -3.02 2.5 -3c.789 0 1.5 .672 1.5 1.5s-1.211 1.5 -2 1.5h-4z" />
            </svg>
            <p class="text-xl font-bold text-green-800">{{ uniqueStores }}</p>
            <p class="text-xs text-green-600">Cartes de fidélité</p>
          </div>
        </NuxtLink>
      </div>
      <div class="flex-shrink-0 w-[45%] p-2 snap-center">
        <NuxtLink to="/faq">
          <div class="bg-indigo-100 rounded-lg p-4 flex flex-col items-center justify-center h-full gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-help-hexagon stroke-indigo-800" width="36" height="36" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M19.875 6.27c.7 .398 1.13 1.143 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z" />
              <path d="M12 16v.01" />
              <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
            </svg>
            <p class="text-xs text-indigo-600 text-center text-balance font-semibold">Comment ça marche ?</p>
          </div>
        </NuxtLink>
      </div>
      <div class="flex-shrink-0 w-[45%] p-2 snap-center">
        <div class="bg-orange-100 rounded-lg p-4 flex flex-col items-center justify-center h-full gap-2">
            <ShareButton />
        </div>
      </div>
      <div class="flex-shrink-0 w-[45%] p-2 snap-center">
        <NuxtLink to="/cartes-de-fidelite">
          <div class="bg-purple-100 rounded-lg p-4 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-scan stroke-purple-800" width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 7v-1a2 2 0 0 1 2 -2h2" />
              <path d="M4 17v1a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v1" />
              <path d="M16 20h2a2 2 0 0 0 2 -2v-1" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <p class="text-xl font-bold text-purple-800">{{ totalScans }}</p>
            <p class="text-xs text-purple-600">Total des scans</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>