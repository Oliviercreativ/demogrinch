// plugins/auth.client.js
export default defineNuxtPlugin(async (nuxtApp) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Gérer la visibilité de la page
  if (process.client) {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        // Vérifier et rafraîchir la session quand l'onglet redevient actif
        try {
          const {
            data: {session},
            error
          } = await supabase.auth.getSession()
          
          // ✅ Ne pas traiter comme erreur si c'est juste une session manquante
          if (error && !error.message?.includes('Auth session missing')) {
            throw error
          }

          if (session) {
            await supabase.auth.refreshSession()
          }
        } catch (error) {
          // ✅ Ne pas logger comme erreur si c'est juste une session manquante
          if (error.message?.includes('Auth session missing') || error.message?.includes('session')) {
            // Session manquante = normal si l'utilisateur n'est pas connecté
            return
          }
          console.error('Erreur de session:', error)
          // Recharger la page en cas d'erreur de session (sauf si c'est juste une session manquante)
          window.location.reload()
        }
      }
    })

    // Gérer la reconnexion réseau
    window.addEventListener('online', async () => {
      try {
        const {
          data: {session},
          error
        } = await supabase.auth.getSession()
        
        // ✅ Ne pas traiter comme erreur si c'est juste une session manquante
        if (error && !error.message?.includes('Auth session missing')) {
          throw error
        }

        if (session) {
          await supabase.auth.refreshSession()
        }
      } catch (error) {
        // ✅ Ne pas logger comme erreur si c'est juste une session manquante
        if (error.message?.includes('Auth session missing') || error.message?.includes('session')) {
          // Session manquante = normal si l'utilisateur n'est pas connecté
          return
        }
        console.error('Erreur de connexion:', error)
        window.location.reload()
      }
    })
  }
})
