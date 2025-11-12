export const useSupabaseAuth = () => {
  const client = useSupabaseClient()
  const router = useRouter()

  const syncAuthToOtherSite = async (
    accessToken: string,
    refreshToken: string,
    targetSite: string
  ) => {
    try {
      await $fetch(`https://${targetSite}/api/sync-auth`, {
        method: 'POST',
        body: { accessToken, refreshToken }
      })
      console.log(`✅ Sync vers ${targetSite}`)
    } catch (error) {
      console.warn(`⚠️ Erreur sync ${targetSite}:`, error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      const accessToken = data.session?.access_token
      const refreshToken = data.session?.refresh_token

      if (!accessToken || !refreshToken) {
        throw new Error('Tokens manquants')
      }

      await syncAuthToOtherSite(accessToken, refreshToken, 'halloween.grinch.fr')

      await router.push('/')
    } catch (error) {
      console.error('❌ Erreur login:', error)
      throw error
    }
  }

  return { login }
}