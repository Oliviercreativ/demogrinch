// server/api/admin/signout-all-users.post.js
import {createClient} from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    // Créer le client admin avec la clé service role
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ROLE_KEY, // Utilisez la clé service role
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer tous les utilisateurs
    const {data: users, error: listError} =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to list users: ${listError.message}`
      })
    }

    // Déconnecter tous les utilisateurs
    let successCount = 0
    const errors = []

    for (const user of users.users) {
      try {
        const {error} = await supabaseAdmin.auth.admin.signOut(user.id)
        if (error) {
          errors.push(`Failed to sign out ${user.email}: ${error.message}`)
        } else {
          successCount++
        }
      } catch (err) {
        errors.push(`Failed to sign out ${user.email}: ${err.message}`)
      }
    }

    return {
      success: true,
      count: successCount,
      total: users.users.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully signed out ${successCount} users`
    }
  } catch (error) {
    console.error('Sign out all users API error:', error)
    throw error
  }
})
