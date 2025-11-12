<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const props = defineProps({
  as_modal: {
    type: Boolean,
    default: false
  },
  show_existing_reviews: {
    type: Boolean,
    default: true
  },
  max_reviews_display: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['review-submitted', 'close-modal'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// États
const isSubmitting = ref(false)
const hasUserReviewed = ref(false)
const existingReviews = ref([])
const averageRating = ref(0)
const totalReviews = ref(0)
const isLoading = ref(true)
const error = ref('')
const success = ref('')

// Formulaire de review
const reviewForm = ref({
  rating: 0,
  comment: '',
  is_anonymous: false
})

// États UI
const hoveredStar = ref(0)

// Computed
const displayedReviews = computed(() => {
  return existingReviews.value.slice(0, props.max_reviews_display)
})

const isFormValid = computed(() => {
  return reviewForm.value.rating > 0 && reviewForm.value.comment.trim().length >= 10
})

const ratingStars = computed(() => {
  return Array.from({ length: 5 }, (_, i) => i + 1)
})

// Méthodes
const setRating = (rating) => {
  reviewForm.value.rating = rating
  error.value = ''
}

const setHoveredStar = (star) => {
  hoveredStar.value = star
}

const clearHover = () => {
  hoveredStar.value = 0
}

const getStarClass = (star) => {
  const isActive = star <= (hoveredStar.value || reviewForm.value.rating)
  return isActive
    ? 'text-yellow-400 fill-current'
    : 'text-gray-300'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'il y a 1 jour'
  if (diffDays < 7) return `il y a ${diffDays} jours`
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaine(s)`
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`
  return `il y a ${Math.floor(diffDays / 365)} an(s)`
}

const getRatingStars = (rating) => {
  return Array.from({ length: 5 }, (_, i) => ({
    filled: i < rating,
    index: i + 1
  }))
}

const submitReview = async () => {
  if (!user.value) {
    error.value = 'Vous devez être connecté pour laisser un avis'
    return
  }

  if (!isFormValid.value) {
    error.value = 'Veuillez remplir tous les champs et donner une note (minimum 10 caractères pour le commentaire)'
    return
  }

  isSubmitting.value = true
  error.value = ''
  success.value = ''

  try {
    // Vérifier si l'utilisateur n'a pas déjà laissé un avis
    const { data: existingReview } = await supabase
      .from('app_reviews')
      .select('id')
      .eq('user_id', user.value.id)
      .single()

    if (existingReview) {
      error.value = 'Vous avez déjà laissé un avis pour l\'application Grinch'
      return
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.value.id)
      .single()

    // Insérer la review
    const { data: newReview, error: insertError } = await supabase
      .from('app_reviews')
      .insert({
        user_id: user.value.id,
        rating: reviewForm.value.rating,
        comment: reviewForm.value.comment.trim(),
        user_name: reviewForm.value.is_anonymous ? null : (profile?.full_name || 'Utilisateur'),
        is_anonymous: reviewForm.value.is_anonymous,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) throw insertError

    success.value = 'Merci pour votre avis sur l\'application Grinch ! Votre retour nous aide à nous améliorer.'

    // Réinitialiser le formulaire
    reviewForm.value = {
      rating: 0,
      comment: '',
      is_anonymous: false
    }

    // Ajouter la nouvelle review à la liste
    const formattedReview = {
      ...newReview,
      user_name: reviewForm.value.is_anonymous ? null : (profile?.full_name || 'Utilisateur')
    }
    existingReviews.value.unshift(formattedReview)
    hasUserReviewed.value = true

    // Recalculer les moyennes
    await calculateAverageRating()

    // Émettre l'événement
    emit('review-submitted', formattedReview)

    // Fermer le modal si nécessaire
    if (props.as_modal) {
      setTimeout(() => {
        emit('close-modal')
      }, 2000)
    }

  } catch (err) {
    console.error('Erreur lors de la soumission de l\'avis:', err)
    error.value = 'Une erreur est survenue lors de la publication de votre avis'
  } finally {
    isSubmitting.value = false
  }
}

const loadReviews = async () => {
  try {
    // Charger les reviews existantes de l'application
    const { data: reviews, error: reviewsError } = await supabase
      .from('app_reviews')
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (reviewsError) throw reviewsError

    existingReviews.value = reviews || []

    // Vérifier si l'utilisateur connecté a déjà laissé un avis
    if (user.value) {
      hasUserReviewed.value = reviews.some(review => review.user_id === user.value.id)
    }

    await calculateAverageRating()

  } catch (err) {
    console.error('Erreur lors du chargement des avis:', err)
    error.value = 'Erreur lors du chargement des avis'
  }
}

const calculateAverageRating = async () => {
  try {
    const { data, error } = await supabase
      .from('app_reviews')
      .select('rating')

    if (error) throw error

    totalReviews.value = data.length

    if (data.length > 0) {
      const sum = data.reduce((acc, review) => acc + review.rating, 0)
      averageRating.value = (sum / data.length).toFixed(1)
    } else {
      averageRating.value = 0
    }
  } catch (err) {
    console.error('Erreur lors du calcul de la moyenne:', err)
  }
}

const closeModal = () => {
  emit('close-modal')
}

// Lifecycle
onMounted(async () => {
  await loadReviews()
  isLoading.value = false
})
</script>

<template>
  <!-- Version Modal -->
  <div v-if="as_modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-normal text-gray-900">Notez notre plateforme de fidélité</h2>
            <p class="text-sm text-gray-600">Votre avis sur l'application de fidélité</p>
          </div>
        </div>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Contenu Modal -->
      <div class="p-6">
        <ReviewContent />
      </div>
    </div>
  </div>

  <!-- Version Bloc -->
  <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center space-x-3 mb-6">
      <div class="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Avis sur Grinch</h2>
        <p class="text-gray-600">Partagez votre expérience avec notre application</p>
      </div>
    </div>
    <ReviewContent />
  </div>
</template>

<!-- Le bloc <template #ReviewContent> et son contenu ont été supprimés ici -->

<style scoped>
/* Animations personnalisées pour les étoiles */
.star-hover {
  transition: transform 0.2s ease-in-out;
}

.star-hover:hover {
  transform: scale(1.1);
}

/* Animation pour le modal */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-enter {
  animation: modalFadeIn 0.3s ease-out;
}

/* Animation pour le chargement */
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Personnalisation des scrollbars pour le modal */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Amélioration du focus pour l'accessibilité */
.focus-ring:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Animation pour les nouveaux avis */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.new-review {
  animation: slideInFromTop 0.5s ease-out;
}

/* Responsive improvements */
@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .star-rating {
    justify-content: center;
  }

  .review-form {
    padding: 1rem;
  }
}

/* Dark mode support (optionnel) */
@media (prefers-color-scheme: dark) {
  .bg-white {
    background-color: #1f2937;
  }

  .text-gray-900 {
    color: #f9fafb;
  }

  .text-gray-700 {
    color: #d1d5db;
  }

  .text-gray-600 {
    color: #9ca3af;
  }

  .border-gray-200 {
    border-color: #374151;
  }

  .bg-gray-50 {
    background-color: #374151;
  }
}
</style>