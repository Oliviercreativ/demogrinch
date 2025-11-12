<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'

definePageMeta({
  showHeader: false
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()
const { checkProfile } = useProfileCheck()

const isLoading = ref(true)
const error = ref(null)
const rewards = ref([])
const boutiques = ref({})
const userManagedBoutiques = ref([]) 

const processedRewards = computed(() => {
  return rewards.value.map(reward => ({
    ...reward,
    boutiqueName: boutiques.value[reward.store_slug]?.name_shop,
    userName: reward.profiles?.full_name || 'Utilisateur inconnu',
    isManager: userManagedBoutiques.value.includes(reward.store_slug),
    pendingReward: reward.new_solde >= (boutiques.value[reward.store_slug]?.limite || Infinity) && !reward.is_used,
    lot: boutiques.value[reward.store_slug]?.lot
  }))
})

const fetchRewardsAndBoutiques = async () => {
  if (!user.value) return

  try {
    // Récupérer les boutiques gérées par l'utilisateur
    const { data: managedBoutiques, error: managedError } = await supabase
      .from('boutique')
      .select('slug, limite')
      .eq('manager_id', user.value.id)

    if (managedError) throw managedError
    userManagedBoutiques.value = managedBoutiques.map(b => b.slug)

    // Si l'utilisateur est manager
    if (userManagedBoutiques.value.length > 0) {
      const { data: allBoutiques, error: boutiquesError } = await supabase
        .from('boutique')
        .select('*')

      if (boutiquesError) throw boutiquesError
      boutiques.value = Object.fromEntries(
        allBoutiques.map(boutique => [boutique.slug, boutique])
      )

      // Récupérer toutes les récompenses complètes (validées ou non)
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('reward')
        .select(`
          *,
          profiles:user_uid_reward (id, full_name)
        `)
        .in('store_slug', userManagedBoutiques.value)
        .eq('is_read', false)
        .order('hit_date', { ascending: false })

      if (rewardsError) throw rewardsError

      // Filtrer pour ne garder que les récompenses qui ont atteint la limite
      rewards.value = rewardsData.filter(reward => 
        reward.new_solde >= (boutiques.value[reward.store_slug]?.limite || Infinity)
      )
    }
  } catch (e) {
    console.error('Error fetching rewards and boutiques:', e)
    error.value = `Impossible de charger les données: ${e.message}`
  } finally {
    isLoading.value = false
  }
}

const markAsUsed = async (rewardId) => {
  try {
    const { error } = await supabase
      .from('reward')
      .update({ is_used: true })
      .eq('id', rewardId)

    if (error) throw error

    rewards.value = rewards.value.map(r => 
      r.id === rewardId ? { ...r, is_used: true } : r
    )
  } catch (e) {
    console.error('Error marking reward as used:', e)
  }
}

onMounted(async () => {
  await checkProfile()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    router.push('/')
    return
  }
  await fetchRewardsAndBoutiques()
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="py-24 bg-white">
      <div class="p-4">
        <Loader v-if="isLoading" />
        <template v-else-if="user">
          <p class="text-lg uppercase text-blue-800 font-semibold mb-4">
            Récompenses complètes
          </p>
          <p v-if="rewards.length === 0" class="text-center text-gray-500 py-8">
            Aucune récompense complète pour le moment.
          </p>
          <div v-else>
            <div v-for="reward in rewards" :key="reward.id" 
                 class="bg-white rounded-lg shadow-md p-4 mb-4"
                 :class="{ 
                   'border-2 border-blue-500': !reward.is_used,
                   'border border-gray-200': reward.is_used 
                 }">
              <div class="flex justify-start items-center gap-5">
                <div class="flex-shrink-0">
                  <svg v-if="!reward.is_used"
                       xmlns="http://www.w3.org/2000/svg" 
                       class="icon icon-tabler icon-tabler-gift text-blue-500" 
                       width="48" height="48" 
                       viewBox="0 0 24 24" 
                       stroke-width="1.5"
                       stroke="currentColor"
                       fill="none">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <rect x="3" y="8" width="18" height="4" rx="1" />
                    <line x1="12" y1="8" x2="12" y2="21" />
                    <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
                    <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />
                  </svg>
                  <svg v-else
                       xmlns="http://www.w3.org/2000/svg" 
                       class="icon icon-tabler icon-tabler-circle-check text-green-600" 
                       width="48" height="48" 
                       viewBox="0 0 24 24" 
                       stroke-width="1.5"
                       stroke="currentColor"
                       fill="none">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 12l2 2l4 -4" />
                  </svg>
                </div>
                <div class="flex flex-col w-full">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-md uppercase font-medium text-blue-800">{{ reward.profiles?.full_name }}</p>
                      <p class="text-sm text-gray-500">{{ boutiques[reward.store_slug]?.name_shop }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium" :class="reward.is_used ? 'text-green-600' : 'text-blue-600'">
                        {{ reward.is_used ? 'Validé' : 'À valider' }}
                      </p>
                      <p v-if="reward.is_used" class="text-xs text-gray-500">
                        Le {{ new Date(reward.validated_at || reward.hit_date).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-2">
                    <p class="text-sm text-gray-600">
                      <span class="font-medium">Points accumulés :</span> 
                      {{ reward.new_solde }} / {{ boutiques[reward.store_slug]?.limite }}
                    </p>
                    <p class="text-sm text-gray-600">
                      <span class="font-medium">Récompense :</span> 
                      {{ boutiques[reward.store_slug]?.lot }}
                    </p>
                    <p class="text-sm text-gray-500">
                      Complété le {{ new Date(reward.hit_date).toLocaleDateString() }}
                    </p>
                  </div>
                  <button 
                    v-if="!reward.is_used"
                    @click="markAsUsed(reward.id)"
                    class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full"
                  >
                    Valider la récompense
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>