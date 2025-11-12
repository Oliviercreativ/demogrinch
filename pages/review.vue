<script setup>
import { ref } from 'vue'
import AppReviewSystem from '@/components/AppReviewSystem.vue'


definePageMeta({
  title: 'Avis sur Grinch',
  middleware: 'auth',
  showHeader: false,
  showFooter: false,
  showNavbar: false,
})

const showReviewModal = ref(false)

const handleReviewSubmitted = (review) => {
  console.log('Nouvel avis soumis:', review)
}

const openReviewModal = () => {
  showReviewModal.value = true
}

const closeReviewModal = () => {
  showReviewModal.value = false
}
</script>

<template>
  <div class="min-h-screen pb-24">
    <!-- Hero Section -->
    <div class="py-16 bg-blue-100">
      <div class="container mx-auto px-4 text-center">
        <div class="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold mb-4">Votre avis sur Grinch</h1>
        <p class="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Partagez votre expérience avec notre application de fidélité et aidez-nous à nous améliorer
        </p>

        <!-- Statistiques rapides -->
        <div class="bg-white bg-opacity-10 rounded-xl p-6 max-w-md mx-auto mb-8">
          <AppReviewStats :compact="true" />
        </div>

        <button @click="openReviewModal"
          class="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
          Laisser un avis
        </button>
      </div>
    </div>

    <!-- Contenu Principal -->
    <div class="container mx-auto px-4 py-12">
      <!-- Section Avis -->
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Qu'en pensent nos utilisateurs ?</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Découvrez les retours de la communauté Grinch et partagez votre propre expérience
          </p>
        </div>

        <!-- Composant principal d'avis -->
        <AppReviewSystem :as_modal="false" :show_existing_reviews="true" :max_reviews_display="8"
          @review-submitted="handleReviewSubmitted" />
      </div>
    </div>

    <!-- Modal d'avis -->
    <AppReviewSystem v-if="showReviewModal" :as_modal="true" :show_existing_reviews="false"
      @review-submitted="handleReviewSubmitted" @close-modal="closeReviewModal" />
  </div>
</template>