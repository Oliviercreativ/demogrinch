<script setup>
import { ref, onBeforeUnmount, nextTick } from 'vue'
import { useSupabaseUser, useRouter } from '#imports'
import { Html5Qrcode } from 'html5-qrcode'
import { vibrate, VIBRATION_PATTERNS } from '@/utils/vibration'

const user = useSupabaseUser()
const router = useRouter()

// Boutique fixe : Boulangerie Artisanale
const BOUTIQUE_SLUG = 'boulangerie-artisanale'

const showScanner = ref(false)
const isLoading = ref(false)
const scanResult = ref(null)
const scanError = ref(false)
const scanSuccess = ref(false)
let html5QrCode = null
let isProcessing = false

const startScanner = async () => {
  if (isProcessing) return
  
  try {
    showScanner.value = true
    scanError.value = false
    scanResult.value = null
    scanSuccess.value = false
    isLoading.value = true
    
    await nextTick()
    initQRCodeScanner()
  } catch (error) {
    console.error('Erreur lors du démarrage du scanner:', error)
    scanError.value = true
    scanResult.value = error.message || 'Impossible de démarrer le scanner'
    isLoading.value = false
  }
}

const stopScanner = () => {
  if (html5QrCode) {
    html5QrCode.stop().catch(err => console.log('Erreur lors de l\'arrêt du scanner:', err))
    html5QrCode = null
  }
  showScanner.value = false
  isLoading.value = false
}

const initQRCodeScanner = () => {
  if (process.client && document.getElementById("home-qr-reader")) {
    try {
      html5QrCode = new Html5Qrcode("home-qr-reader")
      
      const qrboxSize = Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.8, 300)
      
      html5QrCode.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          if (!isProcessing) {
            isProcessing = true
            stopScanner()
            await handleScanResult(decodedText)
          }
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan continu
          if (!errorMessage.includes('NotFoundError')) {
            console.warn('Erreur de scan:', errorMessage)
          }
        }
      ).then(() => {
        isLoading.value = false
      }).catch((err) => {
        console.error('Erreur lors du démarrage du scanner:', err)
        scanError.value = true
        scanResult.value = 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
        isLoading.value = false
      })
    } catch (error) {
      console.error('Erreur initialisation scanner:', error)
      scanError.value = true
      scanResult.value = 'Erreur lors de l\'initialisation du scanner'
      isLoading.value = false
    }
  }
}

const extractUserIdFromQR = (decodedText) => {
  // Le QR code peut être :
  // - Une URL complète : https://domain.com/user/[user-id]
  // - Juste l'ID utilisateur (UUID)
  // - Une URL relative : /user/[user-id]
  
  if (!decodedText) return null
  
  // Si c'est déjà un UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidPattern.test(decodedText)) {
    return decodedText
  }
  
  // Si c'est une URL, extraire l'ID depuis /user/[id]
  if (decodedText.includes('/user/')) {
    const match = decodedText.match(/\/user\/([0-9a-f-]+)/i)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  // Si c'est une URL avec l'ID à la fin
  const urlParts = decodedText.split('/')
  const lastPart = urlParts[urlParts.length - 1]
  if (uuidPattern.test(lastPart)) {
    return lastPart
  }
  
  return null
}

const handleScanResult = async (decodedText) => {
  try {
    console.log('📱 QR Code utilisateur scanné:', decodedText)
    
    // Extraire l'ID utilisateur du QR code
    const scannedUserId = extractUserIdFromQR(decodedText)
    
    if (!scannedUserId) {
      throw new Error('QR code invalide. Format attendu : URL avec /user/[id] ou UUID utilisateur')
    }

    console.log('👤 ID utilisateur extrait:', scannedUserId)

    vibrate(VIBRATION_PATTERNS.SUCCESS)

    // Appeler la nouvelle API pour ajouter le point
    const response = await $fetch('/api/rewards/add-point-by-user-qr', {
      method: 'POST',
      body: {
        scanned_user_id: scannedUserId,
        scanner_user_id: user.value?.id || null // Optionnel : ID de celui qui scanne
      }
    })

    if (response.success) {
      scanSuccess.value = true
      scanResult.value = `Point ajouté avec succès ! ${response.data.new_solde}/${response.data.boutique_limit} points`
      
      if (response.data.reward_earned) {
        scanResult.value = `🎉 ${response.message}`
      }

      // Rediriger vers la page merci après un court délai
      setTimeout(() => {
        router.push(`/merci?boutique=${BOUTIQUE_SLUG}`)
      }, 2000)
    } else {
      throw new Error(response.message || 'Erreur lors de l\'ajout du point')
    }

  } catch (error) {
    console.error('❌ Erreur lors du scan:', error)
    scanError.value = true
    scanResult.value = error.message || error.data?.message || 'Erreur lors du traitement du QR code'
    vibrate(VIBRATION_PATTERNS.ERROR)
    isProcessing = false
  }
}

onBeforeUnmount(() => {
  stopScanner()
})
</script>

<template>
  <div class="w-full">
    <!-- Bouton pour démarrer le scanner -->
    <button
      v-if="!showScanner"
      @click="startScanner"
      class="w-full bg-blue-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-900 transition-colors duration-200 flex items-center justify-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-qrcode" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <rect x="4" y="4" width="5" height="5" rx="1" />
        <path d="M7 17v.01" />
        <rect x="14" y="4" width="5" height="5" rx="1" />
        <path d="M7 7v.01" />
        <rect x="4" y="14" width="5" height="5" rx="1" />
        <path d="M17 7v.01" />
        <path d="M14 14h3" />
        <path d="M20 14v.01" />
        <path d="M14 14v3" />
        <path d="M14 20h3" />
        <path d="M17 17h3" />
        <path d="M20 17v3" />
      </svg>
      <span>Scanner le QR code d'un client</span>
    </button>

    <!-- Scanner actif -->
    <div v-if="showScanner" class="w-full">
      <div class="bg-white rounded-lg p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-blue-800">Scanner QR Code</h3>
          <button
            @click="stopScanner"
            class="text-gray-600 hover:text-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div id="home-qr-reader" class="w-full rounded-lg overflow-hidden"></div>
        
        <p class="text-sm text-gray-600 text-center mt-4">
          Scannez le QR code du client pour lui ajouter un point de fidélité
        </p>
      </div>
    </div>

    <!-- Résultat du scan -->
    <div v-if="scanResult" class="mt-4 p-4 rounded-lg" :class="scanSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      <p class="text-center font-medium">{{ scanResult }}</p>
      <button
        v-if="scanSuccess"
        @click="scanResult = null; scanSuccess = false"
        class="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm"
      >
        OK
      </button>
      <button
        v-else
        @click="scanResult = null; scanError = false"
        class="mt-2 w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm"
      >
        Réessayer
      </button>
    </div>
  </div>
</template>

<style scoped>
#home-qr-reader {
  min-height: 300px;
}
</style>

