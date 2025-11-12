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
      <p class="text-gray-500">
        <Loader />
      </p>
    </div>
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    <div v-else ref="statsContainer" class="flex gap-6 flex-col justify-center align-top">
      <div class="flex w-full mx-auto rounded-lg shadow gap-2">
        <div class="flex-shrink-0 w-[49%] p-2 border bg-white hover:bg-blue-50 rounded-lg">
          <NuxtLink to="/faq">
            <div class="rounded-lg p-4 flex flex-col items-center justify-center h-full gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-help-hexagon stroke-blue-800"
                width="36" height="36" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path
                  d="M19.875 6.27c.7 .398 1.13 1.143 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z" />
                <path d="M12 16v.01" />
                <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
              </svg>
              <p class="text-xs text-blue-800 text-center text-balance font-semibold">Comment ça marche ?</p>
            </div>
          </NuxtLink>
        </div>
        <div class="flex-shrink-0 w-[49%] p-2 border bg-white hover:bg-blue-50 rounded-lg">
          <div class="rounded-lg p-4 flex flex-col items-center justify-center h-full gap-2">
            <ShareButton />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>