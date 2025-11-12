export default defineEventHandler(async (event) => {
  console.log('🧹 Début du nettoyage des tokens FCM')
  
  try {
    const supabase = createClient()
    
    // Désactiver les tokens très anciens (plus de 90 jours sans mise à jour)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data: oldTokens, error: updateError } = await supabase
      .from('user_fcm_tokens')
      .update({ 
        active: false,
        invalid_reason: 'Token expired (90+ days old)'
      })
      .eq('active', true)
      .lt('updated_at', ninetyDaysAgo.toISOString())
      .select('id')
    
    if (updateError) {
      throw updateError
    }
    
    console.log(`🧹 ${oldTokens?.length || 0} token(s) ancien(s) désactivé(s)`)
    
    // Supprimer définitivement les tokens inactifs très anciens (plus de 180 jours)
    const oneEightyDaysAgo = new Date()
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180)
    
    const { data: deletedTokens, error: deleteError } = await supabase
      .from('user_fcm_tokens')
      .delete()
      .eq('active', false)
      .lt('updated_at', oneEightyDaysAgo.toISOString())
      .select('id')
    
    if (deleteError) {
      throw deleteError
    }
    
    console.log(`🗑️ ${deletedTokens?.length || 0} token(s) supprimé(s) définitivement`)
    
    return {
      success: true,
      deactivated: oldTokens?.length || 0,
      deleted: deletedTokens?.length || 0,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Erreur nettoyage tokens:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})