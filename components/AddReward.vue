<script setup>
import { ref, computed } from 'vue'
import { useSupabaseClient, useRoute } from '#imports'

const route = useRoute()

const props = defineProps({
  boutiqueSlug: {
    type: String,
    required: true
  },
  specificUserId: {
    type: String,
    default: null
  },
  users: {
    type: Array,
    required: true
  },
  specificUserName: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['rewardAdded'])
const supabase = useSupabaseClient()
const showAddRewardModal = ref(false)
const newReward = ref({
  user_uid_reward: '',
  points_to_add: 1
})
const addRewardError = ref('')

const isProfilePage = computed(() => route.path.startsWith('/profile/'))

const openAddRewardModal = () => {
  newReward.value = {
    user_uid_reward: isProfilePage.value ? props.specificUserId : '',
    points_to_add: 1
  }
  addRewardError.value = ''
  showAddRewardModal.value = true
}

const closeAddRewardModal = () => {
  showAddRewardModal.value = false
}

const userProfileName = computed(() => {
  if (!props.users) return ''
  const profile = props.users.find(user => user.id === props.specificUserId)?.profile
  return profile ? profile.full_name : ''
})

const addReward = async () => {
  addRewardError.value = ''
  
  const userId = isProfilePage.value ? props.specificUserId : newReward.value.user_uid_reward

  if (!userId) {
    addRewardError.value = "Veuillez sélectionner un utilisateur."
    return
  }

  try {
    const { data: lastReward, error: lastRewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('store_slug', props.boutiqueSlug)
      .eq('user_uid_reward', userId)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single()

    if (lastRewardError && lastRewardError.code !== 'PGRST116') {
      throw lastRewardError
    }

    const currentSolde = lastReward ? lastReward.new_solde : 0
    const newSolde = currentSolde + newReward.value.points_to_add
    const rewardSlug = lastReward ? lastReward.rewardSlug : crypto.randomUUID()

    // Insérer le nouveau reward
    const { data: insertedReward, error: insertError } = await supabase
      .from('reward')
      .insert({
        hit_date: new Date().toISOString(),
        solde: currentSolde,
        new_solde: newSolde,
        store_slug: props.boutiqueSlug,
        rewardSlug: rewardSlug,
        user_uid_reward: userId,
        is_used: false,
        series_uid: rewardSlug
      })
      .select('*, profiles:user_uid_reward(*)')

    if (insertError) throw insertError

    emit('rewardAdded', insertedReward[0])
    closeAddRewardModal()
    alert('Reward ajouté avec succès!')

  } catch (error) {
    console.error('Erreur lors de l\'ajout du reward:', error)
    addRewardError.value = `Une erreur est survenue: ${error.message}`
  }
}
const updateReward = async (action) => {
  addRewardError.value = ''

  try {
    const userId = isProfilePage.value ? props.specificUserId : newReward.value.user_uid_reward

    const { data: lastReward, error: lastRewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('store_slug', props.boutiqueSlug)
      .eq('user_uid_reward', userId)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single()

    if (lastRewardError && lastRewardError.code !== 'PGRST116') {
      throw lastRewardError
    }

    const currentSolde = lastReward ? lastReward.new_solde : 0
    const newSolde = action === 'add'
      ? currentSolde + newReward.value.points_to_add
      : currentSolde - newReward.value.points_to_add

    const { data: updatedReward, error: updateError } = await supabase
      .from('reward')
      .update({
        new_solde: newSolde
      })
      .eq('id', lastReward.id)
      .select('*, profiles:user_uid_reward(*)')

    if (updateError) throw updateError

    emit('rewardAdded', updatedReward[0])
    closeAddRewardModal()
    alert('Reward mis à jour avec succès !')
  } catch (error) {
    console.error('Erreur lors de la mise à jour du reward:', error)
    addRewardError.value = `Une erreur est survenue: ${error.message}`
  }
}

</script>

<template>
  <div>
    <button @click="openAddRewardModal" class="w-full mb-4 px-4 py-2 bg-blue-800 rounded flex justify-center items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-mood-plus stroke-white" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M20.985 12.528a9 9 0 1 0 -8.45 8.456" />
        <path d="M16 19h6" />
        <path d="M19 16v6" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M9.5 15c.658 .64 1.56 1 2.5 1s1.842 -.36 2.5 -1" />
      </svg>
      <span class="text-white font-normal text-sm">Ajouter un point</span>
    </button>

    <div v-if="showAddRewardModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 rounded-md bg-white">
        <p class="text-lg leading-6 font-medium text-blue-800 text-center uppercase">Ajouter un point</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Utilisateur</label>
          <input
            v-if="isProfilePage"
            type="text"
            :value="userProfileName"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2"
          >
          <select 
            v-else
            v-model="newReward.user_uid_reward"
            class="mt-1 block w-full rounded-md border border-blue-800 shadow-sm p-2"
          >
            <option value="">Sélectionnez un utilisateur</option>
            <option v-for="user in users" :key="user.id" :value="user.id" class="p-4">
              {{ user.full_name || user.email || 'Utilisateur sans nom' }}
            </option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Points à ajouter</label>
          <input 
            v-model.number="newReward.points_to_add"
            type="number"
            min="1"
            class="mt-1 block w-full text-blue-800 rounded-md border border-blue-800 p-2 shadow-sm"
          >
        </div>
        <p v-if="addRewardError" class="text-red-500 text-sm mb-4">{{ addRewardError }}</p>
        <div class="flex justify-end">
  <button
    @click="updateReward('add')"
    class="px-4 py-2 bg-blue-800 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
  >
    Ajouter
  </button>
  <button
    @click="updateReward('subtract')"
    class="ml-3 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
  >
    Retirer
  </button>
  <button
    @click="closeAddRewardModal"
    class="ml-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
  >
    Annuler
  </button>
</div>
      </div>
    </div>
  </div>
</template>