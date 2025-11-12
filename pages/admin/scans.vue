<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import AddReward from '@/components/AddReward.vue'

const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const users = ref([])
const rewards = ref([])
const isLoading = ref(true)
const error = ref(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 20
const boutiqueSlug = ref('')

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const { data: boutiqueData, error: boutiqueError } = await supabase
      .from('boutique')
      .select('slug')
      .eq('owner', currentUser.value.id)
      .single()

    if (boutiqueError) throw boutiqueError
    boutiqueSlug.value = boutiqueData.slug

    // Récupérer tous les scans pour cette boutique avec les informations des profiles
    const { data: scans, error: scansError } = await supabase
      .from('reward')
      .select(`
        *,
        profiles:user_uid_reward (*)
      `)
      .eq('store_slug', boutiqueSlug.value)
      .order('hit_date', { ascending: false })

    if (scansError) throw scansError

    // Traiter les données pour obtenir des utilisateurs uniques avec leurs scans
    const userMap = {}
    scans.forEach(scan => {
      const userId = scan.user_uid_reward
      if (!userMap[userId]) {
        userMap[userId] = {
          ...scan.profiles,
          totalScans: 0,
          lastScanDate: null,
          currentPoints: 0
        }
      }
      userMap[userId].totalScans++
      userMap[userId].currentPoints = Math.max(userMap[userId].currentPoints, scan.new_solde)
      if (!userMap[userId].lastScanDate || new Date(scan.hit_date) > new Date(userMap[userId].lastScanDate)) {
        userMap[userId].lastScanDate = scan.hit_date
      }
    })

    users.value = Object.values(userMap)
    rewards.value = scans

  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

const filteredRewards = computed(() => {
  return rewards.value.filter(reward => 
    reward.profiles.full_name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    reward.profiles.email?.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const totalScans = computed(() => rewards.value.length)
const totalPages = computed(() => Math.ceil(filteredRewards.value.length / itemsPerPage))

const paginatedRewards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRewards.value.slice(start, end)
})

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const handleImageError = (e) => {
  e.target.src = '/logo-mic.svg'
}

const showDeleteModal = ref(false)
const rewardToDelete = ref(null)

const openDeleteModal = (reward) => {
  rewardToDelete.value = reward
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  rewardToDelete.value = null
}

const confirmDelete = async () => {
  if (!rewardToDelete.value) return

  try {
    const { data, error } = await supabase
      .from('reward')
      .delete()
      .eq('id', rewardToDelete.value.id)
      .select()

    if (error) throw error

    if (data && data.length > 0) {
      rewards.value = rewards.value.filter(reward => reward.id !== rewardToDelete.value.id)
      
      const updatedUserIndex = users.value.findIndex(user => user.id === rewardToDelete.value.user_uid_reward)
      if (updatedUserIndex !== -1) {
        users.value[updatedUserIndex].totalScans--
        // Ajustez d'autres propriétés si nécessaire
      }

      alert('Le reward a été supprimé avec succès.')
    } else {
      throw new Error('Aucun reward n\'a été supprimé')
    }

  } catch (e) {
    console.error('Erreur lors de la suppression du reward:', e)
    alert(`Une erreur est survenue lors de la suppression du reward : ${e.message}`)
  } finally {
    closeDeleteModal()
  }
}

const handleRewardAdded = (newReward) => {
  rewards.value = [newReward, ...rewards.value]
  
  // Mettre à jour les statistiques de l'utilisateur
  const updatedUserIndex = users.value.findIndex(user => user.id === newReward.user_uid_reward)
  if (updatedUserIndex !== -1) {
    users.value[updatedUserIndex].totalScans++
    users.value[updatedUserIndex].currentPoints = newReward.new_solde
  }
  // refreshRewardsList()
}

onMounted(fetchData)

</script>

<template>
  <div class="scanned-users-list w-full pt-8 pb-24 px-4 mx-auto max-w-2xl">
    <div v-if="isLoading"><Loader /></div>
    <div v-else-if="error">Une erreur est survenue : {{ error }}</div>
    <div v-else>
      <p class="text-lg uppercase font-semibold text-blue-800 text-center pb-10">Scans de votre QRCode</p>
      <div class="mb-4">
        <div class="flex w-full rounded bg-white border border-gray-300">
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="Rechercher un utilisateur" 
            class="w-full border-none bg-white px-4 py-1 text-gray-700 outline-none focus:outline-none"
          >
          <button type="submit" class="m-2 rounded bg-blue-800 px-4 py-2 text-white">
            <svg class="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.966 56.966">
              <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
            </svg>
          </button>
        </div>
      </div>
      <p class="text-md font-normal text-gray-500"><span class="text-blue-800 font-medium">{{ totalScans }}</span> scans de votre QRCode</p>
      
      <div class="mt-4 flex justify-between items-center">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1" 
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300"
        >
          <
        </button>
        <span>{{ currentPage }} sur {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300"
        >
          >
        </button>
      </div>

      <div v-for="reward in paginatedRewards" :key="reward.id" class="border-b py-2 border-b-gray-300">
        <div class="flex items-center justify-between space-x-4">
          <img 
          :src="reward.profiles.avatar_url" 
          :alt="`Avatar de ${reward.profiles.full_name || 'l\'utilisateur'}`"
          @error="handleImageError"
          class="w-16 h-16 rounded-lg object-contain"
          />
          <div>
             <NuxtLink :to="`/profile/${reward.profiles.id}`">
              <p class="font-medium text-blue-800">{{ reward.profiles.full_name || 'Utilisateur sans nom' }}</p>
              <p class="text-xs"><span class="text-blue-800 font-normal">{{ reward.solde }} -> {{ reward.new_solde }} pts de fidélité</span></p>
              <p class="text-xs text-gray-500">Date du scan : {{ new Date(reward.hit_date).toLocaleString() }}</p>
              <button 
                v-if="reward.isOwner && !reward.is_used" 
                @click="markAsUsed(reward.id)"
                class="mt-2 px-3 py-1 bg-blue-800 text-white rounded text-md"
              >
                Marquer comme utilisé
              </button>
            </NuxtLink>
          </div>
          <div class="text-right">
            <button 
              @click="openDeleteModal(reward)" 
              class="text-red-600 hover:text-red-800 transition-colors duration-200 relative z-30"
              title="Supprimer ce reward"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash-x stroke-current" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M4 7h16" />
                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                <path d="M10 12l4 4m0 -4l-4 4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3 text-left">
            <p class="text-lg leading-6 font-medium text-blue-800 text-center uppercase">Confirmer la suppression</p>
            <div class="mt-2 px-7 py-3">
              <p class="text-sm text-blue-800">
                Êtes-vous sûr de vouloir supprimer ce reward ?
              </p>
              <p class="mt-1 text-sm text-gray-700">
                {{ rewardToDelete?.profiles.full_name || 'Inconnu' }}
              </p>
              <p class="text-sm text-gray-700">
                {{ rewardToDelete ? new Date(rewardToDelete.hit_date).toLocaleString() : '' }}
              </p>
            </div>
            <div class="items-center px-4 py-3">
              <button
                @click="confirmDelete"
                class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Supprimer
              </button>
              <button
                @click="closeDeleteModal"
                class="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 flex justify-between items-center">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1" 
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300"
        >
          <
        </button>
        <span>{{ currentPage }} sur {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="px-4 py-2 bg-blue-900 text-white rounded disabled:bg-gray-300"
        >
          >
        </button>
      </div>
    </div>
  </div>
</template>