<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useAsyncData } from '#app'

const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 50
const protectedUserId = 'd04dad76-47de-468b-ba95-b5269b1d5385'
const isProtectedUser = computed(() => currentUser.value?.id === protectedUserId)

definePageMeta({
  middleware: ['auth'],
  showHeader: false,
  showNavbar: false
})

const totalProfiles = ref(0)

const fetchTotalProfiles = async () => {
 const { count } = await supabase
   .from('profiles') 
   .select('*', { count: 'exact', head: true })

 totalProfiles.value = count
}

onMounted(fetchTotalProfiles)

const { data: users, pending: isLoading, error } = await useAsyncData(
 'users',
 async () => {
   const { data } = await supabase
     .from('profiles')
     .select('id, avatar_url, full_name, last_seen')
     .order('created_at', { ascending: false })
   return data || []
 },
 { watch: [] }
)

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Format 24h
  })
}


const filteredUsers = computed(() => {
  return users.value?.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.value.toLowerCase())
  ) || []
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredUsers.value.slice(start, start + itemsPerPage)
})


// Réinitialiser la page quand le terme de recherche change
watch(searchTerm, () => {
 currentPage.value = 1
})

watch(searchTerm, () => {
 currentPage.value = 1
})


const handleImageError = (e) => {
  e.target.src = '/apple-touch-icon-180x180.png'
}
</script>

<template>
  <div v-if="isProtectedUser" class="all-users-list w-full p-4 pt-6 pb-24">

    <h2 class="text-md text-blue-900 font-medium mb-4 text-balance text-center">
      {{ totalProfiles }} utilisateurs enregistrés
    </h2>

    <div class="mb-4">
      <input 
        v-model="searchTerm" 
        type="text" 
        placeholder="Rechercher un utilisateur" 
        class="w-full border rounded px-4 py-2"
      >
    </div>
    
    <div v-if="isLoading">Chargement...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-if="totalPages > 1" class="mt-4 flex justify-between gap-2">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50"
      >
        <
      </button>
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50"
      >
        >
      </button>
    </div>
      <NuxtLink 
        v-for="user in paginatedUsers" 
        :key="user.id"
        :to="`/profile/${user.id}`"
        class="p-4 border rounded flex items-center space-x-4 hover:bg-gray-50"
      >
        <img 
          :src="user.avatar_url" 
          :alt="user.full_name"
          @error="handleImageError"
          class="w-12 h-12 rounded-lg object-contain"
          loading="lazy"
        />
        <div class="flex flex-col justify-start items-start text-zinc-500">
          <span class="font-medium">{{ user.full_name || 'Utilisateur sans nom' }}</span>
          <span class="font-normal text-xs">{{ formatDate(user.last_seen) }}</span>
        </div>
      </NuxtLink>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex justify-between gap-2">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50"
      >
        <
      </button>
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50"
      >
        >
      </button>
    </div>
  </div>
</template>