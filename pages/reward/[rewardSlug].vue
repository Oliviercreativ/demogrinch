<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isAuthenticated = ref(false)
const isAuthorized = ref(false)
const reward = ref(null)
const shop = ref(null)
const isLoading = ref(true)
const error = ref(null)
const rewardHistory = ref([])

definePageMeta({
  showHeader: false
})

const redirectToLogin = () => {
  router.push('/login')
}

const { checkProfile } = useProfileCheck()
onMounted(async () => {
  await checkProfile()
})

const checkAuthentication = () => {
  isAuthenticated.value = !!user.value
  if (isAuthenticated.value) {
    fetchRewardAndShop()
  } else {
    isLoading.value = false
  }
}

const fetchRewardAndShop = async () => {
  const rewardSlug = route.params.rewardSlug

  try {
    const { data: rewardData, error: rewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('rewardSlug', rewardSlug)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single()

    if (rewardError) {
      console.error('Reward error:')
      throw rewardError
    }

    reward.value = rewardData
    isAuthorized.value = reward.value.user_uid_reward === user.value.id

    if (!isAuthorized.value) {
      throw new Error("Vous n'êtes pas autorisé à accéder à cette récompense.")
    }

    if (reward.value && reward.value.store_slug) {
      const { data: shopData, error: shopError } = await supabase
        .from('boutique')
        .select('*')
        .eq('slug', reward.value.store_slug)
        .single()

      if (shopError) {
        console.error('Shop error:', shopError)
        throw shopError
      }

      shop.value = shopData
    }

    await fetchRewardHistory()
  } catch (e) {
    console.error('Error in fetchRewardAndShop:', e)
    error.value = e.message || "Une erreur s'est produite lors de la récupération des données."
  } finally {
    isLoading.value = false
  }
}

const fetchRewardHistory = async () => {
  if (!user.value || !reward.value) return

  const { data, error } = await supabase
    .from('reward')
    .select('*')
    .eq('user_uid_reward', user.value.id)
    .eq('store_slug', reward.value.store_slug)
    .eq('is_read', false)
    .order('hit_date', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération de l\'historique des récompenses:', error)
  } else {
    rewardHistory.value = data
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Intl.DateTimeFormat('fr-FR', options).format(date)
}

onMounted(() => {
  checkAuthentication()
})

watch(user, () => {
  checkAuthentication()
})

const progressPercentage = computed(() => {
  if (reward.value && shop.value) {
    return Math.min((reward.value.new_solde / shop.value.limite) * 100, 100)
  }
  return 0
})

const isRewardCompleted = computed(() => {
  return reward.value && shop.value && reward.value.new_solde >= shop.value.limite
})

const encouragementMessage = computed(() => {
  if (!reward.value || !shop.value) return ''

  const remaining = Math.max(shop.value.limite - reward.value.new_solde, 0)
  const percentage = progressPercentage.value

  if (percentage === 100) {
    return `Félicitations ! Profitez de votre avantage`
  } else if (percentage >= 90) {
    return `Encore un achat pour profiter de votre avantage.`
  } else if (percentage >= 75) {
    return `Vous y êtes presque !`
  } else if (percentage >= 50) {
    return `Vous avez dépassé la moitié !`
  } else {
    return `C'est parti ! Chaque achat vous rapproche de votre avantage.`
  }
})
</script>

<template>
  <div class="">
    <div v-if="!isLoading">
      <div v-if="isAuthenticated">
        <div v-if="isAuthorized">
          <div v-if="shop">
            <div class="flex flex-col justify-center items-center">
              <div class="w-full rounded-lg relative">
                <figure>
                  <img :src="shop.photo_url" :alt="shop.name_shop" class="h-[350px] object-cover w-full rounded-t-lg">
                </figure>
                <div class="pb-24 p-4 mx-auto max-w-2xl">
                  <div class="flex flex-col items-start justify-start gap-6">
                    <div class="rounded-lg w-30 bg-white z-10 -mt-20 p-2">
                      <figure>
                        <img :src="shop.logo_shop" :alt="shop.name_shop" class="bg-white object-contain w-24 h-24 rounded-lg">
                      </figure>
                    </div>
                    <div class="w-full">
                      <div>
                        <NuxtLink :to="`/shop/${shop.slug}`">
                          <h1 class="text-2xl font-bold text-blue-800">{{ shop.name_shop }}</h1>
                          <p class="text-gray-500">{{ shop.address_shop }}</p>
                        </NuxtLink>
                      </div>
                    </div>

                    <div v-if="isRewardCompleted" class="px-1 w-full">
                      <div class="w-full bg-white rounded-lg">
                        <div class="p-4">
                          <div v-if="reward.is_used" class="flex justify-start items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon w-10 stroke-blue-800 icon-tabler icon-tabler-circle-check" width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                              <path d="M9 12l2 2l4 -4" />
                            </svg>
                            <div class="">
                              <p class="text-sm text-gray-700"><span class="font-bold">{{ shop.lot }}</span></p>
                              <p class="text-sm text-blue-800 mt-1">Récompense utilisée le {{ formatDate(reward.hit_date) }}</p>
                            </div>
                          </div>
                          <div v-else class="flex justify-start items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon w-10 stroke-orange-600 icon-tabler icon-tabler-circle-check" width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                              <path d="M9 12l2 2l4 -4" />
                            </svg>
                            <div class="">
                              <p class="text-sm text-gray-700"><span class="font-bold">{{ shop.lot }}</span></p>
                              <p class="text-sm text-orange-600 mt-1">Récompense non utilisée</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>


                    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 py-3 rounded relative" role="alert">
                      <strong class="font-bold">Erreur :</strong>
                      <span class="block sm:inline">{{ error }}</span>
                    </div>
                    <div v-else-if="!reward" class="text-center text-gray-600">
                      Aucun avantage trouvé pour cette boutique.
                    </div>
                    
                    <div v-else class="w-full">
                      <ProgressBar 
                        :is-loading="isLoading"
                        :error="error"
                        :reward="reward"
                        :shop="shop"
                        :format-date="formatDate"
                      >
                        <template #loader>
                        </template>
                        <template #no-reward>
                        </template>
                      </ProgressBar>
                    </div>

                    <div v-if="rewardHistory.length > 0" class="w-full mt-6">
                      <h3 class="text-md font-semibold text-blue-800 mb-2">Historique des récompenses</h3>
                      <div class="w-full bg-white rounded-lg" >
                        <ul class="divide-y divide-gray-200">
                          <li v-for="historyItem in rewardHistory" :key="historyItem.id" class="p-4">
                            <div class="flex justify-between items-center">
                              <div>
                                <p class="text-sm font-medium text-gray-900">
                                  {{ formatDate(historyItem.hit_date) }}
                                </p>
                                <p class="text-sm text-gray-500">
                                  {{ historyItem.solde }} -> {{ historyItem.new_solde }} points de fidélité
                                </p>
                              </div>
                              <div v-if="historyItem.new_solde >= shop.limite" class="flex items-center">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Gagné
                                </span>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-600 p-4">
            Impossible de charger les informations de la boutique...
          </div>
        </div>
        <div v-else class="text-center text-gray-600 p-4">
          <div v-if="reward" class="debug-info">
            <pre>{{ JSON.stringify(reward, null, 2) }}</pre>
          </div>
          Vous n'êtes pas autorisé à accéder à cette récompense.
        </div>
      </div>
      <div v-else class="text-center text-gray-600 p-4">
        <p>Vous devez être connecté pour accéder à cette page.</p>
        <button @click="redirectToLogin" class="bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 rounded mt-4">
          Se connecter
        </button>
      </div>
    </div>
    <div v-else class="flex justify-center items-center h-screen">
      <Loader />
    </div>
  </div>
</template>