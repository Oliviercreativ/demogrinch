export const useShareLink = () => {
  const client = useSupabaseClient()

  const generateMagicLink = async (email: string) => {
    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: {
        // Redirige vers site-b avec le token
        emailRedirectTo: `https://halloween.grinch.fr/fidelite`
      }
    })

    if (error) throw error

    return {
      message: 'Lien magique envoyé par email',
      email: data?.user?.email
    }
  }

  return { generateMagicLink }
}
