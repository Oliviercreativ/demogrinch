<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  rewards: {
    type: Array,
    required: true
  }
});

const searchQuery = ref('');

const filteredRewards = computed(() => {
  if (!searchQuery.value) return props.rewards;
  
  const searchLower = searchQuery.value.toLowerCase();
  return props.rewards.filter(reward => 
    reward.boutique.name_shop.toLowerCase().includes(searchLower) ||
    reward.boutique.categories_shop.toLowerCase().includes(searchLower)
  );
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};
</script>

<template>
  <div>
    <div class="pb-4">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Rechercher une boutique..." 
        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
    </div>

    <div v-for="reward in filteredRewards" :key="reward.id">
      <NuxtLink :to="`/shop/${reward.boutique.slug}`">
        <div class="grid grid-cols-2 h-[150px] mb-4 bg-white rounded-lg">
          <div class="w-full relative overflow-hidden">
            <img :src="reward.boutique.photo_url" :alt="reward.boutique.name_shop" class="absolute inset-0 w-full object-cover rounded-lg h-[150px]" />
          </div>
          <div class="flex-auto px-5 py-3 items-center justify-start">
            <div class="flex flex-col">
              <p class="flex-auto text-lg text-blue-800 font-semibold">{{ reward.boutique.name_shop }}</p>
              <p class="text-gray-500 text-xs">{{ reward.new_solde }} sur {{ reward.boutique.limite }}</p>
              <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div class="bg-blue-800 h-2.5 rounded-full" :style="{ width: `${(reward.new_solde / reward.boutique.limite) * 100}%` }"></div>
              </div>
              <p v-if="reward.boutique.limite - reward.new_solde === 1" class="text-gray-500 text-xs mt-1">
                Plus qu'une visite pour obtenir votre récompense !
              </p>
              <p v-if="reward.new_solde >= reward.boutique.limite" class="text-gray-500 text-xs mt-1">
                Félicitations, c'est gagné, {{ reward.boutique.lot }}
              </p>
              <p class="text-gray-500 text-xs mt-1">
                Dernière mise à jour : {{ formatDate(reward.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
    <div v-if="filteredRewards.length === 0" class="text-center text-gray-500 mt-4">
      Aucun historique de récompenses trouvé pour cette recherche.
    </div>
  </div>
</template>