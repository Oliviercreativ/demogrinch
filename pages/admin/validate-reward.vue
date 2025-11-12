<template>
  <div class="min-h-screen bg-gray-50 p-4 pb-24">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Points de fidélité</h1>
        <p class="text-gray-600">Gérez les demandes de points de fidélité de vos clients</p>

        <!-- Sélecteur de boutique si plusieurs boutiques -->
        <div v-if="userBoutiques.length > 1" class="mt-4">
          <select v-model="selectedBoutiqueSlug" @change="fetchRewards"
            class="block w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
            <option value="">Toutes mes boutiques</option>
            <option v-for="boutique in userBoutiques" :key="boutique.slug" :value="boutique.slug">
              {{ boutique.name_shop }}
            </option>
          </select>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Recherche par nom -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un client
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input v-model="searchName" type="text" placeholder="Nom du client..."
                class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <!-- Filtre par statut -->
          <div class="md:w-64">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select v-model="filterStatus"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors">
              <option value="all">Tous les statuts</option>
              <option value="false">✅ Accepté</option>
              <option value="null">✅ Accepté</option>
            </select>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>{{ filteredRewards.length }} résultat(s) sur {{ rewards.length }}</span>
            <div class="flex items-center space-x-4">
              <span v-if="filteredRewards.length !== rewards.length" class="text-blue-600">
                Filtres actifs
              </span>
              <span class="text-gray-500">
                {{ userBoutiques.length }} boutique(s) gérée(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des récompenses -->
      <div class="space-y-4">
        <div v-for="reward in filteredRewards" :key="reward.id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md ">
          <div class="p-6">
            <!-- Header de la carte -->
            <div class="flex items-start justify-between mb-4">
              <NuxtLink :to="`/profile/${reward.user_uid_reward}`">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ reward.profiles?.full_name || reward.user_uid_reward }}
                    </h3>
                    <p class="text-sm text-gray-500">
                      {{ getBoutiqueName(reward.store_slug) }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ new Date(reward.hit_date).toLocaleDateString('fr-FR') }} le {{ new
                      Date(reward.hit_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <!-- Badge de statut -->
              <div class="flex items-center space-x-2">
                <span :class="{
                  'text-green-800': (reward.is_read === false || reward.source === 'admin' || reward.source === 'owner'),
                  'text-yellow-800': reward.is_read === null
                }" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
                  <span v-if="reward.source === 'admin' || reward.source === 'owner'">✅ Accepté</span>
                  <span v-else-if="reward.is_read === false && reward.is_used === true">✅ Utilisé</span>
                  <span v-else>✅ Accepté</span>
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="reward.source !== 'admin' && reward.source !== 'owner'"
              class="flex items-center justify-end space-x-3 py-4 border-t border-gray-200">
              <template v-if="reward.is_read === null">
                <button @click="refuserReward(reward)"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Refuser
                </button>
                <button @click="accepterReward(reward)"
                  class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Accepter
                </button>
              </template>
            </div>

            <!-- Informations de la récompense -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <!-- Solde -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-semibold text-gray-900">{{ reward.new_solde }}</span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span class="text-lg font-semibold text-blue-600">{{ getBoutiqueLimite(reward.store_slug) }}
                    pts</span>
                </div>
                <!-- Barre de progression -->
                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: Math.min((reward.new_solde / getBoutiqueLimite(reward.store_slug)) * 100, 100) + '%' }">
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 rounded-lg p-4" v-if="reward.new_solde >= getBoutiqueLimite(reward.store_slug)">
                <div class="text-sm font-medium text-gray-500 mb-1">Récompense</div>
                <div class="text-sm text-gray-900 font-medium">
                  {{ getBoutiqueLot(reward.store_slug) || 'Récompense' }}
                </div>
                <div class="flex items-center space-x-2 mt-1">
                  <div :class="reward.is_used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium">
                    <template v-if="reward.is_used">
                      Utilisé
                      <span v-if="reward.used_at" class="ml-1 text-xs text-gray-500">
                        le {{ new Date(reward.used_at).toLocaleDateString('fr-FR') }}
                      </span>
                    </template>
                    <template v-else>
                      Disponible
                    </template>
                  </div>
                  <template v-if="!reward.is_used" class="flex items-center space-x-2">
                    <button class="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      @click="marquerCommeUtilise(reward)">
                      Marquer comme utilisé
                    </button>
                  </template>
                </div>
              </div>
            </div>

            <!-- Source et notes admin si présentes -->
            <div v-if="reward.source || reward.admin_notes" class="mb-4 p-3 bg-blue-50 rounded-lg">
              <div class="flex items-start space-x-2">
                <svg class="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-sm">
                  <div v-if="reward.source" class="text-gray-600">
                    <strong>Source: </strong>
                    <span v-if="reward.source === 'scan_uid'">appareil photo</span>
                    <span v-else-if="reward.source === 'scanner'">Scanner de l'appli</span>
                    <span v-else-if="reward.source === 'owner'">Gérant de la boutique</span>
                    <span v-else-if="reward.source === 'admin'">Administrateur</span>
                    <span v-else>{{ reward.source }}</span>
                  </div>
                  <div v-if="reward.admin_notes" class="text-gray-600 mt-1">
                    <strong>Notes:</strong> {{ reward.admin_notes }}
                  </div>
                </div>
              </div>
            </div>
            <button @click="deleteReward(reward)"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Supprimer
            </button>
          </div>
        </div>

        <!-- État vide -->
        <div v-if="filteredRewards.length === 0"
          class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900">Aucune récompense</h3>
          <p class="mt-2 text-gray-500">
            {{ (searchName || filterStatus !== 'all') ? 'Aucun résultat ne correspond à vos filtres' : 'Aucunerécompense en attente pour vos boutiques' }}
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Chargement des récompenses...
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  showHeader: false,
  showNavbar: false,
  middleware: ['auth', 'owner'],
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const rewards = ref<any[]>([])
const userBoutiques = ref<any[]>([])
const selectedBoutiqueSlug = ref('')
const searchName = ref('')
const filterStatus = ref('all')
const loading = ref(true)

let channel: any = null

// Récupérer les boutiques de l'owner connecté
const fetchUserBoutiques = async () => {
  if (!user.value) return

  try {
    const { data, error } = await supabase
      .from('boutique')
      .select('id, slug, name_shop, limite, lot, owner')
      .eq('owner', user.value.id)
      .eq('statut', true)
      .order('name_shop')

    if (error) {
      console.error('Error fetching user boutiques:', error)
      return
    }

    userBoutiques.value = data || []
    console.log('User boutiques:', userBoutiques.value)
  } catch (error) {
    console.error('Error in fetchUserBoutiques:', error)
  }
}

// Récupérer les rewards pour les boutiques de l'owner
const fetchRewards = async () => {
  if (userBoutiques.value.length === 0) {
    rewards.value = []
    loading.value = false
    return
  }

  try {
    loading.value = true

    // Créer la liste des slugs des boutiques de l'owner
    let slugsToFilter = userBoutiques.value.map(b => b.slug)

    // Si une boutique spécifique est sélectionnée
    if (selectedBoutiqueSlug.value) {
      slugsToFilter = [selectedBoutiqueSlug.value]
    }

    console.log('Fetching rewards for slugs:', slugsToFilter)

    const { data, error } = await supabase
      .from('reward')
      .select('*, profiles:user_uid_reward(full_name)')
      .in('store_slug', slugsToFilter)
      .order('hit_date', { ascending: false })
      .limit(100) // Limiter pour éviter trop de données

    if (error) {
      console.error('Error fetching rewards:', error)
      return
    }

    rewards.value = data || []
    console.log('Fetched rewards:', rewards.value.length)
  } catch (error) {
    console.error('Error in fetchRewards:', error)
  } finally {
    loading.value = false
  }
}

// Filtrer les rewards
const filteredRewards = computed(() => {
  return rewards.value.filter(reward => {
    // Filtre par nom
    const nameMatch = !searchName.value ||
      (reward.profiles?.full_name?.toLowerCase().includes(searchName.value.toLowerCase()))

    // Filtre par statut is_read
    let statusMatch = true
    if (filterStatus.value === 'false') statusMatch = reward.is_read === false
    if (filterStatus.value === 'null') statusMatch = reward.is_read === null

    return nameMatch && statusMatch
  })
})

// Fonctions utilitaires
const getBoutiqueName = (slug: string) => {
  const boutique = userBoutiques.value.find(b => b.slug === slug)
  return boutique?.name_shop || slug
}

const getBoutiqueLimite = (slug: string) => {
  const boutique = userBoutiques.value.find(b => b.slug === slug)
  return boutique?.limite || 10
}

const getBoutiqueLot = (slug: string) => {
  const boutique = userBoutiques.value.find(b => b.slug === slug)
  return boutique?.lot || 'Récompense'
}

// Actions sur les rewards
const accepterReward = async (reward: any) => {
  try {
    const { error } = await supabase
      .from('reward')
      .update({ is_read: false })
      .eq('id', reward.id)

    if (!error) {
      reward.is_read = false
      console.log('Reward accepted:', reward.id)
    } else {
      console.error('Error accepting reward:', error)
    }
  } catch (error) {
    console.error('Error in accepterReward:', error)
  }
}

const refuserReward = async (reward: any) => {
  if (!confirm('Êtes-vous sûr de vouloir refuser cette récompense ?')) return

  try {
    const { error } = await supabase
      .from('reward')
      .delete()
      .eq('id', reward.id)

    if (!error) {
      // Retirer l'élément de la liste locale
      const index = rewards.value.findIndex(r => r.id === reward.id)
      if (index !== -1) {
        rewards.value.splice(index, 1)
      }
      console.log('Reward refused and deleted:', reward.id)
    } else {
      console.error('Error refusing reward:', error)
    }
  } catch (error) {
    console.error('Error in refuserReward:', error)
  }
}

const marquerCommeUtilise = async (reward: any) => {
  // @ts-ignore
  const { error } = await supabase
    .from('reward')
    .update({is_used: true})
    .eq('id', reward.id)
  if (!error) {
    reward.is_used = true
    reward.used_at = new Date().toISOString()
  }
}

const deleteReward = async (reward: any) => {
  if (!confirm('Es-tu sûr de vouloir supprimer cette récompense ?')) return
  try {
    const { error } = await supabase
      .from('reward')
      .delete()
      .eq('id', reward.id)
    if (!error) {
      // Retirer la reward de la liste locale
      const index = rewards.value.findIndex(r => r.id === reward.id)
      if (index !== -1) {
        rewards.value.splice(index, 1)
      }
      console.log('Reward supprimée :', reward.id)
    } else {
      alert('Erreur lors de la suppression : ' + error.message)
      console.error('Erreur suppression reward :', error)
    }
  } catch (e) {
    alert('Erreur lors de la suppression')
    console.error('Erreur suppression reward :', e)
  }
}

// Setup realtime
const setupRealtime = () => {
  if (userBoutiques.value.length === 0) return

  const slugs = userBoutiques.value.map(b => b.slug)

  channel = supabase.channel('realtime:reward')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reward' },
      async (payload) => {
        // Vérifier si le changement concerne une des boutiques de l'owner
        const affectedSlug = payload.new?.store_slug || payload.old?.store_slug
        if (slugs.includes(affectedSlug)) {
          console.log('Realtime update detected for slug:', affectedSlug)
          await fetchRewards()
        }
      }
    )
    .subscribe()
}

// Lifecycle
onMounted(async () => {
  if (!user.value) {
    console.error('User not authenticated')
    loading.value = false
    return
  }

  // Charger les boutiques puis les rewards
  await fetchUserBoutiques()
  await fetchRewards()
  setupRealtime()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

// Watcher pour recharger les rewards quand une boutique est sélectionnée
watch(selectedBoutiqueSlug, () => {
  fetchRewards()
})
</script>

<style></style>