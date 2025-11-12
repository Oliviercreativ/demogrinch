<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import { vibrate, VIBRATION_PATTERNS } from '@/utils/vibration';
import { navigateTo } from '#app'
import Loader from '@/components/Loader.vue'
import { Html5Qrcode } from 'html5-qrcode'

const user = useSupabaseUser()
const router = useRouter()
const isLoading = ref(true)
const showScanner = ref(true)
const scanResult = ref(null)
const scanError = ref(false)
const countdown = ref(20)
const progress = ref(100)
let isProcessing = false
let html5QrCode = null
let countdownInterval = null

definePageMeta({
  showHeader: false,
  showFooter: false,
  showNavbar: false,
  showAdminbar: false
})

const { checkProfile } = useProfileCheck()

const startCountdown = () => {
  countdown.value = 20
  progress.value = 100

  countdownInterval = setInterval(() => {
    countdown.value--
    progress.value = (countdown.value / 20) * 100

    if (countdown.value === 0) {
      clearInterval(countdownInterval);
      stopScanner();
    }
  }, 1000)
}

const stopScanner = () => {
  if (html5QrCode) {
    html5QrCode.stop().catch(err => console.log('Erreur lors de l\'arrêt du scanner:', err))
    html5QrCode = null
  }
  clearInterval(countdownInterval)
  showScanner.value = false
}

onBeforeUnmount(() => {
  stopScanner()
})

const initQRCodeScanner = () => {
  if (process.client && document.getElementById("qr-reader")) {
    html5QrCode = new Html5Qrcode("qr-reader")
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        if (!isProcessing) {
          isProcessing = true
          stopScanner()
          handleScanResult(decodedText)
        }
      },
      (errorMessage) => {
        console.warn(`Erreur lors du scan : ${errorMessage}`)
      }
    ).catch((err) => {
      console.error('Erreur lors du démarrage du scanner QR Code:', err)
    })
  }
}

const handleScanResult = async (decodedText) => {
  try {
    console.log('📱 QR Code scanné:', decodedText)

    // Extraire le scan_uid de l'URL
    const urlParts = decodedText.split('/')
    const scan_uid = urlParts[urlParts.length - 1]

    if (!scan_uid) {
      throw new Error('QR code invalide.')
    }

    // Vibration de succès
    vibrate(VIBRATION_PATTERNS.SUCCESS)

    // ✅ REDIRECTION VERS LA PAGE UNIFIÉE
    console.log(`🔄 Redirection vers /boutique/${scan_uid}?source=scanner`)

    await router.push(`/boutique/${scan_uid}?source=scanner`)

  } catch (error) {
    console.error('❌ Erreur lors du scan:', error)

    scanResult.value = error.message || 'QR code invalide ou illisible'
    scanError.value = true
    vibrate(VIBRATION_PATTERNS.ERROR)
  } finally {
    isProcessing = false
    stopScanner()
  }
}

const startScanner = async () => {
  if (isProcessing) return

  try {
    showScanner.value = true
    scanResult.value = null
    scanError.value = false
    countdown.value = 20
    progress.value = 100
    await nextTick()
    initQRCodeScanner()
    startCountdown()
  } catch (error) {
    scanResult.value = error.message
    scanError.value = true
  }
}

onMounted(async () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }
  await checkProfile()
  isLoading.value = false
  startScanner()
})

const redirectToLogin = () => {
  navigateTo('/login')
}
</script>

<template>
  <div class="bg-gray-100 h-[99vh]">
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <Loader />
    </div>
    <div v-else-if="!user" class="text-center text-red-600">
      <p>Veuillez vous connecter pour accéder à cette fonctionnalité.</p>
      <button @click="redirectToLogin" aria-label="Se connecter à son compte"
        class="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        Se connecter
      </button>
    </div>
    <div v-else>
      <div class="mx-auto max-w-2xl">

        <!-- Résultat du scan (si erreur) -->
        <div v-if="scanResult">
          <div class="flex justify-center items-center flex-col max-h-screen p-24 gap-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x stroke-red-600"
              width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none"
              stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <circle cx="12" cy="12" r="9" />
              <path d="M10 10l4 4m0 -4l-4 4" />
            </svg>
            <p class="text-center mt-2 font-normal text-red-600">
              {{ scanResult }}
            </p>
            <button @click="startScanner" class="text-white bg-blue-800 px-4 py-3 rounded-lg cursor-pointer">
              Réessayer
            </button>
          </div>
        </div>

        <!-- Scanner QR actif -->
        <div v-else-if="showScanner" class="h-full">
          <div id="qr-reader" class="h-full w-full"></div>
          <div class="fixed bottom-0 left-0 right-0 p-4 bg-white">
            <div class="bg-gray-200 h-4 rounded-full">
              <div class="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-linear"
                :style="{ width: progress + '%' }"></div>
            </div>
            <p class="text-center mt-2 text-sm text-gray-600">
              Scanner automatique : {{ countdown }}s restantes
            </p>
          </div>
        </div>

        <!-- Scanner arrêté -->
        <div v-else class="text-center mt-4 p-6">
          <div class="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg">
            <p class="font-medium">Scanner arrêté</p>
            <p class="text-sm mt-2">Positionnez le QR code devant la caméra</p>
          </div>
          <button @click="startScanner" aria-label="Relancer le scanner QR code"
            class="bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg">
            🔍 RELANCER LE SCANNER
          </button>
          <p class="text-sm text-gray-600 mt-4">
            Assurez-vous d'être dans la boutique pour scanner le QR code.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>