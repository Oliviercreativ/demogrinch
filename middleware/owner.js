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

  // En mode démo, on autorise l'accès même si l'utilisateur n'est pas owner
  // La page admin gérera l'affichage des boutiques de démo disponibles
  if (error || !data || data.length === 0) {
    // Pas owner, mais on autorise l'accès pour le démo
    // La page admin affichera les boutiques de démo disponibles
  }
  // Accès autorisé (même sans être owner en mode démo)
}) 