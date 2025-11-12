<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const isLoading = ref(true)
const boutique = ref(null)
const stats = ref({
  totalScans: 0,
  uniqueUsers: 0,
  rewardsGiven: 0,
  todayScans: 0
})

// Vérifier si l'utilisateur est propriétaire d'une boutique
const checkOwnerStatus = async () => {
  if (!user.value?.id) {
    isLoading.value = false
    return
  }

  try {
    // Chercher les boutiques dont l'utilisateur est propriétaire
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)
      .eq('statut', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (boutiques) {
      isOwner.value = true
      boutique.value = boutiques
      await fetchStats()
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut propriétaire:', error)
  } finally {
    isLoading.value = false
  }
}

// Récupérer les statistiques de la boutique
const fetchStats = async () => {
  if (!boutique.value) return

  try {
    // Total des scans (rewards)
    const { count: totalRewards, error: rewardsError } = await supabase
      .from('reward')
      .select('*', { count: 'exact', head: true })
      .eq('store_slug', boutique.value.slug)

    if (rewardsError) throw rewardsError

    // Utilisateurs uniques
    const { data: allRewards, error: allRewardsError } = await supabase
      .from('reward')
      .select('user_uid_reward')
      .eq('store_slug', boutique.value.slug)

    if (allRewardsError) throw allRewardsError

    const uniqueUserIds = new Set(allRewards.map(r => r.user_uid_reward))

    // Récompenses utilisées (gagnées)
    const { count: usedRewards, error: usedError } = await supabase
      .from('reward')
      .select('*', { count: 'exact', head: true })
      .eq('store_slug', boutique.value.slug)
      .eq('is_used', true)

    if (usedError) throw usedError

    // Scans d'aujourd'hui
    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount, error: todayError } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('boutique_id', boutique.value.id)
      .gte('created_at', today + 'T00:00:00')

    if (todayError) throw todayError

    stats.value = {
      totalScans: totalRewards || 0,
      uniqueUsers: uniqueUserIds.size,
      rewardsGiven: usedRewards || 0,
      todayScans: todayCount || 0
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
  }
}

onMounted(checkOwnerStatus)

// Ne rien afficher si pas propriétaire
const showDashboard = computed(() => isOwner.value && boutique.value)
</script>

<template>
  <div v-if="showDashboard" class="bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl shadow-lg overflow-hidden">
    <!-- Header du tableau de bord -->
    <div class="px-6 py-4 bg-blue-900/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 class="text-white font-bold text-lg">{{ boutique.name_shop }}</h2>
            <p class="text-blue-200 text-sm">Tableau de bord</p>
          </div>
        </div>
        <NuxtLink to="/admin"
          class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Gérer →
        </NuxtLink>
      </div>
    </div>

    <!-- Statistiques -->
    <div v-if="isLoading" class="p-6">
      <div class="flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    </div>

    <div v-else class="p-6">
      <div class="grid grid-cols-2 gap-4">
        <!-- Total des points donnés -->
        <div class="bg-white/10 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-200 text-sm font-medium">Points donnés</p>
              <p class="text-white text-2xl font-bold">{{ stats.totalScans }}</p>
            </div>
            <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Clients uniques -->
        <div class="bg-white/10 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-200 text-sm font-medium">Clients</p>
              <p class="text-white text-2xl font-bold">{{ stats.uniqueUsers }}</p>
            </div>
            <div class="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Récompenses données -->
        <div class="bg-white/10 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-200 text-sm font-medium">Récompenses</p>
              <p class="text-white text-2xl font-bold">{{ stats.rewardsGiven }}</p>
            </div>
            <div class="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v13m0-13V6a2 2 0 112 0v6M9 21h6" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Scans aujourd'hui -->
        <div class="bg-white/10 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-200 text-sm font-medium">Aujourd'hui</p>
              <p class="text-white text-2xl font-bold">{{ stats.todayScans }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="mt-6 flex gap-3">
        <NuxtLink to="/admin/liste-clients"
          class="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg text-center font-medium transition-colors">
          Mes clients
        </NuxtLink>
        <NuxtLink :to="`/shop/${boutique.slug}`"
          class="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg text-center font-medium transition-colors">
          Ma boutique
        </NuxtLink>
      </div>
    </div>
  </div>
</template>