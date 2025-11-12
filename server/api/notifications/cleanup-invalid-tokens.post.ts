// server/api/notifications/cleanup-invalid-tokens.post.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('🧹 Nettoyage des tokens invalides...')
  
  try {
    const { invalidTokens } = await readBody(event)
    
    if (!invalidTokens || !Array.isArray(invalidTokens)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Liste de tokens invalides requise'
      })
    }

    const supabase = await serverSupabaseClient(event)
    
    // Désactiver les tokens invalides
    const { data, error } = await supabase
      .from('user_fcm_tokens')
      .update({ 
        active: false,
        invalid_reason: 'Token invalidated by FCM',
        updated_at: new Date().toISOString()
      })
      .in('token', invalidTokens)
      .select()

    if (error) {
      throw error
    }

    console.log(`✅ ${data.length} token(s) invalide(s) désactivé(s)`)

    return {
      success: true,
      cleanedTokens: data.length
    }

  } catch (error) {
    console.error('❌ Erreur nettoyage tokens:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})