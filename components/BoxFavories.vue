<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

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

const reloadReward = async (rewardId) => {
  const { data, error } = await supabase
    .from('reward')
    .select('*')
    .eq('id', rewardId)
    .eq('is_read', false)
    .single()

  if (error) {
    console.error('Erreur lors du rechargement de la récompense:', error)
  } else if (data) {
    const index = rewards.value.findIndex(r => r.id === rewardId)
    if (index !== -1) {
      rewards.value[index] = { ...data, boutique: boutiques.value[data.store_slug] }
    }
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
  if (!searchQuery.value) return uniqueRewards.value
  
  const searchLower = searchQuery.value.toLowerCase()
  return uniqueRewards.value.filter(reward => {
    const boutique = reward.boutique
    if (!boutique) return false
    
    return boutique.name_shop.toLowerCase().includes(searchLower) ||
    boutique.categories_shop.toLowerCase().includes(searchLower)
  })
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

onMounted(() => {
  if (user.value) {
    fetchRewards()
  } else {
    console.log('Utilisateur non connecté')
  }
})
</script>

<template>
  <div>
    <div class="pb-4">
      <div class="flex w-full rounded bg-white border border-gray-300">
        <input
          class="w-full border-none bg-white px-4 py-1 text-gray-700 outline-none focus:outline-none"
          v-model="searchQuery"
          type="search"
          name="search"
          placeholder="Rechercher une carte de fidélité..."
        />
        <button type="submit" class="m-2 rounded bg-blue-800 px-4 py-2 text-white">
          <svg class="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.966 56.966">
            <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
          </svg>
        </button>
      </div>
    </div>
    <div v-for="reward in filteredRewards" :key="reward.rewardSlug">
      <NuxtLink :to="`/reward/${reward.rewardSlug}`">
        <div :class="getRewardCardClass(reward)"> <!-- Ajout de la classe 'relative' -->
          <div class="w-full relative overflow-hidden">
            <img :src="reward.boutique?.photo_url" :alt="reward.boutique?.nom" class="absolute inset-0 w-full object-cover rounded-lg h-[150px] z-10" />
          </div>
          <div class="flex-auto px-5 py-3 items-center justify-start">
            <div class="flex flex-col">
              <p :class="getRewardTitleClass(reward)">{{ reward.boutique?.name_shop }}</p>
              <p :class="getRewardProgressClass(reward)">{{ reward.new_solde }} -> {{ reward.boutique?.limite }} points de fidéité</p>
              <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div :class="getProgressBarClass(reward)" :style="{ width: `${(reward.new_solde / reward.boutique?.limite) * 100}%` }"></div>
              </div>
              <p v-if="isOneVisitAway(reward)" :class="getRewardMessageClass(reward)">
                Plus qu'une visite pour obtenir votre récompense
              </p>
              <p v-if="isRewardWon(reward)" :class="getRewardMessageClass(reward)">
                Félicitations, c'est gagné
              </p>
              <p v-if="reward.is_used" :class="getRewardMessageClass(reward)">
                Récompense déjà utilisée
              </p>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
    <div v-if="filteredRewards.length === 0" class="text-center text-gray-500 mt-4">
      Aucune carte de fidélité trouvée
    </div>
  </div>
</template>