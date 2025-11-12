<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'

definePageMeta({
  middleware: 'auth',
  showHeader: true,
  showNavbar: true,
})

const supabase = useSupabaseClient()

const bonsPlans = ref([])
const isLoading = ref(true)
const selectedType = ref('all')

// Récupérer tous les bons plans actifs
const fetchBonsPlans = async () => {
  isLoading.value = true
  
  const { data, error } = await supabase
    .from('banners')
    .select(`
      *,
      boutique:boutique!inner(name_shop, logo_shop, slug)
    `)
    .eq('active', true)
    .eq('public', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erreur lors du chargement des bons plans:', error)
  } else {
    bonsPlans.value = data || []
  }
  
  isLoading.value = false
}

// Filtrer par type
const filteredBonsPlans = computed(() => {
  if (selectedType.value === 'all') {
    return bonsPlans.value
  }
  return bonsPlans.value.filter(bp => bp.position === selectedType.value)
})

// Incrémenter les vues
const incrementViews = async (bonPlanId) => {
  await supabase.rpc('increment_banner_views', { banner_id: bonPlanId })
}

// Incrémenter les clics
const handleClick = async (bonPlan) => {
  if (bonPlan.link_url) {
    await supabase.rpc('increment_banner_clicks', { banner_id: bonPlan.id })
    window.open(bonPlan.link_url, '_blank')
  }
}

onMounted(() => {
  fetchBonsPlans()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Bons Plans 🏷️</h1>
      <p class="text-gray-600">Découvrez toutes les promotions et événements de vos boutiques préférées !</p>
    </div>

    <!-- Filtres -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
      <button
        @click="selectedType = 'all'"
        :class="selectedType === 'all' ? 'bg-blue-800 text-white' : 'bg-white text-gray-700 border border-gray-300'"
        class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition"
      >
        Tous
      </button>
      <button
        @click="selectedType = 'bonplan'"
        :class="selectedType === 'bonplan' ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
        class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition"
      >
        🏷️ Bons plans
      </button>
      <button
        @click="selectedType = 'evenement'"
        :class="selectedType === 'evenement' ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
        class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition"
      >
        🎉 Événements
      </button>
      <button
        @click="selectedType = 'atelier'"
        :class="selectedType === 'atelier' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
        class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition"
      >
        🎨 Ateliers
      </button>
      <button
        @click="selectedType = 'pub'"
        :class="selectedType === 'pub' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
        class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition"
      >
        📢 Publicités
      </button>
    </div>

    <!-- Liste des bons plans -->
    <div v-if="isLoading" class="text-center py-8">
      <p class="text-gray-500">Chargement...</p>
    </div>

    <div v-else-if="filteredBonsPlans.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-gray-500 text-lg">Aucun bon plan disponible pour le moment</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="bonPlan in filteredBonsPlans"
        :key="bonPlan.id"
        class="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden"
        @click="handleClick(bonPlan)"
      >
        <!-- Image -->
        <div v-if="bonPlan.image_url" class="relative">
          <img 
            :src="bonPlan.image_url" 
            :alt="bonPlan.title"
            class="w-full h-48 object-cover"
          />
          <span 
            :class="{
              'bg-purple-600 text-white': bonPlan.position === 'pub',
              'bg-cyan-500 text-white': bonPlan.position === 'bonplan',
              'bg-pink-500 text-white': bonPlan.position === 'evenement',
              'bg-blue-500 text-white': bonPlan.position === 'atelier'
            }"
            class="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold uppercase"
          >
            {{ 
              bonPlan.position === 'pub' ? '📢 Pub' :
              bonPlan.position === 'evenement' ? '🎉 Événement' :
              bonPlan.position === 'atelier' ? '🎨 Atelier' :
              '🏷️ Bon plan'
            }}
          </span>
          <span 
            v-if="bonPlan.featured"
            class="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold"
          >
            ⭐ En vedette
          </span>
        </div>

        <!-- Contenu -->
        <div class="p-4">
          <!-- Info boutique -->
          <div v-if="bonPlan.boutique" class="flex items-center gap-2 mb-3">
            <img 
              v-if="bonPlan.boutique.logo_shop"
              :src="bonPlan.boutique.logo_shop" 
              :alt="bonPlan.boutique.name_shop"
              class="w-8 h-8 rounded-full object-cover"
            />
            <span class="text-xs text-gray-500 font-medium">{{ bonPlan.boutique.name_shop }}</span>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ bonPlan.title }}</h3>
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ bonPlan.description }}</p>

          <div class="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
            <span v-if="bonPlan.start_date">📅 {{ new Date(bonPlan.start_date).toLocaleDateString('fr-FR') }}</span>
            <span v-if="bonPlan.code_promo" class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
              🎟️ {{ bonPlan.code_promo }}
            </span>
          </div>

          <button
            v-if="bonPlan.link_url"
            class="w-full bg-blue-800 text-white py-2 rounded-lg transition text-sm font-medium"
          >
            En savoir plus →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
