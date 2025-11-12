<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import Loader from '@/components/Loader.vue'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

const isLoading = ref(true)
const error = ref(null)
const rewards = ref([])
const boutiques = ref({})
const userOwnedBoutiques = ref([])
const searchTerm = ref('')

const processedRewards = computed(() => {
  return rewards.value.map(reward => ({
    ...reward,
    boutiqueName: boutiques.value[reward.store_slug]?.name_shop,
    userName: reward.profiles?.full_name || 'Utilisateur inconnu',
    isOwner: userOwnedBoutiques.value.includes(reward.store_slug),
    lot: boutiques.value[reward.store_slug]?.lot,
    limite: boutiques.value[reward.store_slug]?.limite
  }))
})

const filteredRewards = computed(() => {
  return processedRewards.value.filter(reward => 
    reward.isOwner && // Filtre pour les récompenses de la boutique du propriétaire
    reward.new_solde >= reward.limite && // Filtre pour les récompenses gagnées
    (reward.userName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
     reward.boutiqueName.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
     reward.lot.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
})

const fetchRewardsAndBoutiques = async () => {
  if (!user.value) return

  try {
    const [boutiquesData, ownedBoutiquesData, rewardsData] = await Promise.all([
      supabase.from('boutique').select('*'),
      supabase.from('boutique').select('slug').eq('owner', user.value.id),
      supabase.from('reward')
        .select(`*, profiles:user_uid_reward (id, full_name)`)
        .order('hit_date', { ascending: false })
    ])

    if (boutiquesData.error) throw boutiquesData.error
    if (ownedBoutiquesData.error) throw ownedBoutiquesData.error
    if (rewardsData.error) throw rewardsData.error

    boutiques.value = Object.fromEntries(
      boutiquesData.data.map(boutique => [boutique.slug, boutique])
    )
    userOwnedBoutiques.value = ownedBoutiquesData.data.map(b => b.slug)
    rewards.value = rewardsData.data
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
  await fetchRewardsAndBoutiques()
})
</script>

<template>
  <div class="scanned-users-list w-full pt-8 pb-24 px-4 mx-auto max-w">
    <p class="text-lg uppercase font-semibold text-blue-800 text-center pb-10">Récompenses</p>
    <div class="mb-4">
      <div class="flex w-full rounded bg-white border border-gray-300">
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Rechercher un client ou une récompense" 
          class="w-full border-none bg-white px-4 py-1 text-gray-700 outline-none focus:outline-none"
        >
        <button type="submit" class="m-2 rounded bg-blue-800 px-4 py-2 text-white">
          <svg class="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.966 56.966">
            <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="isLoading"><Loader /></div>
    <div v-else-if="error">Une erreur est survenue : {{ error }}</div>
    <div v-else>
      <p v-if="filteredRewards.length === 0">
        Aucune récompense n'a été trouvée.
      </p>
      <div v-else>
        <div v-for="reward in filteredRewards" :key="reward.id" class="bg-white rounded-lg p-4 mb-4">
          <div class="flex justify-start items-center gap-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-check" width="48" height="48" viewBox="0 0 24 24" stroke-width="1" :stroke="reward.is_used ? '#1e40af' : '#F4F4F4'" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <path d="M9 12l2 2l4 -4" />
            </svg>
            <div class="flex flex-col">
              <p class="font-medium text-md text-blue-800">{{ reward.userName }}</p>
              <p class="text-md" :class="reward.is_used ? 'text-blue-800' : 'text-red-800'">
                {{ reward.is_used ? 'Récompense utilisée' : 'Récompense disponible !' }}
              </p>
              <p class="text-sm font-normal text-gray-500">{{ reward.lot }}</p>
              <p class="text-sm font-normal text-gray-500">Obtenue le {{ new Date(reward.hit_date).toLocaleDateString() }}</p>
              <button 
                v-if="!reward.is_used"
                @click="markAsUsed(reward.id)"
                class="mt-2 px-3 py-1 bg-blue-800 text-white rounded text-md"
              >
                Marquer comme utilisé
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>