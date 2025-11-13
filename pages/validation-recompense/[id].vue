<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import Loader from '@/components/Loader.vue'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const rewardId = route.params.id
const isLoading = ref(true)
const error = ref(null)
const reward = ref(null)
const boutique = ref(null)
const userProfile = ref(null)
const isOwner = ref(false)
const validationSuccess = ref(false)
const validationError = ref(null)

// Vérifier si l'utilisateur est connecté et est propriétaire de la boutique
const checkOwnership = async () => {
  if (!user.value) {
    error.value = "Vous devez être connecté pour accéder à cette page."
    isLoading.value = false
    return false
  }

  try {
    // Récupérer les informations de la récompense
    const { data: rewardData, error: rewardError } = await supabase
      .from('reward')
      .select(`*, profiles:user_uid_reward (id, full_name, tel)`)
      .eq('id', rewardId)
      .single()

    if (rewardError) throw rewardError
    if (!rewardData) throw new Error("Récompense introuvable")
    
    reward.value = rewardData

    // Récupérer les informations de la boutique
    const { data: boutiqueData, error: boutiqueError } = await supabase
      .from('boutique')
      .select('*')
      .eq('slug', rewardData.store_slug)
      .single()

    if (boutiqueError) throw boutiqueError
    if (!boutiqueData) throw new Error("Boutique introuvable")
    
    boutique.value = boutiqueData

    // Vérifier si l'utilisateur est propriétaire de la boutique
    isOwner.value = boutiqueData.owner === user.value.id

    // Récupérer le profil de l'utilisateur qui a gagné la récompense
    userProfile.value = rewardData.profiles

    return isOwner.value
  } catch (e) {
    console.error('Erreur lors de la vérification des droits:', e)
    error.value = e.message
    return false
  } finally {
    isLoading.value = false
  }
}

// Marquer la récompense comme utilisée
const markAsUsed = async () => {
  if (!isOwner.value || !reward.value) {
    validationError.value = "Vous n'avez pas les droits pour valider cette récompense."
    return
  }

  if (reward.value.is_used) {
    validationError.value = "Cette récompense a déjà été utilisée."
    return
  }

  try {
    isLoading.value = true
    
    const { error: updateError } = await supabase
      .from('reward')
      .update({ is_used: true })
      .eq('id', rewardId)

    if (updateError) throw updateError

    reward.value.is_used = true
    validationSuccess.value = true
    validationError.value = null
  } catch (e) {
    console.error('Erreur lors de la validation de la récompense:', e)
    validationError.value = `Erreur lors de la validation: ${e.message}`
    validationSuccess.value = false
  } finally {
    isLoading.value = false
  }
}

// Initialisation
onMounted(async () => {
  // Vérifier les droits et valider automatiquement la récompense si l'utilisateur est le propriétaire
  const isOwnerConfirmed = await checkOwnership()
  
  // Si l'utilisateur est le propriétaire et que la récompense n'est pas déjà utilisée, la valider automatiquement
  if (isOwnerConfirmed && reward.value && !reward.value.is_used) {
    await markAsUsed()
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="pb-24">
      <div class="p-4">
        <Loader v-if="isLoading" />
        
        <div v-else-if="error" class="text-center">
          <p class="text-red-600 mb-4">{{ error }}</p>
          <button 
            @click="router.push('/')" 
            class="px-4 py-2 bg-blue-800 text-white rounded"
          >
            Retour à l'accueil
          </button>
        </div>

        <div v-else-if="!isOwner" class="text-center">
          <p class="text-red-600 mb-4">Vous n'êtes pas autorisé à valider cette récompense.</p>
          <button 
            @click="router.push('/')" 
            class="px-4 py-2 bg-blue-800 text-white rounded"
          >
            Retour à l'accueil
          </button>
        </div>

        <div v-else class="bg-white rounded-lg p-4">
          <h1 class="text-xl uppercase text-blue-800 font-semibold mb-4">
            Validation automatique de récompense
          </h1>
          
          <div v-if="!reward?.is_used" class="bg-yellow-50 border border-gray-200 text-yellow-700 p-3 rounded-lg mb-4">
            Validation en cours...
          </div>

          <div class="border-b pb-4 mb-4">
            <p class="text-lg font-medium">{{ boutique?.name_shop }}</p>
            <p class="text-sm text-gray-600">{{ boutique?.adresse }}</p>
          </div>

          <div class="mb-6">
            <p class="text-md font-medium">Détails de la récompense :</p>
            <div class="bg-gray-50 p-3 rounded-lg mt-2">
              <p class="text-sm"><span class="font-medium">Client :</span> {{ userProfile?.full_name }}</p>
              <p class="text-sm"><span class="font-medium">Récompense :</span> {{ boutique?.lot }}</p>
              <p class="text-sm"><span class="font-medium">Points atteints :</span> {{ reward?.new_solde }} / {{ boutique?.limite }}</p>
              <p class="text-sm"><span class="font-medium">Date d'obtention :</span> {{ new Date(reward?.hit_date).toLocaleDateString() }}</p>
              <p class="text-sm mt-2" :class="reward?.is_used ? 'text-blue-800 font-medium' : 'text-red-600 font-medium'">
                {{ reward?.is_used ? 'Récompense déjà utilisée' : 'Récompense en attente de validation' }}
              </p>
            </div>
          </div>

          <div v-if="validationSuccess" class="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4">
            La récompense a été validée avec succès !
          </div>

          <div v-if="validationError" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            {{ validationError }}
          </div>

          <div class="flex justify-center mt-6">
            <button 
              @click="router.push('/notifications')" 
              class="px-4 py-2 bg-blue-800 text-white rounded"
            >
              Retour aux notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
