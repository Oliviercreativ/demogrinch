// composables/useFirebaseMessaging.ts - VERSION CORRIGÉE
export const useFirebaseMessaging = () => {
  const { $messaging, $getToken } = useNuxtApp()
  const config = useRuntimeConfig()
  
  const requestPermission = async () => {
    console.log('🚀 [FCM] Début de requestPermission')
    
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées par ce navigateur')
      }

      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers non supportés par ce navigateur')
      }

      console.log('✅ [FCM] Support navigateur OK')

      // Vérifier d'abord la permission actuelle
      const currentPermission = Notification.permission
      console.log('🔐 [FCM] Permission actuelle:', currentPermission)

      if (currentPermission === 'denied') {
        throw new Error('Les notifications sont bloquées dans votre navigateur. Veuillez les autoriser dans les paramètres.')
      }

      // Vérifier la clé VAPID
      if (!config.public.vapidKey) {
        throw new Error('VAPID key manquante dans la configuration')
      }

      // 🔒 Vérifier si le service worker est déjà enregistré pour éviter les conflits multi-onglets
      console.log('🔧 [FCM] Vérification des service workers existants...')

      let registration = await navigator.serviceWorker.getRegistration('/')

      if (registration && registration.active?.scriptURL.includes('firebase-messaging-sw.js')) {
        console.log('✅ [FCM] Service worker Firebase déjà enregistré, réutilisation')
      } else {
        console.log('🔧 [FCM] Enregistrement du service worker Firebase...')
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none' // Éviter les problèmes de cache entre onglets
        })
      }

      console.log('⏳ [FCM] Attente que le service worker soit prêt...')
      await navigator.serviceWorker.ready
      console.log('✅ [FCM] Service worker prêt')

      // Attendre que le service worker soit vraiment actif
      let activeWorker = registration.active
      if (!activeWorker) {
        console.log('⏳ [FCM] Attente activation du service worker...')
        // Attendre l'installation et l'activation
        await new Promise((resolve) => {
          if (registration.installing) {
            registration.installing.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') {
                resolve()
              }
            })
          } else if (registration.waiting) {
            registration.waiting.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') {
                resolve()
              }
            })
          } else {
            resolve() // Déjà actif
          }
        })
        activeWorker = registration.active
      }

      console.log('✅ [FCM] Service worker actif:', activeWorker?.state)

      // Envoyer la config au service worker
      if (activeWorker) {
        activeWorker.postMessage({
          type: 'FIREBASE_CONFIG',
          config: {
            apiKey: config.public.apiKey,
            authDomain: config.public.authDomain,
            projectId: config.public.projectId,
            storageBucket: config.public.storageBucket,
            messagingSenderId: config.public.messagingSenderId,
            appId: config.public.appId
          }
        })
        console.log('✅ [FCM] Config envoyée au service worker')
      }

      // Demander la permission
      console.log('🔐 [FCM] Demande de permission...')
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        if (permission === 'denied') {
          throw new Error('Notifications bloquées. Autorisez-les dans les paramètres de votre navigateur.')
        } else {
          throw new Error('Permission de notification refusée')
        }
      }

      // Obtenir le token FCM avec le service worker registration
      console.log('🔑 [FCM] Récupération du token avec le service worker...')
      
      // Utiliser directement getToken de Firebase avec la registration
      const { getToken } = await import('firebase/messaging')
      const token = await getToken($messaging, {
        vapidKey: config.public.vapidKey,
        serviceWorkerRegistration: registration
      })
      
      if (!token) {
        console.error('❌ [FCM] Token vide retourné')
        throw new Error('Token FCM vide')
      }

      console.log('✅ [FCM] Token obtenu avec succès:', token.substring(0, 40) + '...')
      console.log('✅ [FCM] Setup complet avec succès')
      return token
      
    } catch (error) {
      console.error('❌ [FCM] Erreur setup:', error)
      throw error
    }
  }

  const saveTokenForUser = async (token, userId) => {
    console.log('💾 [TOKEN] Sauvegarde pour utilisateur:', userId)
    console.log('💾 [TOKEN] Token à sauvegarder:', token.substring(0, 40) + '...')
    
    try {
      const supabase = useSupabaseClient()
      
      if (!supabase) {
        console.error('❌ [TOKEN] Supabase client non disponible')
        throw new Error('Supabase client non disponible')
      }
      
      console.log('✅ [TOKEN] Supabase client OK')
      
      // Vérifier si ce token existe déjà pour cet utilisateur
      console.log('🔍 [TOKEN] Vérification si le token existe déjà...')
      const { data: existingToken, error: selectError } = await supabase
        .from('user_fcm_tokens')
        .select('id, active')
        .eq('user_id', userId)
        .eq('token', token)
        .maybeSingle()
      
      if (selectError) {
        console.error('❌ [TOKEN] Erreur lors de la vérification:', selectError)
        throw selectError
      }
      
      console.log('🔍 [TOKEN] Token existant:', existingToken ? 'Oui (ID: ' + existingToken.id + ')' : 'Non')
      
      if (existingToken) {
        // Token existe déjà → Juste mettre à jour la date et réactiver
        console.log('🔄 [TOKEN] Token existant trouvé, mise à jour...')
        
        const { data, error } = await supabase
          .from('user_fcm_tokens')
          .update({ 
            active: true,
            updated_at: new Date().toISOString(),
            device_info: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              platform: navigator.platform
            }
          })
          .eq('id', existingToken.id)
          .select()

        if (error) {
          console.error('❌ [TOKEN] Erreur UPDATE:', error)
          throw error
        }
        
        console.log('✅ [TOKEN] Token mis à jour avec succès:', data)
        return { action: 'updated', data }
        
      } else {
        // Nouveau token → Insérer (SANS désactiver les autres)
        console.log('🆕 [TOKEN] Nouveau token, insertion en base...')
        
        const insertData = {
          user_id: userId,
          token: token,
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            platform: navigator.platform
          },
          active: true
        }
        
        console.log('📝 [TOKEN] Données à insérer:', {
          user_id: userId,
          token_preview: token.substring(0, 30) + '...',
          platform: navigator.platform
        })
        
        const { data, error } = await supabase
          .from('user_fcm_tokens')
          .insert(insertData)
          .select()

        if (error) {
          console.error('❌ [TOKEN] Erreur INSERT:', error)
          console.error('❌ [TOKEN] Code erreur:', error.code)
          console.error('❌ [TOKEN] Message:', error.message)
          console.error('❌ [TOKEN] Details:', error.details)
          throw error
        }
        
        console.log('✅ [TOKEN] Nouveau token créé avec succès:', data)
        return { action: 'created', data }
      }
      
    } catch (error) {
      console.error('❌ [TOKEN] Erreur critique sauvegarde:', error)
      console.error('❌ [TOKEN] Type erreur:', error.constructor.name)
      console.error('❌ [TOKEN] Stack:', error.stack)
      throw error
    }
  }

  // ✅ AJOUT de la fonction manquante
  const testDatabaseConnection = async () => {
    console.log('🧪 [TEST] Test de connexion base de données')
    
    try {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!supabase) {
        throw new Error('Supabase client non disponible')
      }
      
      console.log('🧪 [TEST] User connecté:', !!user.value)
      
      // Test table user_fcm_tokens
      const { data, error } = await supabase
        .from('user_fcm_tokens')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('❌ [TEST] Erreur:', error)
        return { 
          success: false, 
          error,
          tableExists: false
        }
      } else {
        console.log('✅ [TEST] Table accessible')
        return { 
          success: true,
          tableExists: true
        }
      }
      
    } catch (error) {
      console.error('❌ [TEST] Erreur globale:', error)
      return { 
        success: false, 
        error
      }
    }
  }

  // ✅ AJOUT de la fonction de notification de bienvenue
  const sendTestNotification = async (userName?: string) => {
    console.log('🎉 [WELCOME] Envoi notification de bienvenue via FCM')
    
    try {
      const user = useSupabaseUser()
      if (!user.value) {
        throw new Error('Utilisateur non connecté')
      }

      // Message personnalisé si on a le nom
      const title = userName 
        ? `🎉 Bienvenue ${userName} !` 
        : '🎉 Bienvenue sur Grinch !'
      
      const body = 'Merci d\'avoir activé les notifications ! Vous recevrez désormais les meilleures offres des commerçants de Conflans.'

      // Envoyer via l'API FCM
      const response = await $fetch('/api/notifications/send', {
        method: 'POST',
        body: {
          title,
          message: body,
          targetType: 'user',
          selectedUserId: user.value.id,
          linkUrl: '/',
          imageUrl: '/pwa-512x512.png'
        }
      })

      console.log('✅ [WELCOME] Notification de bienvenue envoyée via FCM:', response)
      return response
      
    } catch (error) {
      console.error('❌ [WELCOME] Erreur notification:', error)
      // Ne pas faire échouer le processus principal
    }
  }

  // ✅ AJOUT : Obtenir les tokens actifs d'un utilisateur
  const getUserActiveTokens = async (userId) => {
    console.log('🔍 [TOKENS] Récupération des tokens actifs pour:', userId)
    
    try {
      const supabase = useSupabaseClient()
      
      const { data, error } = await supabase
        .from('user_fcm_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      console.log(`✅ [TOKENS] ${data?.length || 0} token(s) actif(s) trouvé(s)`)
      return data || []
      
    } catch (error) {
      console.error('❌ [TOKENS] Erreur récupération:', error)
      return []
    }
  }

  // ✅ AJOUT : Rafraîchir le token d'un utilisateur
  const refreshUserToken = async (userId) => {
    console.log('🔄 [REFRESH] Rafraîchissement du token pour:', userId)
    
    try {
      const { $getToken } = useNuxtApp()
      const newToken = await $getToken()
      
      if (!newToken) {
        throw new Error('Impossible d\'obtenir un nouveau token')
      }

      console.log('✅ [REFRESH] Nouveau token obtenu')
      
      // Sauvegarder le nouveau token (désactive automatiquement les anciens)
      await saveTokenForUser(newToken, userId)
      
      console.log('✅ [REFRESH] Token rafraîchi avec succès')
      return newToken
      
    } catch (error) {
      console.error('❌ [REFRESH] Erreur rafraîchissement:', error)
      throw error
    }
  }

  return {
    requestPermission,
    saveTokenForUser,
    testDatabaseConnection,
    sendTestNotification,
    getUserActiveTokens, // ✅ AJOUTÉ
    refreshUserToken // ✅ AJOUTÉ
  }
}