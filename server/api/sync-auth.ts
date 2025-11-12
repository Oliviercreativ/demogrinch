export default defineEventHandler(async (event) => {
  try {
    const { accessToken, refreshToken } = await readBody(event)

    if (!accessToken || !refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tokens manquants'
      })
    }

    const supabase = useSupabaseClient()

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (error) {
      throw createError({
        statusCode: 401,
        statusMessage: `Erreur auth: ${error.message}`
      })
    }

    console.log('✅ Session créée sur site-a')

    return {
      success: true,
      user: data.user?.email
    }
  } catch (error) {
    console.error('❌ Erreur sync-auth:', error)
    throw error
  }
})
