<script setup>
import { computed, toRefs } from 'vue'
// Props attendus depuis AppReviewSystem
const props = defineProps({
  show_existing_reviews: Boolean,
  totalReviews: Number,
  averageRating: Number,
  displayedReviews: Array,
  user: Object,
  hasUserReviewed: Boolean,
  reviewForm: Object,
  ratingStars: Array,
  isFormValid: Boolean,
  isSubmitting: Boolean,
  error: String,
  success: String,
  setRating: Function,
  setHoveredStar: Function,
  clearHover: Function,
  getStarClass: Function,
  getRatingStars: Function,
  submitReview: Function,
})
</script>

<template>
  <div class="space-y-6">
    <!-- Statistiques des avis -->
    <div v-if="props.show_existing_reviews && props.totalReviews > 0"
      class="text-center py-4 bg-blue-50 rounded-lg border border-green-100">
      <div class="flex items-center justify-center space-x-2 mb-2">
        <span class="text-3xl font-bold text-gray-900">{{ props.averageRating }}</span>
        <div class="flex space-x-1">
          <svg v-for="star in props.getRatingStars(Math.round(props.averageRating))" :key="star.index"
            xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
            :class="star.filled ? 'text-yellow-400 fill-current' : 'text-gray-300'" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
      </div>
      <p class="text-gray-700 font-medium">{{ props.totalReviews }} utilisateur{{ props.totalReviews > 1 ? 's ont donné leur' : ' a donné son' }} avis</p>
    </div>

    <!-- Formulaire de review (si pas déjà reviewé) -->
    <div v-if="props.user && !props.hasUserReviewed">
      <h3 class="text-lg font-semibold text-gray-900 mb-4"></h3>
      <!-- Sélection des étoiles -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Votre note globale</label>
        <div class="flex space-x-1">
          <button v-for="star in props.ratingStars" :key="star" @click="props.setRating(star)" @mouseenter="props.setHoveredStar(star)"
            @mouseleave="props.clearHover" class="focus:outline-none transition-all duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 cursor-pointer transform hover:scale-110"
              :class="props.getStarClass(star)" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
        <p v-if="props.reviewForm.rating > 0" class="text-sm text-gray-600 mt-1">
          {{ props.reviewForm.rating }} étoile{{ props.reviewForm.rating > 1 ? 's' : '' }} -
          {{ props.reviewForm.rating === 5 ? 'Excellent !' : props.reviewForm.rating === 4 ? 'Très bien' : props.reviewForm.rating === 3 ? 'Correct' : props.reviewForm.rating === 2 ? 'Peut mieux faire' : 'Décevant' }}
        </p>
      </div>
      <!-- Commentaire -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Votre commentaire</label>
        <textarea v-model="props.reviewForm.comment" rows="4"
          placeholder="Dites-nous ce qui vous plaît dans Grinch, ou comment nous pourrions nous améliorer..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-green-500 resize-none"></textarea>
        <p class="text-xs text-gray-500 mt-1">Minimum 10 caractères. Soyez constructif et respectueux.</p>
      </div>
      <!-- Option anonyme -->
      <div class="mb-4">
        <label class="flex items-center">
          <input v-model="props.reviewForm.is_anonymous" type="checkbox"
            class="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500">
          <span class="ml-2 text-sm text-gray-700">Publier cet avis de manière anonyme</span>
        </label>
      </div>
      <!-- Messages -->
      <div v-if="props.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
          <p class="text-red-800 text-sm">{{ props.error }}</p>
        </div>
      </div>
      <div v-if="props.success" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
          <p class="text-green-800 text-sm">{{ props.success }}</p>
        </div>
      </div>
      <!-- Bouton de soumission -->
      <button @click="props.submitReview" :disabled="!props.isFormValid || props.isSubmitting"
        class="w-full flex items-center justify-center px-4 py-3 bg-blue-800 text-white rounded-lg hover:from-green-700 hover:to-blue-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium">
        <svg v-if="props.isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ props.isSubmitting ? 'Publication en cours...' : 'Publier mon avis' }}
      </button>
    </div>
    <!-- Message si déjà reviewé -->
    <div v-else-if="props.user && props.hasUserReviewed" class="text-center py-8">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Merci pour votre avis !</h3>
      <p class="text-gray-600">Vous avez déjà évalué l'application Grinch. Votre retour nous aide à nous améliorer.</p>
    </div>
    <!-- Message si pas connecté -->
    <div v-else-if="!props.user" class="text-center py-8">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Connectez-vous pour évaluer</h3>
      <p class="text-gray-600 mb-4">Votre avis compte ! Connectez-vous pour partager votre expérience avec Grinch.</p>
      <NuxtLink to="/login"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors">
        Se connecter
      </NuxtLink>
    </div>
    <!-- Liste des avis existants -->
    <div v-if="props.show_existing_reviews && props.displayedReviews.length > 0" class="border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Ce que pensent nos utilisateurs</h3>
      <div class="space-y-4">
        <div v-for="review in props.displayedReviews" :key="review.id"
          class="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <!-- En-tête de l'avis -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <!-- ... (reste du contenu de l'avis) ... -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 