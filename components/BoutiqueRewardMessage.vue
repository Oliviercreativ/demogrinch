<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import confetti from 'canvas-confetti'
import { vibrate, VIBRATION_PATTERNS } from '@/utils/vibration'

const props = defineProps({
  boutiqueId: {
    type: String,
    required: true
  },
  boutiqueName: {
    type: String,
    required: true
  },
  pointsAdded: {
    type: Number,
    required: true
  },
  currentPoints: {
    type: Number,
    required: true
  },
  pendingReward: {
    type: Object,
    default: null
  },
  boutiqueSlug: {
    type: String,
    required: false,
    default: ''
  },
  customMessage1Point: {
    type: String,
    default: null
  },
  customMessageRecompense: {
    type: String,
    default: null
  },
  enableAutoMessages: {
    type: Boolean,
    default: false
  },
  boutiqueLimit: {
    type: [Number, String],
    default: null
  }
})

const route = useRoute()

// UUID de la boutique spécifique
const SPECIAL_BOUTIQUE_ID = 'a16d195c-bb59-4f5f-bec8-83cf85b9efc4'

// Vérifier si c'est Renault Conflans via l'URL
const isRenaultConflans = computed(() => route.query.boutique === 'renault-conflans')

// Vérifier si c'est la boutique spéciale
const isSpecialBoutique = computed(() => props.boutiqueId === SPECIAL_BOUTIQUE_ID)

// Fonction pour déclencher les confettis
function triggerConfetti() {
  console.log('🎉 Déclenchement des confettis pour Renault Conflans!')

  const duration = 3 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    // Confettis de chaque côté
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    })
  }, 250)
}

// Déclencher les confettis si c'est le premier point (solde = 1)
onMounted(() => {
  // 🎊 Confettis uniquement si new_solde === 1
  if (props.currentPoints === 1) {
    setTimeout(() => {
      triggerConfetti()
      vibrate(VIBRATION_PATTERNS.SUCCESS)
    }, 300)
  }
})

// Message à afficher
const currentMessage = computed(() => {
  const limit = props.boutiqueLimit ? parseInt(props.boutiqueLimit) : null

  // 1️⃣ Premier point
  if (props.currentPoints === 1) {
    // ✅ VÉRIFIER enableAutoMessages AVANT d'afficher le message
    if (!props.enableAutoMessages) {
      console.log('⚠️ Messages automatiques désactivés pour cette boutique')
      return null
    }
    
    if (!props.customMessage1Point) {
      console.log('⚠️ Aucun message personnalisé défini pour le 1er point')
      return null
    }

    return {
      icon: '🎉',
      title: 'Félicitations !',
      description: props.customMessage1Point,
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      textColor: 'text-yellow-700',
      titleColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      linkable: false
    }
  }

  // 🎊 Récompense atteinte
  if (limit && props.currentPoints === limit) {
    // ✅ VÉRIFIER enableAutoMessages AVANT d'afficher le message de récompense
    if (!props.enableAutoMessages) {
      console.log('⚠️ Messages automatiques désactivés pour cette boutique')
      return null
    }
    
    if (!props.customMessageRecompense) {
      console.log('⚠️ Aucun message personnalisé défini pour la récompense')
      return null
    }

    return {
      icon: '🎉',
      title: 'Récompense gagnée !',
      description: props.customMessageRecompense,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      titleColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      linkable: true
    }
  }

  return null
})

// Alias pour le template
const currentPoints = computed(() => props.currentPoints)
</script>

<template>
  <div v-if="currentMessage" class="w-full mt-8">
    <!-- Message cliquable vers /notifications -->
    <NuxtLink 
      v-if="currentMessage && currentMessage.linkable" 
      to="/notifications"
      :class="[
        'rounded-lg p-4 mb-4 flex items-center gap-3 cursor-pointer ',
        currentMessage.bgColor,
        currentMessage.borderColor,
        'border'
      ]"
    >
      <svg 
        class="w-6 h-6 flex-shrink-0" 
        :class="currentMessage.iconColor" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <div 
          class="font-semibold" 
          :class="currentMessage.titleColor"
        >
          {{ currentMessage.icon }} {{ currentMessage.title }}
        </div>
        <div 
          class="text-sm" 
          :class="currentMessage.textColor"
          v-html="currentMessage.description"
        />
      </div>
    </NuxtLink>

    <!-- Message non cliquable (goodies) -->
    <div 
      v-else-if="currentMessage"
      :class="[
        'rounded-lg p-4 mb-4 flex items-center gap-3',
        currentMessage.bgColor,
        currentMessage.borderColor,
        'border'
      ]"
    >
      <svg 
        class="w-6 h-6 flex-shrink-0" 
        :class="currentMessage.iconColor" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <div 
          class="font-semibold" 
          :class="currentMessage.titleColor"
        >
          {{ currentMessage.icon }} {{ currentMessage.title }}
        </div>
        <div 
          class="text-sm" 
          :class="currentMessage.textColor"
          v-html="currentMessage.description"
        />
      </div>
    </div>
  </div>
</template>

