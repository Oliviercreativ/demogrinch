<script setup>
import { computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  banner: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  },
  trackViews: {
    type: Boolean,
    default: true
  },
  trackClicks: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-active', 'click'])
const supabase = useSupabaseClient()

const getBadgeClass = (position) => {
  const classes = {
    'pub': 'bg-purple-600 text-white',
    'bonplan': 'bg-cyan-500 text-white',
    'evenement': 'bg-pink-500 text-white',
    'atelier': 'bg-blue-500 text-white',
    'grid': 'bg-gray-600 text-white',
    'creativcard': 'bg-indigo-600 text-white'
  }
  return classes[position] || 'bg-gray-500 text-white'
}

const getBadgeText = (position) => {
  const texts = {
    'pub': '📢 Pub',
    'evenement': '🎉 Événement',
    'atelier': '🎨 Atelier',
    'bonplan': '🏷️ Bon plan',
    'grid': '📋 Grille',
    'creativcard': '💳 Creativcard'
  }
  return texts[position] || '🏷️ Bon plan'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const isActive = computed(() => {
  if (!props.banner.active) return false
  const now = new Date()
  const startDate = props.banner.start_date ? new Date(props.banner.start_date) : null
  const endDate = props.banner.end_date ? new Date(props.banner.end_date) : null
  
  if (startDate && now < startDate) return false
  if (endDate && now > endDate) return false
  return true
})

const trackView = async () => {
  if (!props.trackViews || !props.banner) return
  try {
    await supabase
      .from('banners')
      .update({ views: (props.banner.views || 0) + 1 })
      .eq('id', props.banner.id)
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des vues:', error)
  }
}

const trackClick = async () => {
  if (!props.trackClicks || !props.banner) return
  try {
    await supabase
      .from('banners')
      .update({ clicks: (props.banner.clicks || 0) + 1 })
      .eq('id', props.banner.id)
  } catch (error) {
    console.error('Erreur lors de l\'incrémentation des clics:', error)
  }
}

const handleClick = async () => {
  await trackClick()
  emit('click', props.banner)
  
  if (props.banner.link_url) {
    if (props.banner.link_url.startsWith('/')) {
      navigateTo(props.banner.link_url)
    } else {
      window.open(props.banner.link_url, '_blank')
    }
  }
}

// Suivi des vues au montage
onMounted(async () => {
  await trackView()
})
</script>

<template>
  <div 
    class="bg-white rounded-lg shadow transition p-6 flex flex-col gap-4 hover:shadow-lg"
    :class="{ 'opacity-60': !isActive }"
  >
    <!-- Image ou Vidéo -->
    <div v-if="banner.image_url || banner.video_url" class="relative">
      <img 
        v-if="banner.image_url"
        :src="banner.image_url" 
        :alt="banner.title"
        class="w-full h-48 object-cover rounded-lg"
      />
      <video 
        v-else-if="banner.video_url"
        :src="banner.video_url"
        class="w-full h-48 object-cover rounded-lg"
        controls
      />
      
      <!-- Badge position -->
      <span 
        v-if="banner.position"
        :class="getBadgeClass(banner.position)"
        class="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold uppercase"
      >
        {{ getBadgeText(banner.position) }}
      </span>
      
      <!-- Badge featured -->
      <span 
        v-if="banner.featured"
        class="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold"
      >
        ⭐ En vedette
      </span>
      
      <!-- Badge promo -->
      <span 
        v-if="banner.Promo || banner['Montant de la promo']"
        class="absolute bottom-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold"
      >
        {{ banner.Promo || `-${banner['Montant de la promo']}` }}
      </span>
    </div>

    <!-- Contenu -->
    <div class="flex-1">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-gray-800">{{ banner.title }}</h3>
          <p v-if="banner.description" class="text-gray-600 text-sm mt-1 line-clamp-2">
            {{ banner.description }}
          </p>
          <p v-if="banner.company_name" class="text-gray-500 text-xs mt-1 font-medium">
            {{ banner.company_name }}
          </p>
        </div>
        <div class="flex items-center gap-2 ml-4">
          <span 
            :class="isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          >
            {{ isActive ? 'Actif' : 'Inactif' }}
          </span>
        </div>
      </div>

      <!-- Informations supplémentaires -->
      <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
        <span v-if="banner.start_date">📅 Du {{ formatDate(banner.start_date) }}</span>
        <span v-if="banner.end_date">au {{ formatDate(banner.end_date) }}</span>
        <span v-if="banner.code_promo" class="text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
          🎟️ {{ banner.code_promo }}
        </span>
        <span v-if="banner.size" class="text-gray-400 capitalize">
          📏 {{ banner.size }}
        </span>
      </div>

      <!-- Statistiques -->
      <div class="flex items-center gap-4 text-xs text-gray-400 mb-3">
        <span>👁️ {{ banner.views || 0 }} vues</span>
        <span>🔗 {{ banner.clicks || 0 }} clics</span>
      </div>

      <!-- Bouton d'action -->
      <button
        v-if="banner.link_url"
        @click="handleClick"
        class="w-full bg-blue-800 text-white py-2 rounded-lg transition hover:bg-blue-900 text-sm font-medium"
      >
        En savoir plus →
      </button>

      <!-- Actions admin -->
      <div v-if="showActions" class="flex gap-2 mt-3 pt-3 border-t">
        <button 
          @click="emit('edit', banner)"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ✏️ Modifier
        </button>
        <button 
          @click="emit('toggle-active', banner)"
          class="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          {{ banner.active ? '🔴 Désactiver' : '🟢 Activer' }}
        </button>
        <button 
          @click="emit('delete', banner.id)"
          class="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          🗑️ Supprimer
        </button>
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

