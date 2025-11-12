// composables/useTokenRefresh.ts
export const useTokenRefresh = () => {
  const { $messaging } = useNuxtApp()
  const { saveTokenForUser } = useFirebaseMessaging()
  const user = useSupabaseUser()

  const setupTokenRefresh = () => {
    if (!$messaging) return

    // Écouter les changements de token
    onMessage($messaging, async (payload) => {
      console.log('🔄 Message reçu, vérification token...')
      await checkAndRefreshToken()
    })

    // Vérification périodique (optionnelle)
    setInterval(() => {
      checkAndRefreshToken()
    }, 24 * 60 * 60 * 1000) // Une fois par jour
  }

  const checkAndRefreshToken = async () => {
    if (!user.value) return

    try {
      const { $getToken } = useNuxtApp()
      const newToken = await $getToken()
      
      if (newToken) {
        const storedToken = localStorage.getItem('fcm-token')
        
        if (storedToken !== newToken) {
          console.log('🔄 Nouveau token détecté, mise à jour...')
          await saveTokenForUser(newToken, user.value.id)
          localStorage.setItem('fcm-token', newToken)
        }
      }
    } catch (error) {
      console.error('Erreur refresh token:', error)
    }
  }

  return { setupTokenRefresh, checkAndRefreshToken }
}