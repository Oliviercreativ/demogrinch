<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

// 🎯 Props pour spécifier la boutique
const props = defineProps({
  shopSlug: {
    type: String,
    required: true
  },
  showDetails: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

// 🔔 Événements émis
const emit = defineEmits(['card-loaded', 'card-not-found', 'reward-won'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const reward = ref(null)
const boutique = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchShopLoyaltyCard = async () => {
  if (!user.value?.id) {
    error.value = 'Utilisateur non connecté'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null

    // Récupérer la dernière récompense de l'utilisateur pour cette boutique
    const { data: rewardData, error: rewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', user.value.id)
      .eq('store_slug', props.shopSlug)
      .eq('is_read', false)
      .order('hit_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rewardError) {
      console.error('Erreur récupération reward:', rewardError)
      error.value = 'Erreur lors du chargement de la carte'
      emit('card-not-found')
      return
    }
    reward.value = rewardData

    // Récupérer les détails de la boutique
    const { data: boutiqueData, error: boutiqueError } = await supabase
      .from('boutique')
      .select('*')
      .eq('slug', props.shopSlug)
      .single()

    if (boutiqueError) {
      console.error('Erreur récupération boutique:', boutiqueError)
      error.value = 'Erreur lors du chargement des détails de la boutique'
      return
    }

    boutique.value = boutiqueData

    // Émettre événements
    emit('card-loaded', { reward: reward.value, boutique: boutique.value })

    if (isRewardWon.value) {
      emit('reward-won', { reward: reward.value, boutique: boutique.value })
    }

  } catch (err) {
    console.error('Erreur inattendue:', err)
    error.value = 'Erreur inattendue'
  } finally {
    loading.value = false
  }
}

// 🔄 Recharger si le shop_slug change
watch(() => props.shopSlug, () => {
  fetchShopLoyaltyCard()
})

// Calculé : Progression en pourcentage
const progressPercentage = computed(() => {
  if (!reward.value || !boutique.value) return 0
  const percentage = (reward.value.new_solde / boutique.value.limite) * 100
  return Math.min(percentage, 100)
})

// Calculé : Plus qu'une visite
const isOneVisitAway = computed(() => {
  if (!reward.value || !boutique.value) return false
  return boutique.value.limite - reward.value.new_solde === 1
})

// Calculé : Récompense gagnée
const isRewardWon = computed(() => {
  if (!reward.value || !boutique.value) return false
  return reward.value.new_solde >= boutique.value.limite && !reward.value.is_used
})

// Calculé : Récompense déjà utilisée
const isRewardUsed = computed(() => {
  return reward.value?.is_used || false
})

// Classes dynamiques
const cardClass = computed(() => {
  if (props.compact) {
    return isRewardWon.value
      ? 'grid grid-cols-2 h-[100px] bg-blue-800 rounded-lg shadow'
      : 'grid grid-cols-2 h-[100px] bg-white rounded-lg shadow'
  }

  if (isOneVisitAway.value) {
    return 'grid grid-cols-2 h-[150px] bg-white rounded-lg border-2 border-blue-800'
  }
  if (isRewardWon.value) {
    return 'grid grid-cols-2 h-[150px] bg-blue-800 rounded-lg'
  }
  return 'grid grid-cols-2 h-[150px] bg-white rounded-lg shadow'
})

const titleClass = computed(() => {
  return isRewardWon.value
    ? 'text-lg text-white font-semibold'
    : 'text-lg text-blue-800 font-semibold'
})

const progressTextClass = computed(() => {
  return isRewardWon.value
    ? 'text-gray-100 text-xs'
    : 'text-gray-500 text-xs'
})

const progressBarClass = computed(() => {
  return isRewardWon.value
    ? 'bg-white h-2.5 rounded-full transition-all duration-500'
    : 'bg-blue-800 h-2.5 rounded-full transition-all duration-500'
})

const messageClass = computed(() => {
  return isRewardWon.value
    ? 'text-gray-100 text-xs mt-1 font-medium'
    : 'text-gray-500 text-xs mt-1'
})

onMounted(() => {
  fetchShopLoyaltyCard()
})
</script>

<template>
  <div class="w-full">
    <!-- Chargement -->
    <div v-if="loading" class="flex justify-center items-center h-[150px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
    </div>

    <!-- Carte de fidélité -->
    <div v-else-if="reward && boutique">
      <NuxtLink :to="`/reward/${reward.rewardSlug}`">
        <div :class="cardClass">
          <!-- Image boutique -->
          <div class="w-full relative overflow-hidden">
            <img
              v-if="boutique.photo_url"
              :src="boutique.photo_url"
              :alt="boutique.name_shop"
              class="absolute inset-0 w-full object-cover rounded-lg h-full z-10"
            />
            <div
              v-else
              class="absolute inset-0 w-full bg-gray-200 flex items-center justify-center rounded-lg"
            >
              <span class="text-gray-400 text-4xl">🏪</span>
            </div>
          </div>

          <!-- Détails -->
          <div class="flex-auto px-5 py-3 flex flex-col justify-center">
            <div class="flex flex-col space-y-2">
              <!-- Nom boutique -->
              <p :class="titleClass">{{ boutique.name_shop }}</p>

              <!-- Progression -->
              <p v-if="showDetails" :class="progressTextClass">
                {{ reward.new_solde }} / {{ boutique.limite }} points
              </p>

              <!-- Barre de progression -->
              <div v-if="showDetails" class="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  :class="progressBarClass"
                  :style="{ width: `${progressPercentage}%` }"
                ></div>
              </div>

              <!-- Messages -->
              <div v-if="showDetails">
                <p v-if="isOneVisitAway" :class="messageClass">
                  ✨ Plus qu'une visite pour votre récompense !
                </p>
                <p v-else-if="isRewardWon" :class="messageClass">
                  🎉 Félicitations, récompense gagnée !
                </p>
                <p v-else-if="isRewardUsed" :class="messageClass">
                  ✅ Récompense déjà utilisée
                </p>
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
