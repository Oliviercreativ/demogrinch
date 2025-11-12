<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const users = ref([])
const isLoading = ref(true)
const error = ref(null)
const searchTerm = ref('')
const currentPage = ref(1)
const avatarUrl = ref('')
const itemsPerPage = 15

const fetchUsers = async () => {
  isLoading.value = true
  error.value = null
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, avatar_url, full_name, created_at')
      .order('created_at', { ascending: false })
    
    if (fetchError) throw fetchError
    users.value = data
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(fetchUsers)
</script>

<template>
  <div class="all-users-list">
    <h2 class="text-2xl font-bold mb-4">Rechercher un Utilisateur</h2>
    
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
    
    <div v-if="isLoading">Chargement des utilisateurs...</div>
    <div v-else-if="error">Une erreur est survenue : {{ error }}</div>
    <div v-else>
      <div v-for="user in paginatedUsers" :key="user.id" class="hover:bg-gray-100">
        <div class="flex justify-start items-center gap-5 py-4">
          <div class="">
             <img 
                :src="user.avatar_url" 
                :alt="`Avatar de ${user.full_name || 'l\'utilisateur'}`"
                @error="handleImageError"
                class="w-12 h-12 rounded-lg object-cover"
              />
          </div>
          <div class="flex flex-col justify-start items-start">
            <p class="uppercase text-blue-800 text-md font-semibold">{{ user.full_name || 'N/A' }}</p>
            <p class="italic text-gray-500 text-sm">Inscrit le {{ formatDate(user.created_at) }}</p>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-between items-center">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1" 
          class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Précédent
        </button>
        <span>Page {{ currentPage }} sur {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Suivant
        </button>
      </div>
    </div>
  </div>
</template>