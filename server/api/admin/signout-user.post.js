// server/api/admin/signout-user.post.js
export default defineEventHandler(async (event) => {
  console.log('=== Calling Edge Function ===')

  try {
    const body = await readBody(event)
    console.log('Request body:', body)

    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'userId is required'
      })
    }

    console.log('Calling Edge Function for userId:', body.userId)
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
    console.log('SUPABASE_ROLE_KEY exists:', !!process.env.SUPABASE_ROLE_KEY)

    // Appeler votre Edge Function avec gestion d'erreur détaillée
    try {
      const response = await $fetch(
        `${process.env.SUPABASE_URL}/functions/v1/disconnect-clients`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_ROLE_KEY
          },
          body: {
            userId: body.userId
          }
        }
      )

      console.log('Edge Function response:', response)
      return response
    } catch (fetchError) {
      console.error('Fetch error details:', {
        status: fetchError.status,
        statusCode: fetchError.statusCode,
        statusText: fetchError.statusText,
        data: fetchError.data,
        message: fetchError.message
      })

      // Essayer d'obtenir plus de détails sur l'erreur
      if (fetchError.data) {
        console.error('Error response body:', fetchError.data)
      }

      throw fetchError
    }
  } catch (error) {
    console.error('=== Edge Function Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status || error.statusCode)
    console.error('Error data:', error.data)

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage:
        error.data?.message || error.message || 'Failed to call Edge Function'
    })
  }
})
