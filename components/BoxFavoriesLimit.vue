<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

// 🎯 Props pour contrôler le nombre de cartes affichées
const props = defineProps({
  limit: {
    type: Number,
    default: null, // null = toutes les cartes
    validator: (value) => value === null || value > 0
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  showEmptyMessage: {
    type: Boolean,
    default: true
  }
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const rewards = ref([])
const boutiques = ref({})
const searchQuery = ref('')

const fetchRewards = async () => {
  if (!user.value || !user.value.id) {
    console.error('Utilisateur non connecté ou ID non disponible')
    return
  }

  const { data: rewardsData, error: rewardsError } = await supabase
    .from('reward')
    .select('*')
    .eq('user_uid_reward', user.value.id)
    .eq('is_read', false)
    .order('hit_date', { ascending: false })

  if (rewardsError) {
    console.error('Erreur lors de la récupération des récompenses:', rewardsError)
  } else {
    rewards.value = rewardsData || []
    await fetchBoutiqueDetails()
  }
}

const fetchBoutiqueDetails = async () => {
  const boutiqueSlugs = [...new Set(rewards.value.map(reward => reward.store_slug))]

  const { data: boutiquesData, error: boutiquesError } = await supabase
    .from('boutique')
    .select('*')
    .in('slug', boutiqueSlugs)

  if (boutiquesError) {
    console.error('Erreur lors de la récupération des informations des boutiques:', boutiquesError)
  } else {
    boutiques.value = Object.fromEntries(boutiquesData.map(boutique => [boutique.slug, boutique]))
  }
}

const uniqueRewards = computed(() => {
  const uniqueMap = new Map()
  rewards.value.forEach(reward => {
    if (!uniqueMap.has(reward.rewardSlug) || reward.hit_date > uniqueMap.get(reward.rewardSlug).hit_date) {
      uniqueMap.set(reward.rewardSlug, {
        ...reward,
        boutique: boutiques.value[reward.store_slug]
      })
    }
  })
  return Array.from(uniqueMap.values())
})

const filteredRewards = computed(() => {
  let result = uniqueRewards.value

  // Appliquer la recherche si activée
  if (props.showSearch && searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase()
    result = result.filter(reward => {
      const boutique = reward.boutique
      if (!boutique) return false

      return boutique.name_shop.toLowerCase().includes(searchLower) ||
        boutique.categories_shop?.toLowerCase().includes(searchLower)
    })
  }

  // Appliquer la limite si spécifiée
  if (props.limit !== null && props.limit > 0) {
    result = result.slice(0, props.limit)
  }

  return result
})

const getRewardCardClass = (reward) => {
  if (isOneVisitAway(reward)) return "grid grid-cols-2 h-[150px] mb-4 bg-white rounded-lg border border-blue-800 shadow"
  if (isRewardWon(reward)) return "grid grid-cols-2 h-[150px] mb-4 bg-blue-800 rounded-lg shadow"
  return "grid grid-cols-2 h-[150px] mb-4 bg-white rounded-lg shadow"
}

const getRewardTitleClass = (reward) => {
  return isRewardWon(reward) ? "flex-auto text-lg text-white font-semibold" : "flex-auto text-lg text-blue-800 font-semibold"
}

const getRewardProgressClass = (reward) => {
  return isRewardWon(reward) ? "text-gray-100 text-xs" : "text-gray-500 text-xs"
}

const getProgressBarClass = (reward) => {
  return isRewardWon(reward) ? "bg-white h-2.5 rounded-full" : "bg-blue-800 h-2.5 rounded-full"
}

const getRewardMessageClass = (reward) => {
  return isRewardWon(reward) ? "text-gray-100 text-xs mt-1" : "text-gray-500 text-xs mt-1"
}

const isOneVisitAway = (reward) => {
  return reward.boutique && (reward.boutique.limite - reward.new_solde === 1)
}

const isRewardWon = (reward) => {
  return reward.boutique && (reward.new_solde >= reward.boutique.limite) && !reward.is_used
}

const getLogoContainerClass = (reward) => {
  if (isRewardWon(reward)) {
    return 'bg-blue-800 border-2 border-blue-800'
  }
  if (isOneVisitAway(reward)) {
    return 'bg-white border-2 border-blue-800'
  }
  return 'bg-white border-2 border-gray-200'
}

onMounted(() => {
  if (user.value) {
    fetchRewards()
  } else {
    console.log('Utilisateur non connecté')
  }
})
</script>

<template>
  <div v-if="filteredRewards.length > 0">
    <!-- Listing vertical des cartes de fidélité -->
    <div class="relative py-6">
      <p class="text-lg uppercase font-semibold text-blue-800 text-left mb-4">Vos cartes de fidélité</p>
      <!-- Liste verticale -->
      <div class="flex flex-col gap-3">
        <!-- Carte pour chaque boutique -->
        <NuxtLink
          v-for="reward in filteredRewards"
          :key="reward.rewardSlug"
          :to="`/reward/${reward.rewardSlug}`"
          class="block"
        >
          <div
            class="bg-white rounded-lg p-4"
            :class="isRewardWon(reward) ? 'bg-white' : isOneVisitAway(reward) ? 'border' : 'border'"
          >
            <div class="flex items-center gap-4">
              <!-- Logo de la boutique -->
              <div
                class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                :class="getLogoContainerClass(reward)"
              >
                <img
                  v-if="reward.boutique?.logo_shop"
                  :src="reward.boutique.logo_shop"
                  :alt="reward.boutique.name_shop"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gray-200 flex items-center justify-center"
                >
                  <span class="text-2xl">🏪</span>
                </div>
              </div>

              <!-- Informations de la carte -->
              <div class="flex-1 min-w-0">
                <h3 
                  class="font-semibold text-base mb-1 truncate"
                  :class="isRewardWon(reward) ? 'text-blue-800' : 'text-blue-800'"
                >
                  {{ reward.boutique?.name_shop }}
                </h3>
                <!-- Barre de progression -->
                <div class="w-full">
                  <div class="flex justify-between items-center mb-1">
                    <span 
                      class="text-xs font-medium"
                      :class="isRewardWon(reward) ? 'text-blue-800' : 'text-gray-600'"
                    >
                      {{ reward.new_solde || 0 }} / {{ reward.boutique?.limite || 0 }} points
                    </span>
                    <span 
                      v-if="isRewardWon(reward)"
                      class="text-xs font-semibold text-blue-800 bg-white px-2 py-1 rounded"
                    >
                      Récompense disponible !
                    </span>
                    <span 
                      v-else-if="isOneVisitAway(reward)"
                      class="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded"
                    >
                      Plus qu'une visite !
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="isRewardWon(reward) ? 'bg-blue-800' : 'bg-blue-600'"
                      :style="{ width: `${Math.min(((reward.new_solde || 0) / (reward.boutique?.limite || 1)) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Flèche de navigation -->
              <div class="flex-shrink-0">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="icon icon-tabler icon-tabler-chevron-right"
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  stroke-width="2" 
                  stroke="currentColor" 
                  fill="none" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  :class="isRewardWon(reward) ? 'text-blue-800' : 'text-gray-400'"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

