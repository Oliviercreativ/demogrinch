<!-- components/EnhancedLoader.vue -->
<template>

    <!-- Carte principale -->
    <div class="bg-white p-8 mb-6">
      <!-- Animation de chargement centrale -->
      <div class="flex justify-center mb-8">
        <div class="relative">
          <div class="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Titre principal -->
      <h2 class="text-2xl font-bold text-center text-blue-800 mb-6">
        {{ currentStepData.title }}
      </h2>

      <!-- Étapes -->
      <div class="space-y-4 mb-6">
        <div v-for="step in steps" :key="step.id"
          class="flex items-center space-x-3 p-3 rounded-lg transition-all duration-500"
          :class="getStepClasses(step.id)">
          <!-- Icône de l'étape -->
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
              :class="getIconClasses(step.id)">
              <svg v-if="step.id < currentStep" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else-if="step.id === currentStep" xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div v-else class="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>

          <!-- Texte de l'étape -->
          <div class="flex-1">
            <p class="font-medium text-gray-700">{{ step.text }}</p>
            <div v-if="step.id === currentStep && step.subtext" class="text-sm text-gray-500 mt-1">
              {{ step.subtext }}
            </div>
          </div>

          <!-- Badge spécial pour SMS -->
          <div v-if="step.id === 4 && currentStep >= 4 && showSMSNotification" class="flex-shrink-0">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              SMS envoyé
            </span>
          </div>
        </div>
      </div>

      <!-- Barre de progression -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out"
          :style="{ width: progressWidth + '%' }"></div>
      </div>
      <p class="text-center text-sm text-gray-600">{{ Math.round(progressWidth) }}% terminé</p>
    </div>

    <!-- Avertissement -->
    <div v-if="showWarning" class="bg-yellow-50 border border-gray-200 rounded-xl p-4 animate-pulse">
      <div class="flex items-start space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-yellow-800">Ne fermez pas cette page</p>
          <p class="text-xs text-yellow-700 mt-1">Le traitement est en cours, veuillez patienter...</p>
        </div>
      </div>
    </div>

    <!-- Messages de statut -->
    <div v-if="statusMessage" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <p class="text-sm text-blue-700 text-center">{{ statusMessage }}</p>
    </div>


</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  currentStep: {
    type: Number,
    default: 1
  },
  showSMSNotification: {
    type: Boolean,
    default: false
  },
  statusMessage: {
    type: String,
    default: ''
  }
})

// Données réactives
const showWarning = ref(false)
let warningTimeout = null

// Configuration des étapes
const steps = computed(() => [
  {
    id: 1,
    text: "Vérification de vos informations",
    subtext: "Validation de votre compte..."
  },
  {
    id: 2,
    text: "Contrôle de la boutique",
    subtext: "Vérification de l'emplacement..."
  },
  {
    id: 3,
    text: "Attribution des points",
    subtext: "Calcul de votre nouveau solde..."
  },
  {
    id: 4,
    text: props.showSMSNotification ? "Envoi des notifications" : "Finalisation",
    subtext: props.showSMSNotification ? "SMS en cours d'envoi..." : "Sauvegarde en cours..."
  }
])

// Données de l'étape actuelle
const currentStepData = computed(() => {
  const titles = [
    "Vérification en cours...",
    "Traitement de votre récompense...",
    "Attribution des points...",
    props.showSMSNotification ? "Envoi des notifications..." : "Finalisation..."
  ]
  return {
    title: titles[props.currentStep - 1] || "Traitement en cours..."
  }
})

// Calcul de la progression
const progressWidth = computed(() => {
  return (props.currentStep / steps.value.length) * 100
})

// Classes CSS pour les étapes
const getStepClasses = (stepId) => {
  if (stepId < props.currentStep) {
    return 'bg-green-50 border border-green-200'
  } else if (stepId === props.currentStep) {
    return 'bg-blue-50 border border-blue-200 ring-2 ring-blue-100'
  } else {
    return 'bg-gray-50'
  }
}

// Classes CSS pour les icônes
const getIconClasses = (stepId) => {
  if (stepId < props.currentStep) {
    return 'bg-green-500'
  } else if (stepId === props.currentStep) {
    return 'bg-blue-500'
  } else {
    return 'bg-gray-300'
  }
}

// Cycle de vie
onMounted(() => {
  // Afficher l'avertissement après 3 secondes
  warningTimeout = setTimeout(() => {
    showWarning.value = true
  }, 3000)
})

onUnmounted(() => {
  if (warningTimeout) {
    clearTimeout(warningTimeout)
  }
})
</script>

<style scoped>
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>