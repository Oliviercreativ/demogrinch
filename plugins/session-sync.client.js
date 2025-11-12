// plugins/session-sync.client.js
// Synchronise la session Supabase entre les onglets pour éviter les déconnexions
// quand un nouvel onglet est ouvert (par exemple depuis l'appareil photo)
// Compatible PWA et mode standalone

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!process.client) return

  // 🆔 Générer un ID unique pour cet onglet (sessionStorage est isolé par onglet)
  const tabId = sessionStorage.getItem('tab-id') || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  if (!sessionStorage.getItem('tab-id')) {
    sessionStorage.setItem('tab-id', tabId)
  }

  const supabase = useSupabaseClient()

  // ✅ Détecter si on est en mode PWA (standalone)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://')

  console.log(`[Tab ${tabId}] Session Sync - Mode PWA: ${isPWA}`)

  // ✅ Utiliser BroadcastChannel pour synchroniser entre onglets/PWA
  // BroadcastChannel fonctionne aussi entre les onglets du navigateur et les instances PWA
  let broadcastChannel = null
  try {
    broadcastChannel = new BroadcastChannel('supabase-auth-sync')
    console.log('[Session Sync] BroadcastChannel initialisé')
  } catch (e) {
    console.warn('⚠️ BroadcastChannel non supporté, utilisation de localStorage fallback')
  }
  
  // ✅ En mode PWA, utiliser aussi les messages du service worker si disponible
  let serviceWorkerReady = false
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      serviceWorkerReady = !!registration
      console.log('[Session Sync] Service Worker prêt:', serviceWorkerReady)
    } catch (e) {
      console.warn('[Session Sync] Service Worker non disponible:', e)
    }
  }

  // ✅ Écouter les changements d'état d'authentification
  // ⚠️ CRITIQUE : NE PAS synchroniser entre onglets pour éviter les conflits
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`[Tab ${tabId}] Auth state changed: ${event}`)

    // ✅ Marquer dans localStorage qu'une session est active (pour le cookie-cleanup)
    if (event === 'SIGNED_IN' && session) {
      try {
        localStorage.setItem('supabase-session-active', 'true')
        localStorage.setItem('supabase-session-timestamp', Date.now().toString())
        console.log(`[Tab ${tabId}] ✅ Session active marquée`)
      } catch (e) {
        console.warn(`[Tab ${tabId}] ⚠️ Erreur marquage session:`, e)
      }
    }

    // ✅ Marquer la session comme inactive lors de la déconnexion
    if (event === 'SIGNED_OUT') {
      try {
        localStorage.removeItem('supabase-session-active')
        localStorage.removeItem('supabase-session-timestamp')
        console.log(`[Tab ${tabId}] Session inactive marquée`)
      } catch (e) {
        // Ignorer
      }
    }

    // ⚠️ DÉSACTIVATION de BroadcastChannel pour éviter les conflits multi-onglets
    // Chaque onglet gère maintenant sa session de manière totalement indépendante
  })

  // ⚠️ DÉSACTIVATION BroadcastChannel - Chaque onglet est maintenant totalement indépendant
  // Cela évite les race conditions et conflits de session entre onglets
  console.log(`[Tab ${tabId}] Mode multi-onglets indépendant activé`)

  // ✅ Au démarrage, vérifier si une session existe et la restaurer si nécessaire
  // IMPORTANT : Les cookies peuvent prendre du temps à être disponibles après la fermeture/réouverture
  const checkExistingSession = async () => {
    try {
      // 🔒 Utiliser Web Locks API pour éviter les conflits entre onglets
      if ('locks' in navigator) {
        await navigator.locks.request(`session-check-${tabId}`, async () => {
          console.log(`[Tab ${tabId}] 🔒 Lock acquis pour vérification de session`)

          // Réduit les délais pour une initialisation plus rapide
          const waitTime = isPWA ? 500 : 300
          await new Promise(resolve => setTimeout(resolve, waitTime))

          // ✅ Essayer 3 fois avec des délais réduits
          let sessionFound = false
          for (let attempt = 1; attempt <= 3; attempt++) {
            const { data: session, error } = await supabase.auth.getSession()

            if (session?.session) {
              sessionFound = true
              console.log(`[Tab ${tabId}] ✅ Session trouvée (tentative ${attempt}/3):`, session.session.user?.email)

              // Marquer dans localStorage qu'une session est active
              try {
                localStorage.setItem('supabase-session-active', 'true')
                localStorage.setItem('supabase-session-timestamp', Date.now().toString())
              } catch (e) {
                // Ignorer les erreurs localStorage
              }
              break
            }

            // Si pas de session mais pas d'erreur, attendre un peu
            if (!error && attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 300)) // Réduit à 300ms
            }
          }

          return sessionFound
        })
      } else {
        // Fallback sans Web Locks API
        console.log(`[Tab ${tabId}] ⚠️ Web Locks API non disponible`)

        const waitTime = isPWA ? 500 : 300
        await new Promise(resolve => setTimeout(resolve, waitTime))

        let sessionFound = false
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { data: session, error } = await supabase.auth.getSession()

          if (session?.session) {
            sessionFound = true
            console.log(`[Tab ${tabId}] ✅ Session trouvée (tentative ${attempt}/3):`, session.session.user?.email)

            try {
              localStorage.setItem('supabase-session-active', 'true')
              localStorage.setItem('supabase-session-timestamp', Date.now().toString())
            } catch (e) {
              // Ignorer
            }
            break
          }

          if (!error && attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }
      
      // Note: localStorage fallback supprimé pour éviter les conflits entre onglets
      // Chaque onglet doit gérer sa propre session de manière indépendante
    } catch (e) {
      console.warn(`[Tab ${tabId}] ⚠️ Erreur vérification session:`, e)
    }
  }

  // Délai réduit pour vérification de session (de 1500-2000ms à 300-500ms)
  setTimeout(checkExistingSession, isPWA ? 500 : 300)
  
  // ✅ En mode PWA, écouter aussi les messages du service worker
  if (isPWA && serviceWorkerReady && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'auth-state-change') {
        console.log('[Session Sync] Message reçu du Service Worker:', event.data.event)
        // Le BroadcastChannel devrait déjà gérer ça, mais c'est un fallback supplémentaire
      }
    })
  }
})

