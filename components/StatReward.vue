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

    // Calcul du total des points par boutique
    const storePointsMap = new Map()
    let totalPoints = 0

    rewards.forEach(reward => {
      // Pour chaque récompense, on ajoute les points au total
      totalPoints += reward.new_solde

      // On garde le dernier solde pour chaque boutique
      if (!storePointsMap.has(reward.store_slug)) {
        storePointsMap.set(reward.store_slug, reward.new_solde)
      }
    })

    // Mise à jour des statistiques
    totalLoyaltyPoints.value = totalPoints
    uniqueStores.value = storePointsMap.size
    totalScans.value = rewards.length
    lastScanDate.value = rewards.length > 0 ? rewards[0].hit_date : null

    console.log({
      totalPoints,
      uniqueStores: uniqueStores.value,
      totalScans: totalScans.value
    })

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
  <div class="overflow-hidden sm:rounded-lg pt-6">
    <div v-if="isLoading" class="text-center">
      <p class="text-gray-500">
        <Loader />
      </p>
    </div>
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    <div v-else ref="statsContainer" class="flex gap-6 flex-col justify-center align-top">
      <div class="flex w-full mx-auto rounded-lg gap-2">
        <div class="flex-shrink-0 w-[49%]">
          <NuxtLink to="/cartes-de-fidelite">
            <div class="border bg-white hover:bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award stroke-blue-800"
                width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
                <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
                <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
              </svg>
              <p class="text-xl font-bold text-blue-800">{{ totalScans }}</p>
              <p class="text-xs text-blue-800">Points de fidélité</p>
            </div>
          </NuxtLink>
        </div>
        <div class="flex-shrink-0 w-[49%]">
          <NuxtLink to="/cartes-de-fidelite">
            <div class="border bg-white hover:bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gift-card stroke-blue-800"
                width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
                <path d="M7 16l3 -3l3 3" />
                <path
                  d="M8 13c-.789 0 -2 -.672 -2 -1.5s.711 -1.5 1.5 -1.5c1.128 -.02 2.077 1.17 2.5 3c.423 -1.83 1.372 -3.02 2.5 -3c.789 0 1.5 .672 1.5 1.5s-1.211 1.5 -2 1.5h-4z" />
              </svg>
              <p class="text-xl font-bold text-blue-800">{{ uniqueStores }}</p>
              <p class="text-xs text-blue-800">Cartes de fidélité</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>