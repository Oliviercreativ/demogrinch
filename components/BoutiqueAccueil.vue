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
  <div class="max-w-4xl mx-auto">
    <div class="mx-auto w-full">
      <div class="flex items-center justify-center w-full flex-col gap-2">
        <div class="flex justify-center items-center flex-col gap-5 w-full">
          <p class="font-normal text-blue-800 text-center text-balance">
            <span class="font-semibold">Bienvenue sur l'application de carte de fidélité de GRINCH</span><br>
            Pour profiter des avantages des commerçants partenaires, connectez-vous à votre compte ou inscrivez-vous et
            scannez le QRCODE de votre boutique préférée
          </p>
        </div>

        <div class="py-12">
          <h2 class="text-2xl md:text-3xl font-bold text-blue-800 text-center mb-12">
            Comment ça marche ?
          </h2>

          <!-- Steps Container - Carousel Nuxt -->
          <div class="relative">
            <!-- Carousel Container (visible sur mobile uniquement) -->
            <div class="relative overflow-hidden md:hidden px-12">
              <!-- Cards Container avec transition -->
              <div 
                class="flex transition-transform duration-300 ease-in-out"
                :style="{ transform: `translateX(-${currentStep * 100}%)` }"
              >
                <div 
                  v-for="(step, index) in steps" 
                  :key="index"
                  class="w-full flex-shrink-0 flex justify-center"
                >
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
              <button
                @click="prevStep"
                class="absolute left-2 top-1/2 -translate-y-1/2 bg-blue-800 text-white p-2 rounded-full shadow-lg hover:bg-blue-900 transition-colors z-20"
                aria-label="Étape précédente"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                @click="nextStep"
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-800 text-white p-2 rounded-full shadow-lg hover:bg-blue-900 transition-colors z-20"
                aria-label="Étape suivante"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Indicateurs de pagination (visible sur mobile uniquement) -->
            <div class="flex justify-center gap-2 mt-8 md:hidden">
              <button
                v-for="(step, index) in steps"
                :key="index"
                @click="goToStep(index)"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="currentStep === index ? 'bg-blue-800 w-8' : 'bg-blue-200'"
                :aria-label="`Aller à l'étape ${step.number}`"
              />
            </div>

            <!-- Affichage desktop en grid (visible sur MD+) -->
            <div class="hidden md:grid md:grid-cols-3 gap-8 relative">
              <!-- Ligne de connexion entre les étapes -->
              <div class="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-blue-200 -z-0">
              </div>

              <div 
                v-for="(step, index) in steps" 
                :key="index"
                class="relative flex flex-col items-center text-center"
              >
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

          <!-- Call to Action optionnel -->
          <div class="py-5 flex justify-center items-center flex-col gap-3 w-full">
            <button class="bg-blue-800 text-white px-6 py-3 rounded w-full">
              <NuxtLink to="/login" class="block w-full">Se connecter</NuxtLink>
            </button>
            <button class="font-medium text-md text-blue-800 border bg-white border-blue-800 rounded px-6 py-3 w-full">
              <NuxtLink to="/signup" class="block w-full">Créer un compte</NuxtLink>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <AdSidebar type="boutique" position="medium" />

    <div class="mx-auto w-full">
      <!-- Loader pendant chargement -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">{{ error }}</p>
      </div>

      <!-- Boutiques trouvées -->
      <div v-else-if="boutiques.length > 0" class="flex flex-col gap-4">
        <p class="text-lg uppercase text-blue-800 font-semibold text-center mb-4">
          Découvrez les dernières boutiques
        </p>
        <div v-for="boutique in boutiques" :key="boutique.slug" class="w-full">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="relative">
              <!-- Badge catégorie -->
              <div class="absolute top-2 left-2 bg-blue-800 text-white px-2 py-1 rounded text-xs font-semibold z-20">
                {{ boutique.categories_shop }}
              </div>
              <!-- Image -->
              <img :src="boutique.photo_url" :alt="boutique.name_shop" class="w-full h-40 object-cover">
              <!-- Overlay avec titre -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 z-10">
                <h3 class="text-white text-base font-semibold drop-shadow-lg">
                  {{ boutique.name_shop }}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aucune boutique -->
      <div v-else class="text-center py-12">
        <p class="text-gray-600">Aucune boutique disponible pour le moment.</p>
      </div>
    </div>
  </div>
</template>
