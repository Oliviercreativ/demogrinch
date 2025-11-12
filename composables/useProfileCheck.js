import {computed} from 'vue'
import {useSupabaseUser, useSupabaseClient, useRouter} from '#imports'

export const useProfileCheck = () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const checkProfile = async () => {
    if (!user.value) {
      console.log(
        'Utilisateur non authentifié, redirection vers la page de connexion'
      )
      return router.push('/')
    }

    const userId = user.value.id

    try {
      const {data: profile, error} = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!profile) {
        console.log(
          'Profil non trouvé, redirection vers la page de création de profil'
        )
        return router.push(`/create-profil?userId=${userId}`)
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la vérification du profil:', error.message)
      return router.push('/error')
    }
  }
  return {checkProfile}
}
