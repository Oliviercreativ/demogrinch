<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-lg">
    <!-- Indicateur de chargement -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      <span class="ml-3 text-gray-600">Chargement...</span>
    </div>

    <div v-else>
      <!-- Section Scanner -->
      <div v-if="!scanResult" class="text-center">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Scanner la carte de fidélité</h2>

        <!-- Zone de scan -->
        <div class="relative mb-4">
          <div id="reader" class="mx-auto border-2 border-dashed border-gray-300 rounded-lg"></div>
          <div class="absolute inset-0 pointer-events-none">
            <div
              class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg opacity-50">
            </div>
          </div>
        </div>

        <!-- Messages d'erreur du scanner -->
        <div v-if="scanError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"></path>
            </svg>
            {{ scanError }}
          </div>
        </div>

        <!-- Bouton de test (optionnel, pour le développement) -->
        <button v-if="isDev" @click="testScan"
          class="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
          Test avec UUID factice
        </button>
      </div>

      <!-- Section Résultats -->
      <div v-else>
        <!-- Carte non liée - Formulaire d'association -->
        <div v-if="!carteLiee" class="space-y-4">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">Nouvelle carte détectée</h3>
            <p class="text-gray-600 mt-2">Associez cette carte à un client</p>
          </div>

          <form @submit.prevent="lierCarte" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input v-model.trim="form.prenom" type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Entrez le prénom" required />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input v-model.trim="form.nom" type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Entrez le nom" required />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input v-model.trim="form.email" type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="exemple@email.com" required />
            </div>

            <button type="submit" :disabled="isSubmitting"
              class="w-full bg-blue-800 text-white px-4 py-3 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">
              <span v-if="isSubmitting" class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Association en cours...
              </span>
              <span v-else>Associer la carte</span>
            </button>
          </form>

          <!-- Messages d'erreur du formulaire -->
          <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"></path>
              </svg>
              {{ formError }}
            </div>
          </div>
        </div>

        <!-- Carte liée - Gestion des points -->
        <div v-else class="space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">Carte reconnue</h3>
          </div>

          <!-- Informations du client -->
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Client :</span>
              <span class="text-sm text-gray-900 font-semibold">{{ userInfo.full_name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Email :</span>
              <span class="text-sm text-gray-900">{{ userInfo.email }}</span>
            </div>
            <div v-if="userStats.totalPoints !== null" class="flex justify-between items-center border-t pt-2">
              <span class="text-sm font-medium text-gray-600">Points totaux :</span>
              <span class="text-sm text-blue-600 font-bold">{{ userStats.totalPoints }}</span>
            </div>
          </div>

          <!-- Bouton d'ajout de point -->
          <button @click="ajouterPoint" :disabled="isAddingPoint"
            class="w-full bg-green-700 text-white px-4 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center">
            <svg v-if="!isAddingPoint" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6">
              </path>
            </svg>
            <div v-if="isAddingPoint" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ isAddingPoint ? 'Ajout en cours...' : 'Ajouter un point de fidélité' }}
          </button>

          <!-- Messages pour les points -->
          <div v-if="pointMessage"
            :class="pointError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'"
            class="border px-4 py-3 rounded-lg">
            <div class="flex items-center">
              <svg v-if="pointError" class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"></path>
              </svg>
              <svg v-else class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"></path>
              </svg>
              {{ pointMessage }}
            </div>
          </div>
        </div>

        <!-- Bouton de nouveau scan -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <button @click="resetScan"
            class="w-full text-blue-800 hover:text-blue-900 font-medium py-2 px-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-all">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
              </path>
            </svg>
            Scanner une autre carte
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { Html5Qrcode } from 'html5-qrcode'

// Types
interface UserInfo {
  full_name: string
  email: string
}

interface UserStats {
  totalPoints: number | null
}

interface Form {
  nom: string
  prenom: string
  email: string
}

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

// Composables
const supabase = useSupabaseClient()

// État réactif
const isLoading = ref(false)
const isSubmitting = ref(false)
const isAddingPoint = ref(false)
const scanResult = ref('')
const scanError = ref('')
const carteLiee = ref(false)
const userInfo = reactive<UserInfo>({ full_name: '', email: '' })
const userStats = reactive<UserStats>({ totalPoints: null })
const form = reactive<Form>({ nom: '', prenom: '', email: '' })
const formError = ref('')
const pointMessage = ref('')
const pointError = ref(false)
const isDev = ref(process.env.NODE_ENV === 'development')

// Variables
let carteUuid = ''
let html5QrCode: Html5Qrcode | null = null

// Utilitaires
const generateUUID = (): string => {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback pour les navigateurs plus anciens
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateQRCode = (text: string): string => {
  if (!text || typeof text !== 'string') {
    throw new Error('QR code vide ou invalide')
  }

  // Si c'est une URL, extraire l'UUID de la fin
  if (text.includes('/')) {
    const urlParts = text.split('/')
    const uuid = urlParts[urlParts.length - 1]
    if (!uuid || uuid.length < 8) {
      throw new Error('UUID de carte invalide dans l\'URL')
    }
    return uuid
  }

  // Si c'est directement un UUID
  if (text.length < 8) {
    throw new Error('Format de carte invalide')
  }

  return text
}

// Fonctions de gestion du scanner
const resetScan = () => {
  scanResult.value = ''
  scanError.value = ''
  carteLiee.value = false
  userInfo.full_name = ''
  userInfo.email = ''
  userStats.totalPoints = null
  form.nom = ''
  form.prenom = ''
  form.email = ''
  formError.value = ''
  pointMessage.value = ''
  pointError.value = false
  isSubmitting.value = false
  isAddingPoint.value = false

  setTimeout(() => startScanner(), 300)
}

const startScanner = async () => {
  try {
    if (html5QrCode) {
      await html5QrCode.stop().catch(() => { })
    }

    html5QrCode = new Html5Qrcode('reader')

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      (decodedText: string) => {
        if (!scanResult.value) {
          scanResult.value = decodedText
          html5QrCode?.stop().catch(() => { })
          processScan(decodedText)
        }
      },
      (errorMessage: string) => {
        // On ignore les erreurs de scan continu
        if (!errorMessage.includes('NotFoundError')) {
          console.warn('Erreur de scan:', errorMessage)
        }
      }
    )
  } catch (err: any) {
    console.error('Erreur lors du démarrage du scanner:', err)
    scanError.value = 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
  }
}

const processScan = async (decodedText: string) => {
  try {
    scanError.value = ''
    carteUuid = validateQRCode(decodedText)
    isLoading.value = true

    // Vérifier si la carte est déjà liée
    const { data, error } = await supabase
      .from('relation')
      .select('owner')
      .eq('uuid', carteUuid)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error('Erreur lors de la vérification de la carte')
    }

    if (data?.owner) {
      // Carte déjà liée, récupérer infos utilisateur
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.owner)
        .single()

      if (userError) {
        throw new Error('Erreur lors de la récupération du profil utilisateur')
      }

      userInfo.full_name = user.full_name
      userInfo.email = user.email
      carteLiee.value = true

      // Récupérer les statistiques de l'utilisateur
      await loadUserStats(data.owner)
    } else {
      carteLiee.value = false
    }
  } catch (error: any) {
    scanError.value = error.message || 'Erreur lors du traitement du scan'
    console.error('Erreur processScan:', error)
  } finally {
    isLoading.value = false
  }
}

const loadUserStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('reward')
      .select('solde')
      .eq('user_uid_reward', userId)
      .eq('is_read', false)

    if (!error && data) {
      userStats.totalPoints = data.reduce((total, reward) => total + (reward.solde || 0), 0)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error)
  }
}

// Fonction de test pour le développement
const testScan = () => {
  const testUuid = 'test-' + Math.random().toString(36).substring(2, 15)
  processScan(`https://example.com/card/${testUuid}`)
}

// Gestion de l'association de carte
const lierCarte = async () => {
  try {
    formError.value = ''

    // Validation des champs
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
      formError.value = 'Tous les champs sont obligatoires.'
      return
    }

    if (!validateEmail(form.email)) {
      formError.value = 'Format d\'email invalide.'
      return
    }

    isSubmitting.value = true

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', form.email)
      .maybeSingle()

    if (existingUser) {
      formError.value = 'Un compte avec cet email existe déjà.'
      return
    }

    // Générer un ID utilisateur
    const uuid = generateUUID()

    // Créer le compte utilisateur
    const { data: newUser, error: userError } = await supabase
      .from('profiles')
      .insert({
        id: uuid,
        full_name: `${form.prenom.trim()} ${form.nom.trim()}`,
        email: form.email.trim(),
        created_at: new Date().toISOString()
      })
      .select('id, full_name, email')
      .single()

    if (userError) {
      throw new Error('Erreur lors de la création du compte utilisateur')
    }

    // Associer la carte à ce compte
    const { error: relError } = await supabase
      .from('relation')
      .insert({
        uuid: carteUuid,
        owner: newUser.id,
        created_at: new Date().toISOString()
      })

    if (relError) {
      throw new Error('Erreur lors de l\'association de la carte')
    }

    // Mettre à jour l'interface
    userInfo.full_name = newUser.full_name
    userInfo.email = newUser.email
    userStats.totalPoints = 0
    carteLiee.value = true

    // Réinitialiser le formulaire
    form.nom = ''
    form.prenom = ''
    form.email = ''

  } catch (error: any) {
    formError.value = error.message || 'Erreur lors de l\'association de la carte'
    console.error('Erreur lierCarte:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Gestion des points de fidélité
const ajouterPoint = async () => {
  try {
    pointMessage.value = ''
    pointError.value = false
    isAddingPoint.value = true

    // Récupérer l'owner de la carte
    const { data, error } = await supabase
      .from('relation')
      .select('owner')
      .eq('uuid', carteUuid)
      .single()

    if (error || !data?.owner) {
      throw new Error('Impossible de trouver le propriétaire de la carte')
    }

    // Calculer le nouveau solde
    const currentPoints = userStats.totalPoints || 0
    const newPoints = currentPoints + 1

    // Ajouter un point dans la table reward
    const { error: rewardError } = await supabase
      .from('reward')
      .insert({
        user_uid_reward: data.owner,
        hit_date: new Date().toISOString(),
        solde: 1,
        new_solde: newPoints,
        store_slug: 'fidélité'
      })

    if (rewardError) {
      throw new Error('Erreur lors de l\'ajout du point de fidélité')
    }

    // Mettre à jour les statistiques locales
    userStats.totalPoints = newPoints
    pointMessage.value = `Point de fidélité ajouté avec succès ! Total: ${newPoints} points`
    pointError.value = false

    // Effacer le message après 3 secondes
    setTimeout(() => {
      pointMessage.value = ''
    }, 3000)

  } catch (error: any) {
    pointMessage.value = error.message || 'Erreur lors de l\'ajout du point de fidélité'
    pointError.value = true
    console.error('Erreur ajouterPoint:', error)
  } finally {
    isAddingPoint.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  startScanner()
})

onUnmounted(() => {
  if (html5QrCode) {
    html5QrCode.stop().catch(() => { })
  }
})
</script>

<style scoped>
#reader {
  width: 320px;
  height: 320px;
  margin: 0 auto;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Styles pour le scanner QR */
#reader video {
  border-radius: 0.5rem;
}

/* Animation pour les éléments interactifs */
button {
  transition: all 0.2s ease-in-out;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Styles pour les inputs */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Animation pour les messages */
.bg-red-50,
.bg-green-50 {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>