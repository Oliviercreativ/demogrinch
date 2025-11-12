<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const recentUsers = ref([])
const isLoading = ref(true)

definePageMeta({
  middleware: ['auth'],
  showHeader: false,
  showNavbar: false,
})

const fetchRecentUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, last_seen')
      .not('last_seen', 'is', null)
      .order('last_seen', { ascending: false }) 
      .limit(20)

    if (error) throw error
    recentUsers.value = data

  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    isLoading.value = false
  }
}

// Formater le temps écoulé
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  
  if (seconds < 60) return 'Il y a quelques secondes'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  
  const days = Math.floor(hours / 24)
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`
}

let interval
onMounted(() => {
  fetchRecentUsers()
  interval = setInterval(fetchRecentUsers, 30000) // Rafraîchir toutes les 30 secondes
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
onMounted(async () => {
  if (user.value) {
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)

    if (boutiques && boutiques.length > 0) {
      isOwner.value = true
      ownedBoutiques.value = boutiques

      await Promise.all(ownedBoutiques.value.map(fetchBoutiqueData))
    }
  }
  isLoading.value = false
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="bg-white">
      
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
      </div>
      <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</div>
      <div v-else>
        <h2 class="text-xl font-semibold text-blue-800 mb-6">
          Dernières activités utilisateurs
        </h2>
        <div v-if="recentUsers.length === 0" class="text-center text-gray-500 py-8">
          Aucune activité récente
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div 
            v-for="user in recentUsers" 
            :key="user.id"
            class="flex items-center justify-between py-4"
          >
            <NuxtLink :to="`/profile/${user.id}`">
              <div class="flex items-center space-x-3">
                <!-- Avatar placeholder -->
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-800 font-medium">
                    {{ (user.full_name || user.email || '?')[0].toUpperCase() }}
                  </span>
                </div>
                
                <div>
                  <p class="font-medium text-gray-900">
                    {{ user.full_name || user.email }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ getTimeAgo(user.last_seen) }}
                  </p>
                </div>
              </div>
            </NuxtLink>

            <div 
              class="h-3 w-3 rounded-full" 
              :class="{
                'bg-green-500': new Date(user.last_seen) > new Date(Date.now() - 5 * 60000),
                'bg-gray-300': new Date(user.last_seen) <= new Date(Date.now() - 5 * 60000)
              }"
              :title="new Date(user.last_seen).toLocaleString()"
            ></div>
          </div>
        </div>

        <div class="mt-4 text-center text-xs text-gray-500">
          Dernière mise à jour : {{ new Date().toLocaleTimeString() }}
        </div>
      </div>
    </div>
  </div>
</template>