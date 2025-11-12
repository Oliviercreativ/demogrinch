// server/api/admin/search-users.post.js
export default defineEventHandler(async (event) => {
  console.log('=== Search Users API Called ===')

  try {
    const body = await readBody(event)
    const {query} = body

    if (!query || query.length < 2) {
      return {
        success: true,
        users: [],
        message: 'Query too short'
      }
    }

    console.log('Search query:', query)

    // Récupérer TOUS les utilisateurs en paginant
    let allUsers = []
    let page = 1
    const perPage = 1000 // Maximum par page
    let hasMore = true

    while (hasMore) {
      console.log(`Fetching page ${page}...`)

      const response = await $fetch(
        `${process.env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_ROLE_KEY
          }
        }
      )

      const users = response.users || []
      allUsers = allUsers.concat(users)

      console.log(`Page ${page}: ${users.length} users`)

      // Vérifier s'il y a plus de pages
      hasMore = users.length === perPage
      page++

      // Sécurité : limiter à 10 pages max pour éviter les boucles infinies
      if (page > 10) {
        console.log('Maximum pages reached (10)')
        break
      }
    }

    console.log('Total users retrieved:', allUsers.length)

    // Filtrer les utilisateurs selon la requête
    const filteredUsers = allUsers.filter((user) => {
      const email = user.email?.toLowerCase() || ''
      const id = user.id?.toLowerCase() || ''
      const searchTerm = query.toLowerCase()

      return email.includes(searchTerm) || id.includes(searchTerm)
    })

    console.log('Filtered users:', filteredUsers.length)

    // Formater les résultats
    const searchResults = filteredUsers
      .slice(0, 50) // Limiter l'affichage à 50 pour l'interface
      .map((user) => ({
        id: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
          : 'Jamais',
        createdAt: user.created_at
      }))

    return {
      success: true,
      users: searchResults,
      total: filteredUsers.length,
      totalInDb: allUsers.length,
      query: query,
      showing: Math.min(filteredUsers.length, 50)
    }
  } catch (error) {
    console.error('Search users error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to search users: ${error.message}`
    })
  }
})
