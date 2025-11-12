<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import AppReviewContent from './AppReviewContent.vue'

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
  },
  boutique_slug: {
    type: String,
    default: null
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
  return reviewForm.value.rating > 0 && reviewForm.value.comment.trim().length > 0
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
    error.value = 'Veuillez remplir tous les champs et donner une note'
    return
  }

  isSubmitting.value = true
  error.value = ''
  success.value = ''

  try {
    // Déterminer quelle table utiliser
    const tableName = props.boutique_slug ? 'reviews' : 'app_reviews'
    const entityType = props.boutique_slug ? 'cette boutique' : 'l\'application Grinch'

    // Vérifier si l'utilisateur n'a pas déjà laissé un avis
    let checkQuery = supabase
      .from(tableName)
      .select('id')
      .eq('user_id', user.value.id)

    // Si c'est un avis boutique, vérifier aussi le slug
    if (props.boutique_slug) {
      checkQuery = checkQuery.eq('boutique_slug', props.boutique_slug)
    }

    const { data: existingReview } = await checkQuery.single()

    if (existingReview) {
      error.value = `Vous avez déjà laissé un avis pour ${entityType}`
      return
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.value.id)
      .single()

    // Préparer les données à insérer
    const reviewData = {
      user_id: user.value.id,
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment.trim(),
      user_name: reviewForm.value.is_anonymous ? null : (profile?.full_name || 'Utilisateur'),
      is_anonymous: reviewForm.value.is_anonymous,
      created_at: new Date().toISOString()
    }

    // Ajouter boutique_slug si c'est un avis boutique
    if (props.boutique_slug) {
      reviewData.boutique_slug = props.boutique_slug
    }

    // Insérer la review
    const { data: newReview, error: insertError } = await supabase
      .from(tableName)
      .insert(reviewData)
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .single()

    if (insertError) throw insertError

    success.value = `Merci pour votre avis sur ${entityType} ! Votre retour nous aide à nous améliorer.`

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
    // Déterminer quelle table utiliser
    const tableName = props.boutique_slug ? 'reviews' : 'app_reviews'
    
    // Charger les reviews existantes
    let query = supabase
      .from(tableName)
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
    
    // Si c'est un avis boutique, filtrer par slug
    if (props.boutique_slug) {
      query = query.eq('boutique_slug', props.boutique_slug)
    }

    const { data: reviews, error: reviewsError } = await query

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
    // Déterminer quelle table utiliser
    const tableName = props.boutique_slug ? 'reviews' : 'app_reviews'
    
    let query = supabase
      .from(tableName)
      .select('rating')
    
    // Si c'est un avis boutique, filtrer par slug
    if (props.boutique_slug) {
      query = query.eq('boutique_slug', props.boutique_slug)
    }

    const { data, error } = await query

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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-normal text-gray-900">Notez notre plateforme de fidélité</h2>
            <p class="text-sm text-gray-600">Votre avis compte</p>
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
        <AppReviewContent
          :show_existing_reviews="props.show_existing_reviews"
          :total-reviews="totalReviews"
          :average-rating="averageRating"
          :displayed-reviews="displayedReviews"
          :user="user"
          :has-user-reviewed="hasUserReviewed"
          :review-form="reviewForm"
          :rating-stars="ratingStars"
          :is-form-valid="isFormValid"
          :is-submitting="isSubmitting"
          :error="error"
          :success="success"
          :set-rating="setRating"
          :set-hovered-star="setHoveredStar"
          :clear-hover="clearHover"
          :get-star-class="getStarClass"
          :get-rating-stars="getRatingStars"
          :submit-review="submitReview"
        />
      </div>
    </div>
  </div>

  <!-- Version Bloc -->
  <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center space-x-3 mb-6">
      <div class="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Avis sur Grinch</h2>
        <p class="text-gray-600">Partagez votre expérience avec notre application</p>
      </div>
    </div>
    <AppReviewContent
      :show_existing_reviews="props.show_existing_reviews"
      :total-reviews="totalReviews"
      :average-rating="averageRating"
      :displayed-reviews="displayedReviews"
      :user="user"
      :has-user-reviewed="hasUserReviewed"
      :review-form="reviewForm"
      :rating-stars="ratingStars"
      :is-form-valid="isFormValid"
      :is-submitting="isSubmitting"
      :error="error"
      :success="success"
      :set-rating="setRating"
      :set-hovered-star="setHoveredStar"
      :clear-hover="clearHover"
      :get-star-class="getStarClass"
      :get-rating-stars="getRatingStars"
      :submit-review="submitReview"
    />
  </div>
</template>