import {useSupabaseClient} from '#imports'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  
  // ✅ Vérifier d'abord si une session existe avant de récupérer l'utilisateur
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Si pas de session, rediriger vers login
    if (sessionError || !session) {
      return navigateTo('/login')
    }
    
    // Si session existe, récupérer l'utilisateur
    const {
      data: {user},
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      // ✅ Ne pas logger comme erreur si c'est juste une session manquante (normal)
      if (error?.message?.includes('Auth session missing')) {
        return navigateTo('/login')
      }
      return navigateTo('/login')
    }
  } catch (error) {
    // ✅ Ne pas logger comme erreur si c'est juste une session manquante
    if (error.message?.includes('Auth session missing') || error.message?.includes('session')) {
      return navigateTo('/login')
    }
    console.error(
      "Erreur lors de la vérification de l'authentification:",
      error
    )
    return navigateTo('/login')
  }
})
