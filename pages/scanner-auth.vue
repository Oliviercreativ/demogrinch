<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import { vibrate, VIBRATION_PATTERNS } from '@/utils/vibration';
import { useRouter } from 'vue-router'
import Loader from '@/components/Loader.vue'
import AuthForm from '@/components/AuthForm.vue'
import { Html5Qrcode } from 'html5-qrcode'
import { v4 as uuidv4 } from 'uuid';

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const isLoading = ref(true)
const showScanner = ref(false)
const showAuthForm = ref(false)
const scanResult = ref(null)
const boutiqueSlug = ref(null)
const scanError = ref(false)
const cooldowns = ref({})
const countdown = ref(20)
const progress = ref(100)
const rewardEarned = ref(false)
const storedScanUid = ref(null)
let isProcessing = false
let html5QrCode = null
let cooldownIntervals = {}
let countdownInterval = null
let loaderTimeout = null

definePageMeta({
  showHeader: false
})

const { checkProfile } = useProfileCheck()

onMounted(async () => {
  loaderTimeout = setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false;
      scanError.value = true;
      scanResult.value = 'Le chargement a pris trop de temps. Veuillez réessayer.';
    }
  }, 10000); // 10 secondes

  await checkProfile()
  
  // Vérifier si l'utilisateur est connecté
  if (!user.value) {
    showAuthForm.value = true
  } else {
    showScanner.value = true
    await nextTick()
    initQRCodeScanner()
    startCountdown()
  }
  
  isLoading.value = false
})

const MAX_DISTANCE = 300
const userLocation = ref(null)
const locationError = ref(null)

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // Rayon de la terre en mètres
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur.'))
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        locationError.value = null
        resolve(userLocation.value)
      },
      (error) => {
        let errorMessage = 'Une erreur est survenue avec la géolocalisation.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vous devez autoriser la géolocalisation pour scanner le QR code.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Votre position est actuellement indisponible. Vérifiez que votre GPS est activé.'
            break
          case error.TIMEOUT:
            errorMessage = 'La demande de géolocalisation a expiré. Veuillez réessayer.'
            break
        }
        locationError.value = errorMessage
        reject(new Error(errorMessage))
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  })
}

const scanQR = async () => {
  try {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.stop();
    }
    startScanner();
    return true;
  } catch (error) {
    console.error("Erreur lors du scan QR:", error);
    scanError.value = true;
    scanResult.value = error.message || "Erreur lors du scan QR";
    return false;
  } finally {
    if (loaderTimeout) clearTimeout(loaderTimeout);
    isLoading.value = false;
  }
}

const startCountdown = () => {
  countdown.value = 20
  progress.value = 100
  
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  
  countdownInterval = setInterval(() => {
    countdown.value -= 1
    progress.value = (countdown.value / 20) * 100
    
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      stopScanner()
    }
  }, 1000)
}

const remainingTime = computed(() => {
  const now = Date.now()
  return Object.entries(cooldowns.value).reduce((acc, [boutiqueId, cooldown]) => {
    if (now < cooldown.endTime) {
      acc[boutiqueId] = {
        boutiqueName: cooldown.boutiqueName,
        remainingTime: Math.ceil((cooldown.endTime - now) / 1000)
      }
    }
    return acc
  }, {})
})

const stopScanner = () => {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      console.log('Scanner stopped')
    }).catch(error => {
      console.error('Error stopping scanner:', error)
    })
  }
  
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
}

onBeforeUnmount(() => {
  stopScanner()
})

const initQRCodeScanner = () => {
  const qrCodeSuccessCallback = (decodedText) => {
    if (isProcessing) return
    isProcessing = true
    
    vibrate(VIBRATION_PATTERNS.SUCCESS)
    handleScanResult(decodedText)
  }
  
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  }
  
  const qrErrorCallback = (error) => {
    console.error('QR scan error:', error)
  }
  
  try {
    html5QrCode = new Html5Qrcode('reader')
    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      qrCodeSuccessCallback,
      qrErrorCallback
    )
  } catch (error) {
    console.error('Error initializing QR scanner:', error)
    scanResult.value = error.message
    scanError.value = true
  } finally {
    if (loaderTimeout) clearTimeout(loaderTimeout);
    isLoading.value = false;
  }
}

const handleScanResult = async (decodedText) => {
  try {
    const urlParts = decodedText.split('/')
    const scan_uid = urlParts[urlParts.length - 1]
    
    if (!scan_uid) {
      throw new Error('QR code invalide.')
    }
    
    // Stocker le scan_uid si l'utilisateur n'est pas connecté
    if (!user.value) {
      storedScanUid.value = scan_uid
      showAuthForm.value = true
      showScanner.value = false
      return
    }
    
    // D'abord récupérer les infos de la boutique pour vérifier check_location
    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutique')
      .select('*, latitude, longitude, name_shop, check_location')
      .eq('scan_uid', scan_uid)
      .single()
    
    if (boutiqueError) {
      throw new Error('Boutique non trouvée.')
    }
    
    // Vérifier la géolocalisation UNIQUEMENT si check_location est true
    if (boutique.check_location) {
      const currentPosition = await getUserLocation()
      
      if (!boutique.latitude || !boutique.longitude) {
        throw new Error('Les coordonnées de la boutique ne sont pas configurées.')
      }
      
      const distance = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        boutique.latitude,
        boutique.longitude
      )
      
      if (distance > MAX_DISTANCE) {
        throw new Error(
          `Vous êtes trop loin de ${boutique.name_shop}.\n` 
        )
      }
    }
    
    // Continuer avec le processus normal de scan...
    const now = Date.now()
    if (cooldowns.value && cooldowns.value[boutique.id] && now < cooldowns.value[boutique.id].endTime) {
      const remaining = Math.ceil((cooldowns.value[boutique.id].endTime - now) / 1000)
      throw new Error(`Veuillez attendre ${remaining} secondes avant de scanner à nouveau.`)
    }
    
    const existingScans = await fetchScans();
    if (existingScans.length > 0) {
      const lastScan = existingScans[0];
      if (lastScan.boutique_id === boutique.id) {
        throw new Error('Vous avez déjà scanné cette boutique, rendez-vous à demain.');
      }
    }
    
    // Enregistrer le scan
    const { data: scanData, error: scanError } = await recordScan(boutique.id);
    if (scanError) {
      throw new Error('Erreur lors de l\'enregistrement du scan: ' + scanError.message);
    }
    
    const { data: lastReward, error: lastRewardError } = await supabase
      .from('reward')
      .select('*')
      .eq('store_slug', boutique.slug)
      .eq('user_uid_reward', user.value.id)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single()
    
    if (lastRewardError && lastRewardError.code !== 'PGRST116') {
      throw new Error('Erreur lors de la récupération du dernier reward: ' + lastRewardError.message)
    }
    
    let currentSolde = lastReward ? lastReward.new_solde : 0
    let newSolde = currentSolde + 1
    let rewardMessage = ''
    let seriesUid = lastReward ? lastReward.series_uid : uuidv4()
    let isRewardEarned = false
    
    if (newSolde === boutique.limite) {
      rewardMessage = `Félicitations ! Vous avez atteint ${boutique.limite}/${boutique.limite}. Voici votre récompense : ${boutique.lot}.`
      isRewardEarned = true
      
    } else if (newSolde > boutique.limite) {
      newSolde = 1
      currentSolde = 0
      seriesUid = uuidv4()
      rewardMessage = `Félicitation vous avez gagné un cadeau<br>Point de fidélité ajouté : ${newSolde} / ${boutique.limite}`
    } else {
      rewardMessage = `Point de fidélité ajouté : ${newSolde} / ${boutique.limite}`
    }
    
    // Insérer le nouveau reward
    const { data: newReward, error: newRewardError } = await supabase
      .from('reward')
      .insert({
        hit_date: new Date().toISOString(),
        solde: currentSolde,
        new_solde: newSolde,
        store_slug: boutique.slug,
        rewardSlug: seriesUid,
        user_uid_reward: user.value.id,
        series_uid: seriesUid
      })
    
    if (newRewardError) {
      throw new Error('Erreur lors de l\'ajout du nouveau reward: ' + newRewardError.message)
    }
    
    if (boutiqueSlug) boutiqueSlug.value = boutique.slug
    if (scanResult) scanResult.value = rewardMessage
    if (scanError) scanError.value = false
    
    if (!cooldowns.value) cooldowns.value = {}
    cooldowns.value[boutique.id] = {
      endTime: Date.now() + 120000,
      boutiqueName: boutique.name_shop,
      remainingTime: 10
    }
    storeCooldowns()
    
    startCooldownTimer(boutique.id)
    
    // Afficher le résultat directement sur la page
    showScanner.value = false
    rewardEarned.value = isRewardEarned
    
  } catch (error) {
    console.error('Erreur lors du scan:', error)
    if (scanResult) scanResult.value = error.message || 'Une erreur est survenue lors du scan'
    scanError.value = true
    showScanner.value = false
    vibrate(VIBRATION_PATTERNS.ERROR)
  } finally {
    if (loaderTimeout) clearTimeout(loaderTimeout);
    isLoading.value = false;
    stopScanner()
  }
}

const startScanner = async () => {
  if (isProcessing) return
  
  try {
    showScanner.value = true
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

const startCooldownTimer = (boutiqueId) => {
  if (cooldownIntervals[boutiqueId]) {
    clearInterval(cooldownIntervals[boutiqueId])
  }
  
  cooldownIntervals[boutiqueId] = setInterval(() => {
    if (cooldowns.value && cooldowns.value[boutiqueId]) {
      const now = Date.now()
      if (now >= cooldowns.value[boutiqueId].endTime) {
        clearInterval(cooldownIntervals[boutiqueId])
        delete cooldowns.value[boutiqueId]
        storeCooldowns()
      } else {
        cooldowns.value[boutiqueId].remainingTime = Math.ceil((cooldowns.value[boutiqueId].endTime - now) / 1000)
      }
    } else {
      clearInterval(cooldownIntervals[boutiqueId])
    }
  }, 1000)
}

const recordScan = async (boutiqueId) => {
  try {
    const { data: existingScan, error: existingScanError } = await supabase
      .from('scans')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.value.id)
      .single();
    
    if (existingScanError && existingScanError.code !== 'PGRST116') {
      throw existingScanError;
    }
    
    if (existingScan) {
      throw new Error('Un scan existe déjà pour cette boutique et cet utilisateur.');
    }
    
    return await supabase
      .from('scans')
      .insert({
        boutique_id: boutiqueId,
        user_id: user.value.id,
        last_scan_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
  } catch (error) {
    throw error;
  }
}

const fetchScans = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.value.id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching scans:', error);
    return [];
  }
}

const storeCooldowns = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cooldowns', JSON.stringify(cooldowns.value))
  }
}

const loadCooldowns = () => {
  if (typeof localStorage !== 'undefined') {
    const storedCooldowns = localStorage.getItem('cooldowns')
    if (storedCooldowns) cooldowns.value = JSON.parse(storedCooldowns)
  }
}

const cleanExpiredCooldowns = () => {
  const now = Date.now()
  let hasChanges = false
  
  for (const [boutiqueId, cooldown] of Object.entries(cooldowns.value)) {
    if (now >= cooldown.endTime) {
      delete cooldowns.value[boutiqueId]
      hasChanges = true
    }
  }
  
  if (hasChanges) {
    storeCooldowns()
  }
}

// Gérer l'authentification réussie
const handleUserAuthenticated = async (authenticatedUser) => {
  user.value = authenticatedUser
  showAuthForm.value = false
  
  // Si un scan_uid a été stocké, traiter la récompense
  if (storedScanUid.value) {
    await handleScanResult(`https://demo.grinch.fr/${storedScanUid.value}`)
  } else {
    // Sinon, afficher le scanner
    showScanner.value = true
    await nextTick()
    initQRCodeScanner()
    startCountdown()
  }
}

// Gérer les erreurs d'authentification
const handleAuthError = (errorMessage) => {
  scanResult.value = errorMessage
  scanError.value = true
}

// Réinitialiser et retourner au scanner
const resetAndScan = () => {
  scanResult.value = null
  scanError.value = false
  rewardEarned.value = false
  showScanner.value = true
  nextTick(() => {
    initQRCodeScanner()
    startCountdown()
  })
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen">
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <Loader />
    </div>
    
    <!-- Formulaire d'authentification -->
    <div v-else-if="showAuthForm" class="p-4">
      <AuthForm 
        @user-authenticated="handleUserAuthenticated"
        @auth-error="handleAuthError"
      />
    </div>
    
    <!-- Scanner QR -->
    <div v-else-if="showScanner" class="flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-lg p-4 mb-4">
        <h2 class="text-xl font-bold text-center mb-4">Scanner un QR code</h2>
        <div id="reader" class="w-full h-64 mb-4"></div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div class="bg-blue-800 h-2.5 rounded-full" :style="`width: ${progress}%`"></div>
        </div>
        <p class="text-center text-sm text-gray-600">Temps restant: {{ countdown }} secondes</p>
      </div>
      
      <div v-if="Object.keys(remainingTime).length > 0" class="w-full max-w-md bg-white rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2">Cooldowns actifs</h3>
        <div v-for="(cooldown, boutiqueId) in remainingTime" :key="boutiqueId" class="mb-2">
          <p>{{ cooldown.boutiqueName }}: {{ cooldown.remainingTime }} secondes</p>
        </div>
      </div>
    </div>
    
    <!-- Résultat du scan -->
    <div v-else class="flex justify-center items-center p-4">
      <div class="w-full max-w-md bg-white rounded-lg p-6">
        <div class="flex justify-center mb-6">
          <svg v-if="!scanError" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-check stroke-blue-800" width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M9 12l2 2l4 -4" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x stroke-red-600" width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <circle cx="12" cy="12" r="9" />
            <path d="M10 10l4 4m0 -4l-4 4" />
          </svg>
        </div>
        
        <p class="text-center text-lg font-medium mb-6" :class="scanError ? 'text-red-600' : 'text-blue-800'" v-html="scanResult"></p>
        
        <div class="flex justify-center space-x-4">
          <button 
            v-if="!scanError && !rewardEarned" 
            @click="resetAndScan" 
            class="text-white bg-blue-800 px-6 py-3 rounded-lg cursor-pointer transition-colors"
          >
            Scanner à nouveau
          </button>
          
          <NuxtLink 
            v-if="boutiqueSlug" 
            :to="`/shop/${boutiqueSlug}`" 
            class="text-white bg-blue-800 px-6 py-3 rounded-lg cursor-pointer transition-colors"
          >
            Visiter la boutique
          </NuxtLink>
          
          <button 
            v-if="scanError" 
            @click="resetAndScan" 
            class="text-white bg-blue-800 px-6 py-3 rounded-lg cursor-pointer transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
