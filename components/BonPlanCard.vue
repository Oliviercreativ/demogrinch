<script setup>
const props = defineProps({
  bonPlan: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-active'])

const getBadgeClass = (position) => {
  const classes = {
    'pub': 'bg-purple-600 text-white',
    'bonplan': 'bg-orange-500 text-white',
    'evenement': 'bg-pink-500 text-white',
    'atelier': 'bg-blue-500 text-white'
  }
  return classes[position] || 'bg-gray-500 text-white'
}

const getBadgeText = (position) => {
  const texts = {
    'pub': '📢 Pub',
    'evenement': '🎉 Événement',
    'atelier': '🎨 Atelier',
    'bonplan': '🏷️ Bon plan'
  }
  return texts[position] || '🏷️ Bon plan'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col gap-4">
    <!-- Image -->
    <div v-if="bonPlan.image_url" class="relative">
      <img 
        :src="bonPlan.image_url" 
        :alt="bonPlan.title"
        class="w-full h-48 object-cover rounded-lg"
      />
      <span 
        :class="getBadgeClass(bonPlan.position)"
        class="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg"
      >
        {{ getBadgeText(bonPlan.position) }}
      </span>
    </div>

    <!-- Contenu -->
    <div class="flex-1">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-gray-800">{{ bonPlan.title }}</h3>
          <p class="text-gray-600 text-sm mt-1">
            {{ bonPlan.description }}
          </p>
        </div>
        <div class="flex items-center gap-2 ml-4">
          <span 
            :class="bonPlan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          >
            {{ bonPlan.active ? 'Actif' : 'Inactif' }}
          </span>
          <span 
            v-if="bonPlan.featured"
            class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          >
            ⭐ En avant
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
        <span v-if="bonPlan.start_date">📅 Du {{ formatDate(bonPlan.start_date) }}</span>
        <span v-if="bonPlan.end_date">au {{ formatDate(bonPlan.end_date) }}</span>
        <span v-if="bonPlan.code_promo" class="text-blue-600 font-medium">🎟️ {{ bonPlan.code_promo }}</span>
        <span class="text-gray-400">👁️ {{ bonPlan.views || 0 }} vues</span>
        <span class="text-gray-400">🔗 {{ bonPlan.clicks || 0 }} clics</span>
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="flex gap-2">
        <button 
          @click="emit('edit', bonPlan)"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ✏️ Modifier
        </button>
        <button 
          @click="emit('toggle-active', bonPlan)"
          class="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          {{ bonPlan.active ? '🔴 Désactiver' : '🟢 Activer' }}
        </button>
        <button 
          @click="emit('delete', bonPlan.id)"
          class="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  </div>
</template>

