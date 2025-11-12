<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import AdSidebar from '@/components/AdSidebar.vue'

const boutiques = ref([])
const loading = ref(true)
const error = ref(null)
const currentStep = ref(0)

const supabase = useSupabaseClient()

// Données des étapes
const steps = ref([
  {
    number: 1,
    title: "Créez votre compte en quelques secondes",
    description: "Connectez-vous facilement avec votre compte Google, Spotify ou Facebook. Aucune inscription longue, juste quelques clics pour commencer à profiter des avantages."
  },
  {
    number: 2,
    title: "Scannez le QR code de votre boutique",
    description: "Trouvez le QR code affiché dans votre boutique préférée et scannez-le depuis l'application. C'est instantané et vous gagnez immédiatement des points !"
  },
  {
    number: 3,
    title: "Cumulez des points à chaque visite",
    description: "Chaque scan vous fait gagner des points de fidélité. Plus vous visitez vos boutiques favorites, plus vous accumulez de points pour vos récompenses."
  },
  {
    number: 4,
    title: "Profitez de vos récompenses",
    description: "Une fois votre objectif de points atteint, présentez votre récompense directement en boutique et profitez de vos avantages exclusifs."
  }
])

const totalSteps = computed(() => steps.value.length)

const nextStep = () => {
  if (currentStep.value < totalSteps.value - 1) {
    currentStep.value++
  } else {
    currentStep.value = 0 // Retour au début
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  } else {
    currentStep.value = totalSteps.value - 1 // Aller à la fin
  }
}

const goToStep = (index) => {
  currentStep.value = index
}

const fetchBoutiques = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', true)
      .order('created_at', { ascending: false })
      .limit(5) // Limiter à 5 boutiques

    if (fetchError) throw fetchError

    boutiques.value = data
  } catch (err) {
    console.error('Erreur lors de la récupération des boutiques:', err)
    error.value = 'Erreur lors de la récupération des boutiques : ' + err.message
  } finally {
    loading.value = false
  }
}
onMounted(fetchBoutiques)
</script>

<template>
  <div class="container mx-auto overflow-x-hidden">
    <div class="mx-auto w-full">
      <div class="flex items-stretch justify-between w-full flex-col gap-2">

        <div class="flex justify-center items-center flex-col gap-5 w-full h-full">
          <h2 class="text-2xl md:text-3xl font-bold text-blue-800 text-center mb-12">
            Comment ça marche ?
          </h2>

          <!-- Steps Container - Carousel Nuxt -->
          <div class="relative">
            <!-- Carousel Container (visible sur mobile uniquement) -->
            <div class="relative overflow-hidden">
              <!-- Cards Container avec transition -->
              <div class="flex transition-transform duration-300 ease-in-out"
                :style="{ transform: `translateX(-${currentStep * 100}%)` }">
                <div v-for="(step, index) in steps" :key="index" class="w-full flex-shrink-0 flex justify-center px-12">
                  <div class="relative flex flex-col items-center text-center w-full max-w-md">
                    <div
                      class="w-12 h-12 bg-blue-800 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 relative z-10">
                      {{ step.number }}
                    </div>
                    <h3 class="text-xl font-semibold text-blue-800 mb-2">
                      {{ step.title }}
                    </h3>
                    <p class="text-gray-600">
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Boutons de navigation -->
              <button @click="prevStep"
                class="absolute left-2 top-1/2 -translate-y-1/2 bg-blue-800 text-white p-2 rounded-full hover:bg-blue-900 transition-colors z-20"
                aria-label="Étape précédente">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button @click="nextStep"
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-800 text-white p-2 rounded-full hover:bg-blue-900 transition-colors z-20"
                aria-label="Étape suivante">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Indicateurs de pagination (visible sur mobile uniquement) -->
            <div class="flex justify-center gap-2 mt-8 md:hidden">
              <button v-for="(step, index) in steps" :key="index" @click="goToStep(index)"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="currentStep === index ? 'bg-blue-800 w-8' : 'bg-blue-200'"
                :aria-label="`Aller à l'étape ${step.number}`" />
            </div>
          </div>
        </div>

        <!-- Call to Action optionnel -->
        <div class="p-5 flex justify-center items-center flex-col gap-3 w-full absolute bottom-0 left-0 right-0">
          <p class="font-normal text-blue-800 text-center text-balance text-sm">
            Pour profiter des avantages des commerçants partenaires, connectez-vous à votre compte ou inscrivez-vous
          </p>
          <button class="bg-blue-800 text-white px-6 py-3 rounded-lg w-full">
            <NuxtLink to="/login" class="block w-full">Se connecter</NuxtLink>
          </button>
          <button class="bg-white border border-blue-800 text-blue-800 px-6 py-3 rounded-lg w-full">
            <NuxtLink to="/signup" class="block w-full">Créer un compte</NuxtLink>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
