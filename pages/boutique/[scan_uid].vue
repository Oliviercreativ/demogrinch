<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRoute, useRouter } from 'vue-router'
import Loader from '@/components/Loader.vue'
import AuthForm from '@/components/AuthForm.vue'

definePageMeta({
  showHeader: false,
  showFooter: false,
  showNavbar: false,
  showAdminbar: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const scanResult = ref('')
const scanError = ref(false)
const boutiqueSlug = ref('')
const debugLog = ref([])
const showAuthForm = ref(false)
const storedScanUid = ref('')
const isProcessing = ref(false)
const hasProcessedReward = ref(false)
const initialCheckDone = ref(false)
const isRegisteringNewUser = ref(false) // Flag pour indiquer qu'on est en train d'inscrire un nouvel utilisateur

const addDebugLog = (message) => {
  const timestamp = new Date().toISOString()
  debugLog.value.push(`${timestamp}: ${message}`)
  console.log(`[${timestamp}] ${message}`)
}


// Timeout de sécurité pour éviter les blocages (uniquement pour OAuth)
let authTimeout = null
const setAuthTimeout = () => {
  if (authTimeout) clearTimeout(authTimeout)
  authTimeout = setTimeout(() => {
    if (isLoading.value && !hasProcessedReward.value && !showAuthForm.value) {
      addDebugLog('OAuth timeout reached, showing auth form')
      showAuthForm.value = true
      isLoading.value = false
    }
  }, 3000) // 3 secondes maximum d'attente pour OAuth
}

// Vérifier l'état d'authentification au retour d'OAuth
const checkOAuthReturn = async () => {
  addDebugLog('Checking OAuth return state')

  // Vérifier si on revient d'une authentification OAuth
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('code') || urlParams.has('access_token')) {
    addDebugLog('OAuth parameters detected in URL, setting timeout')

    // Définir un timeout uniquement pour OAuth
    setAuthTimeout()

    // Attendre que Supabase traite l'authentification OAuth
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts && !user.value) {
      addDebugLog(`Waiting for OAuth user... attempt ${attempts + 1}`)
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    }

    if (user.value) {
      addDebugLog('OAuth user found after waiting')
      clearTimeout(authTimeout)
      return true
    } else {
      addDebugLog('OAuth user not found after waiting')
      return false
    }
  }

  return false
}

// Watcher pour surveiller les changements d'état utilisateur
watch(user, async (newUser, oldUser) => {
  addDebugLog(`User state changed: ${oldUser?.id || 'null'} -> ${newUser?.id || 'null'}`)

  // Ignorer les changements pendant le traitement initial
  if (!initialCheckDone.value) {
    addDebugLog('Skipping user change during initial check')
    return
  }

  // ⚠️ IMPORTANT : Ignorer le watcher si on est en train d'inscrire un nouvel utilisateur
  // handleUserAuthenticated va gérer le flux complet dans ce cas
  if (isRegisteringNewUser.value) {
    addDebugLog('Skipping watcher - user registration in progress (handled by AuthForm)')
    return
  }

  // Si l'utilisateur vient de se connecter (OAuth par exemple)
  if (newUser && !oldUser && storedScanUid.value && !hasProcessedReward.value) {
    addDebugLog('User just logged in via watcher (OAuth), processing reward...')
    clearTimeout(authTimeout)
    await nextTick()
    await handleUserLoggedIn(newUser)
  }
}, { immediate: false })

// Fonction pour gérer la connexion utilisateur
const handleUserLoggedIn = async (authenticatedUser = null) => {
  // ✅ Si authenticatedUser est fourni (objet simple avec id), utiliser directement
  // Sinon, utiliser user.value ou récupérer depuis la session
  let currentUser = authenticatedUser || user.value
  
  // ✅ Si toujours pas de user, essayer de récupérer depuis la session
  if (!currentUser) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        addDebugLog(`✅ Utilisation de la session directe: ${sessionData.session.user.email}`)
        currentUser = { id: sessionData.session.user.id }
      }
    } catch (sessionError) {
      addDebugLog(`Erreur récupération session: ${sessionError.message}`)
    }
  }
  
  if (isProcessing.value || hasProcessedReward.value || !currentUser || !storedScanUid.value) {
    addDebugLog(`Skipping processing: processing=${isProcessing.value}, hasProcessed=${hasProcessedReward.value}, user=${!!currentUser}, scanUid=${!!storedScanUid.value}`)
    return
  }

  try {
    isProcessing.value = true
    isLoading.value = true
    showAuthForm.value = false
    clearTimeout(authTimeout)

    addDebugLog(`Processing reward for authenticated user: ${currentUser.id}`)

    // ✅ APPEL À L'API UNIFIÉE avec l'ID utilisateur
    await processReward(storedScanUid.value, currentUser.id)

  } catch (error) {
    addDebugLog(`Error in handleUserLoggedIn: ${error.message}`)
    scanError.value = true
    scanResult.value = error.message || 'Une erreur est survenue lors du traitement'
    isLoading.value = false
  } finally {
    isProcessing.value = false
  }
}

onMounted(async () => {
  addDebugLog('Component mounted')

  const scanUid = route.params.scan_uid
  if (!scanUid) {
    addDebugLog('No scan_uid found in URL')
    scanError.value = true
    scanResult.value = "Aucun identifiant de boutique trouvé dans l'URL."
    isLoading.value = false
    return
  }

  addDebugLog(`Scan UID found: ${scanUid}`)
  storedScanUid.value = scanUid

  // Vérifier d'abord si on revient d'OAuth
  const isOAuthReturn = await checkOAuthReturn()

  // Attendre un tick pour s'assurer que l'état utilisateur est bien initialisé
  await nextTick()

  // ✅ CRITIQUE : Attendre que les cookies soient disponibles
  // Les cookies peuvent prendre du temps à être lus, surtout en PWA ou après un scan
  // Délai initial pour laisser le temps aux cookies d'être chargés
  addDebugLog('⏳ Attente initiale pour laisser le temps aux cookies d\'être disponibles...')
  
  // ✅ Vérifier la présence des cookies Supabase (diagnostic)
  // NOTE: Les cookies Supabase peuvent être HttpOnly et donc non accessibles via document.cookie
  // Il faut donc vérifier via getSession() plutôt que via document.cookie
  const allCookies = document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
  const supabaseCookies = allCookies.filter(c => 
    c.includes('sb-') || c.includes('auth-token') || c.includes('supabase')
  )
  addDebugLog(`🍪 Cookies JavaScript accessibles: ${allCookies.length} total, ${supabaseCookies.length} Supabase`)
  if (supabaseCookies.length > 0) {
    addDebugLog(`🍪 Cookies Supabase (JS): ${supabaseCookies.map(c => c.split('=')[0]).join(', ')}`)
  } else {
    addDebugLog('⚠️ Aucun cookie Supabase accessible via JavaScript (peut être HttpOnly - normal)')
  }
  
  // ✅ Vérifier si une session existe déjà dans localStorage (synchronisation entre onglets)
  let hasStoredSession = false
  try {
    const storedSession = localStorage.getItem('supabase-auth-sync')
    if (storedSession) {
      const parsed = JSON.parse(storedSession)
      if (parsed.session?.access_token) {
        hasStoredSession = true
        addDebugLog('✅ Session trouvée dans localStorage (synchronisation entre onglets)')
      }
    }
  } catch (e) {
    addDebugLog('⚠️ Erreur lecture localStorage:', e.message)
  }
  
  // ✅ Délai initial PLUS LONG si pas de cookies détectés ou session dans localStorage
  // Si on a une session dans localStorage, on peut essayer de la restaurer immédiatement
  const initialDelay = (supabaseCookies.length === 0 && !hasStoredSession) ? 3000 : 1500
  addDebugLog(`⏳ Attente initiale: ${initialDelay}ms`)
  
  // ✅ Si on a une session dans localStorage, essayer de la restaurer AVANT l'attente
  if (hasStoredSession) {
    try {
      const storedSession = localStorage.getItem('supabase-auth-sync')
      const parsed = JSON.parse(storedSession)
      if (parsed.session?.access_token) {
        addDebugLog('🔄 Tentative de restauration de session depuis localStorage...')
        try {
          await supabase.auth.setSession({
            access_token: parsed.session.access_token,
            refresh_token: parsed.session.refresh_token || ''
          })
          addDebugLog('✅ Session restaurée depuis localStorage')
          // Attendre un peu pour que la session soit bien synchronisée
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (restoreError) {
          addDebugLog(`⚠️ Erreur restauration session depuis localStorage: ${restoreError.message}`)
        }
      }
    } catch (e) {
      addDebugLog('⚠️ Erreur lors de la restauration depuis localStorage:', e.message)
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, initialDelay))

  // ✅ VÉRIFIER EXPLICITEMENT LA SESSION SUPABASE
  // Parfois useSupabaseUser() n'est pas encore synchronisé, vérifions directement
  // ⚠️ IMPORTANT : Prendre en compte les réseaux 4G/5G qui peuvent être plus lents
  // ⚠️ IMPORTANT : Les cookies peuvent mettre du temps à être disponibles
  let hasActiveSession = false
  let sessionData = null // Stocker sessionData pour réutilisation
  
  // ✅ Essayer plusieurs fois de récupérer la session (les cookies peuvent prendre du temps)
  // Plus de tentatives si pas de cookies détectés ET pas de session dans localStorage
  const maxAttempts = (supabaseCookies.length === 0 && !hasStoredSession) ? 8 : 5
  const delayBetweenAttempts = (supabaseCookies.length === 0 && !hasStoredSession) ? 1200 : 800
  
  addDebugLog(`🔄 Début de ${maxAttempts} tentatives de récupération de session (délai: ${delayBetweenAttempts}ms entre chaque)`)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      addDebugLog(`🔄 Tentative ${attempt}/${maxAttempts} de récupération de la session...`)
      const sessionResult = await supabase.auth.getSession()
      sessionData = sessionResult.data
      
      if (sessionResult.error) {
        addDebugLog(`Session check error (tentative ${attempt}): ${sessionResult.error.message}`)
        // Si c'est une erreur de cookie, attendre un peu plus
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts))
          continue
        }
      } else if (sessionData?.session) {
        hasActiveSession = true
        addDebugLog(`✅ Session trouvée via getSession() (tentative ${attempt}): ${sessionData.session.user?.email}`)
        break // Session trouvée, on sort de la boucle
      } else {
        addDebugLog(`ℹ️ Aucune session trouvée (tentative ${attempt}/${maxAttempts})`)
        
        // ✅ Si pas de session, essayer de forcer un refresh depuis l'API
        if (attempt === 3 && !hasActiveSession) {
          addDebugLog('🔄 Tentative de refresh forcé de la session...')
          try {
            await supabase.auth.refreshSession()
            // Attendre un peu après le refresh
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (refreshError) {
            addDebugLog(`⚠️ Erreur refresh session: ${refreshError.message}`)
          }
        }
        
        // Si pas de session et pas la dernière tentative, attendre un peu plus
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts))
          continue
        }
      }
    } catch (sessionCheckError) {
      addDebugLog(`Erreur lors de la vérification de session (tentative ${attempt}): ${sessionCheckError.message}`)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts))
        continue
      }
    }
  }
  
  // Si on a une session mais user.value n'est pas encore défini, attendre un peu
  // ⚠️ DÉLAI AUGMENTÉ pour les réseaux mobiles (4G/5G) plus lents
  if (hasActiveSession && !user.value) {
    addDebugLog('Session existe mais user.value pas encore disponible, attente synchronisation (réseau mobile)...')
    // Attendre jusqu'à 5 secondes que user.value soit synchronisé (10 tentatives de 500ms)
    // Pour tenir compte des réseaux 4G/5G plus lents
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (user.value) {
        addDebugLog(`✅ User.value maintenant disponible après ${(i + 1) * 500}ms`)
        break
      }
    }
  }

  // Marquer la vérification initiale comme terminée
  initialCheckDone.value = true

  // ✅ VÉRIFIER À NOUVEAU user.value après la vérification de session
  // OU utiliser hasActiveSession si user.value n'est pas encore synchronisé
  if (user.value || hasActiveSession) {
    if (user.value) {
      addDebugLog('✅ User already logged in (user.value disponible), processing reward immediately')
      await handleUserLoggedIn()
    } else if (hasActiveSession && sessionData?.session?.user) {
      // ✅ PRIORITÉ : Si session existe mais user.value pas encore synchronisé
      // Utiliser directement la session au lieu d'attendre indéfiniment
      addDebugLog(`✅ Session active détectée - utilisation directe pour éviter l'attente (user: ${sessionData.session.user.email})`)
      const tempUser = { id: sessionData.session.user.id }
      await handleUserLoggedIn(tempUser)
    } else {
      // Session existe mais user.value pas encore synchronisé - attendre encore plus
      // ⚠️ DÉLAI AUGMENTÉ pour les réseaux mobiles (mais seulement si pas de sessionData)
      addDebugLog('⚠️ Session active mais user.value pas synchronisé, dernière tentative (réseau lent)...')
      // Attendre jusqu'à 2 secondes supplémentaires (4 tentatives de 500ms)
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (user.value) {
          addDebugLog(`✅ User.value finalement disponible après ${(i + 1) * 500}ms supplémentaires`)
          await handleUserLoggedIn()
          return
        }
      }
      
      // ✅ Dernière tentative : récupérer la session une dernière fois
      if (hasActiveSession) {
        try {
          // Réutiliser sessionData si disponible, sinon récupérer
          let sessionToUse = sessionData
          if (!sessionToUse?.session?.user) {
            const { data: currentSession } = await supabase.auth.getSession()
            sessionToUse = currentSession
          }
          
          if (sessionToUse?.session?.user) {
            addDebugLog(`✅ Utilisation de la session directe (fallback) pour user: ${sessionToUse.session.user.email}`)
            const tempUser = { id: sessionToUse.session.user.id }
            await handleUserLoggedIn(tempUser)
            return
          }
        } catch (directSessionError) {
          addDebugLog(`❌ Erreur utilisation session directe: ${directSessionError.message}`)
        }
      }
      
      addDebugLog('❌ Impossible de synchroniser user.value et aucune session valide, affichage formulaire')
      showAuthForm.value = true
      isLoading.value = false
    }
  } else {
    addDebugLog('❌ User not logged in, showing auth form directly')
    showAuthForm.value = true
    isLoading.value = false
  }
})

// Variable pour tracker si le composant est monté
let isMounted = true
onUnmounted(() => {
  isMounted = false
  if (authTimeout) clearTimeout(authTimeout)
})

// Fonction pour signaler le début d'une inscription (appelée par AuthForm)
const startRegistration = () => {
  addDebugLog('🔒 Début inscription - watcher désactivé')
  isRegisteringNewUser.value = true
}

// Gérer l'authentification réussie (appelé par AuthForm pour connexion email/password)
const handleUserAuthenticated = async (authenticatedUser) => {
  addDebugLog(`AuthForm reported user authenticated: ${authenticatedUser.id}`)
  
  showAuthForm.value = false
  isLoading.value = true // GARDER LE LOADING jusqu'à la fin
  
  try {
    // ⏰ ATTENDRE que le profil soit vraiment accessible dans la base
    addDebugLog('⏳ Attente que le profil soit accessible pour l\'API...')
    
    let profileAccessible = false
    let attempts = 0
    const maxAttempts = 30 // 30 × 1s = 30 secondes max
    
    while (!profileAccessible && attempts < maxAttempts) {
      attempts++
      addDebugLog(`🔄 Vérification profil - Tentative ${attempts}/${maxAttempts}...`)
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 seconde entre chaque tentative
      
      // Vérifier si le profil est accessible
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authenticatedUser.id)
        .maybeSingle()
      
      if (profile && !error) {
        profileAccessible = true
        addDebugLog(`✅ Profil accessible ! Tentative ${attempts}`)
      }
    }
    
    if (!profileAccessible) {
      addDebugLog('❌ Profil non accessible après 30 secondes')
      scanError.value = true
      scanResult.value = 'Le profil n\'a pas pu être créé. Veuillez réessayer.'
      isLoading.value = false
      return
    }
    
    // ✅ Profil accessible, on peut ajouter le point
    addDebugLog('🎯 Profil accessible, ajout du point...')
    
    if (!hasProcessedReward.value && storedScanUid.value) {
      await handleUserLoggedIn(authenticatedUser)
    }
  } finally {
    // ✅ Désactiver le flag une fois terminé
    isRegisteringNewUser.value = false
  }
}

// Gérer les erreurs d'authentification
const handleAuthError = (errorMessage) => {
  addDebugLog(`Auth error: ${errorMessage}`)
  scanResult.value = errorMessage
  scanError.value = true
  isLoading.value = false
  showAuthForm.value = false // Cacher le formulaire en cas d'erreur
}

const processReward = async (scanUid, userIdOverride = null) => {
  if (hasProcessedReward.value || !isMounted) {
    addDebugLog('Reward already processed or component unmounted')
    return
  }

  try {
    hasProcessedReward.value = true // Marquer comme traité immédiatement
    addDebugLog(`Processing reward for scan UID: ${scanUid}`)

    // ✅ RÉCUPÉRER L'ID UTILISATEUR (depuis user.value, userIdOverride, ou session)
    let userIdToUse = userIdOverride || user.value?.id
    
    // ✅ Si toujours pas d'ID, essayer de récupérer depuis la session
    if (!userIdToUse) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          userIdToUse = sessionData.session.user.id
          addDebugLog(`✅ User ID récupéré depuis la session: ${userIdToUse}`)
        }
      } catch (sessionError) {
        addDebugLog(`Erreur récupération user ID depuis session: ${sessionError.message}`)
      }
    }
    
    if (!userIdToUse) {
      throw new Error('Impossible de récupérer l\'identifiant utilisateur. Veuillez vous reconnecter.')
    }

    // ✅ DÉTECTER LA SOURCE (scanner ou lien direct)
    const source = route.query.source || 'scan_uid'
    const isFromScanner = source === 'scanner'

    addDebugLog(`Source détectée: ${source}, isFromScanner: ${isFromScanner}, userId: ${userIdToUse}`)

    // ✅ APPEL À L'API UNIFIÉE AVEC SOURCE DYNAMIQUE
    console.log('🔄 Appel API add-point depuis page unifiée...')

    const response = await $fetch('/api/rewards/add-point', {
      method: 'POST',
      body: {
        user_id: userIdToUse,
        boutique_slug: scanUid,
        source: source, // 'scanner' ou 'scan_uid'
        points_to_add: 1,
        check_scan_limit: true, // Vérifier limite journalière pour les deux
        check_geolocation: isFromScanner, // ✅ Géoloc uniquement pour scanner
        // Coordonnées demandées seulement si nécessaire
        ...(isFromScanner && {
          user_latitude: null, // Sera géré par l'API si nécessaire
          user_longitude: null
        })
      }
    })

    console.log('✅ Réponse API page unifiée:', response)

    if (response.success) {
      addDebugLog(`API Success: ${response.message}`)
      boutiqueSlug.value = response.data.boutique_slug

      // Navigation immédiate vers la page de remerciement
      if (isMounted) {
        addDebugLog(`Redirecting to /merci?boutique=${response.data.boutique_slug}`)

        // Nettoyer l'URL des paramètres OAuth et source avant la redirection
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)

        await router.replace(`/merci?boutique=${response.data.boutique_slug}`)
      }
    } else {
      throw new Error(response.message || 'Erreur inconnue de l\'API')
    }

  } catch (error) {
    console.error('❌ Erreur lors du traitement de la récompense:', error)
    hasProcessedReward.value = false // Réinitialiser en cas d'erreur

    if (isMounted) {
      // Gestion des erreurs spécifiques de l'API
      if (error.statusCode === 409) {
        scanResult.value = 'Vous avez déjà scanné cette boutique'
      } else if (error.statusCode === 403) {
        scanResult.value = error.message || 'Vous devez être dans la boutique pour scanner'
      } else if (error.statusCode === 404) {
        if (error.message.includes('Boutique')) {
          scanResult.value = 'Boutique non trouvée avec cet identifiant.'
        } else {
          scanResult.value = 'Utilisateur non trouvé. Veuillez vous reconnecter.'
        }
      } else {
        scanResult.value = error.message || 'Une erreur est survenue lors du scan.'
      }

      scanError.value = true
      isLoading.value = false
    }
  }
}

// Debug: afficher l'état en temps réel (à supprimer en production)
const debugState = () => {
  return {
    user: user.value?.id || 'null',
    isLoading: isLoading.value,
    isProcessing: isProcessing.value,
    hasProcessedReward: hasProcessedReward.value,
    showAuthForm: showAuthForm.value,
    scanError: scanError.value,
    storedScanUid: storedScanUid.value,
    initialCheckDone: initialCheckDone.value
  }
}

// Exposer la fonction pour AuthForm
defineExpose({
  startRegistration
})
</script>

<template>
  <div class="py-8">

    <!-- Afficher le loader pendant le traitement -->
    <div v-if="isLoading" class="flex flex-col justify-center items-center">
      <EnhancedLoader v-if="isLoading" />
    </div>

    <!-- Formulaire d'authentification si l'utilisateur n'est pas connecté -->
    <div v-else-if="showAuthForm" class="container mx-auto p-2">
      <div class="">
        <h2 class="text-xl font-semibold text-center mb-6 text-cyan-800">Connectez-vous ou créer un compte  pour obtenir votre points de
          fidélité</h2>
        <AuthForm 
          @registration-started="startRegistration"
          @user-authenticated="handleUserAuthenticated" 
          @auth-error="handleAuthError" 
        />
      </div>
    </div>

    <!-- Afficher uniquement en cas d'erreur -->
    <div v-else-if="scanError" class="mx-auto max-w-2xl">
      <div class="flex justify-center items-center flex-col p-6 md:p-16 gap-5">
        <div class="bg-white/90 backdrop-blur-sm rounded-xl p-8 w-full max-w-md border border-red-100">
          <div class="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x stroke-red-600"
              width="96" height="96" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none"
              stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <circle cx="12" cy="12" r="9" />
              <path d="M10 10l4 4m0 -4l-4 4" />
            </svg>
          </div>

          <p class="text-center text-lg font-medium mb-6 text-red-600">
            {{ scanResult }}
          </p>

          <div class="flex justify-center">
            <NuxtLink to="/"
              class="text-white bg-cyan-700 px-6 py-3 rounded-lg cursor-pointer transition-colors">
              Retour à l'accueil
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Debug info (à supprimer en production) -->
    <!-- 
    <div v-if="process.env.NODE_ENV === 'development'" class="fixed bottom-0 left-0 p-4 bg-black text-white text-xs">
      <pre>{{ JSON.stringify(debugState(), null, 2) }}</pre>
    </div>
    -->
  </div>
</template>