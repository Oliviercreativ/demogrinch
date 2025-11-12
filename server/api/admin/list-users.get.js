// server/api/admin/list-users.get.js
export default defineEventHandler(async (event) => {
  console.log('=== List Users API Called ===')
  console.log('Request method:', getMethod(event))
  console.log('Request URL:', getRequestURL(event))

  try {
    // Vérifier les variables d'environnement
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
    console.log('SUPABASE_ROLE_KEY exists:', !!process.env.SUPABASE_ROLE_KEY)
    console.log(
      'SUPABASE_ROLE_KEY preview:',
      process.env.SUPABASE_ROLE_KEY?.substring(0, 20) + '...'
    )

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ROLE_KEY) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing Supabase configuration'
      })
    }

    const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users`
    console.log('Request URL:', url)

    const headers = {
      Authorization: `Bearer ${process.env.SUPABASE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ROLE_KEY
    }

    // Utiliser l'API REST directement
    console.log('Making request to Supabase...')
    const response = await $fetch(url, {
      method: 'GET',
      headers
    })

    console.log('Supabase response received:', {
      hasUsers: !!response.users,
      userCount: response.users?.length || 0
    })

    const users = response.users || []

    // Afficher TOUS les utilisateurs (pas de filtre par date)
    const allSessions = users.map((user) => ({
      id: user.id,
      email: user.email,
      lastActivity: user.last_sign_in_at,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
        : 'Jamais'
    }))

    console.log('Total sessions found:', allSessions.length)
    console.log('=== List Users API Success ===')

    return {
      success: true,
      sessions: allSessions,
      total: allSessions.length
    }
  } catch (error) {
    console.error('=== List Users API Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status || error.statusCode)
    console.error('Error response:', error.data)
    console.error('Full error:', error)
    console.error('=== End Error ===')

    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: `Failed to list users: ${error.message || 'Unknown error'}`
    })
  }
})
