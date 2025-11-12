import { useSupabaseUser, useSupabaseClient } from '#imports'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // Si pas connecté, on redirige vers la page de login
  if (!user.value) {
    return navigateTo('/login')
  }

  // Vérifier si l'utilisateur est owner d'au moins une boutique active
  const { data, error } = await supabase
    .from('boutique')
    .select('id')
    .eq('owner', user.value.id)
    .eq('statut', true)

  if (error || !data || data.length === 0) {
    // Pas owner, on redirige
    return navigateTo('/')
  }
  // Sinon, accès autorisé
}) 