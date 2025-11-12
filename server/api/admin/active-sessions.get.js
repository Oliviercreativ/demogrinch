// server/api/admin/signout-user.post.js
export default defineEventHandler(async (event) => {
  console.log('=== Signout User API Called ===')

  try {
    const body = await readBody(event)
    console.log('Request body:', body)

    if (!body.userId) {
      console.log('Error: userId is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'userId is required'
      })
    }

    console.log('Target userId:', body.userId)
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
    console.log(
      'SUPABASE_ROLE_KEY exists:',
      !!process.env.SUPABASE_ROLE_KEY
    )

    const url = `${process.env.SUPABASE_URL}/auth/v1/admin/users/${body.userId}/signout`
    console.log('Request URL:', url)

    const headers = {
      Authorization: `Bearer ${process.env.SUPABASE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ROLE_KEY
    }
    console.log(
      'Authorization header preview:',
      headers.Authorization?.substring(0, 30) + '...'
    )

    console.log('Making signout request...')
    const response = await $fetch(url, {
      method: 'POST',
      headers
    })

    console.log('Signout response:', response)
    console.log('=== Signout User API Success ===')

    return {
      success: true,
      message: `User ${body.userId} has been signed out`
    }
  } catch (error) {
    console.error('=== Signout User API Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status || error.statusCode)
    console.error('Error response:', error.data)
    console.error('Full error:', error)
    console.error('=== End Error ===')

    if (error.status === 404 || error.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    throw createError({
      statusCode: error.status || error.statusCode || 500,
      statusMessage: `Failed to sign out user: ${
        error.message || 'Unknown error'
      }`
    })
  }
})
