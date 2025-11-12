<script setup>
  import { computed } from 'vue'
  import Loader from '@/components/Loader.vue'

  const props = defineProps({
    isLoading: Boolean,
    error: String,
    reward: Object,
    shop: Object,
    formatDate: Function
  })

  const progressPercentage = computed(() => {
    if (props.reward && props.shop) {
      return (props.reward.new_solde / props.shop.limite) * 100
    }
    return 0
  })

  const encouragementMessage = computed(() => {
    if (!props.reward || !props.shop) return ''

    const remaining = props.shop.limite - props.reward.new_solde
    const percentage = (props.reward.new_solde / props.shop.limite) * 100

    if (percentage === 100) {
      return `Félicitations ! Vous avez atteint votre objectif. Profitez de votre avantage : ${props.shop.lot} !`
    } else if (percentage >= 90) {
      return `Encore un achat pour profiter votre avantage.`
    } else if (percentage >= 75) {
      return `Vous y êtes presque ! Plus que ${remaining} achat${remaining > 1 ? 's' : ''} pour obtenir votre avantage.`
    } else if (percentage >= 50) {
      return `Vous avez dépassé la moitié ! Continuez comme ça, il ne vous reste que ${remaining} achats.`
    } else if (percentage >= 25) {
      return `Bon début ! Vous êtes à ${Math.round(percentage)}% de votre objectif.`
    } else {
      return `C'est parti ! Chaque achat vous rapproche de votre avantage.`
    }
  })
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center">
    <slot name="loader">
      <Loader />
    </slot>
  </div>
  <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 py-3 rounded relative" role="alert">
    <strong class="font-bold">Erreur :</strong>
    <span class="block sm:inline">{{ error }}</span>
  </div>
  <div v-else-if="!reward" class="text-center text-gray-600">
    <slot name="no-reward">
      Aucun avantage trouvé pour cette boutique.
    </slot>
  </div>
  <div v-else class="w-full">
    <div class="text-white rounded-lg p-2 mb-2">
      <div class="flex items-center gap-4">
        <p class="text-blue-800 font-normal font-sm">{{ encouragementMessage }}</p>
      </div>
    </div>
    <div class="w-full bg-white shadow-md rounded-lg">
      <div class="p-4 rounded-lg flex flex-col gap-5">
        <div>
          <p class="text-blue-800 mt-2 font-bold uppercase">Votre avantage</p>
          <p class="text-blue-800">{{ shop.lot }} pour {{ shop.limite }} achats en caisse</p>
        </div>
        <div>
          <p class="text-blue-800 mt-2 font-bold uppercase">Solde actuel : {{ reward.new_solde }} sur {{ shop.limite }}</p>
          <p class="text-sm text-gray-600 mt-1">Mis à jour le {{ formatDate(reward.hit_date) }}</p>
          <div class="w-full bg-gray-300 rounded-full h-2.5 mt-3">
            <div class="bg-blue-800 h-2.5 rounded-full" :style="{ width: `${progressPercentage}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>