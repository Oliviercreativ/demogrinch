// server/api/notifications/send.post.ts
import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('📤 [SEND] Envoi de notifications FCM...')

  // Import dynamique de firebase-admin
  const admin = await import('firebase-admin').then(m => m.default || m)

  // Vérifier que Firebase Admin est initialisé
  if (!admin || !admin.apps || admin.apps.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Firebase Admin SDK non initialisé. Vérifiez vos variables d\'environnement.'
    })
  }

  try {
    // Récupérer le body
    const body = await readBody(event)
    const { 
      user_ids, 
      targetType,
      selectedUserId,
      title, 
      message: bodyMessage, 
      data = {}, 
      link_url,
      image_url 
    } = body

    // Déterminer les user_ids selon le type de ciblage
    let targetUserIds = []
    
    if (user_ids && Array.isArray(user_ids)) {
      // Format direct avec user_ids
      targetUserIds = user_ids
    } else if (targetType === 'all') {
      // Récupérer tous les utilisateurs avec tokens actifs (avec Service Role pour bypasser RLS)
      const supabaseServiceRole = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: tokens } = await supabaseServiceRole
        .from('user_fcm_tokens')
        .select('user_id')
        .eq('active', true)
      
      console.log(`🔍 [SEND] Tokens trouvés pour 'all':`, tokens?.length || 0)
      targetUserIds = tokens ? [...new Set(tokens.map(t => t.user_id))] : []
      console.log(`🔍 [SEND] Utilisateurs uniques pour 'all':`, targetUserIds.length)
    } else if (targetType === 'user' && selectedUserId) {
      // Utilisateur spécifique
      targetUserIds = [selectedUserId]
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'user_ids (array) ou targetType requis'
      })
    }

    // Validation finale
    if (targetUserIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun utilisateur ciblé trouvé'
      })
    }

    if (!title || !bodyMessage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'title et message requis'
      })
    }

    // Récupérer les tokens FCM des utilisateurs (avec Service Role pour bypasser RLS)
    const supabaseServiceRole = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: tokens, error: tokensError } = await supabaseServiceRole
      .from('user_fcm_tokens')
      .select('token')
      .in('user_id', targetUserIds)
      .eq('active', true)

    if (tokensError) {
      throw tokensError
    }

    if (!tokens || tokens.length === 0) {
      return {
        success: true,
        message: 'Aucun token actif trouvé pour ces utilisateurs',
        sentCount: 0
      }
    }

    console.log(`📱 [SEND] ${tokens.length} token(s) trouvé(s)`)

    // Préparer le message FCM
    const fcmMessage: any = {
      notification: {
        title: title,
        body: bodyMessage
      },
      data: {
        ...data,
        click_action: link_url || '/',
        timestamp: new Date().toISOString()
      },
      tokens: tokens.map(t => t.token)
    }

    // Ajouter l'image si fournie
    if (image_url) {
      fcmMessage.notification.imageUrl = image_url
    }

    // Envoyer la notification via FCM
    console.log('🚀 [SEND] Envoi via FCM...')
    const response = await admin.messaging().sendEachForMulticast(fcmMessage)

    console.log(`✅ [SEND] Succès: ${response.successCount}/${tokens.length}`)
    console.log(`❌ [SEND] Échecs: ${response.failureCount}`)

    // Gérer les tokens invalides
    const invalidTokens: string[] = []
    
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code
        
        // Codes d'erreur indiquant un token invalide
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx].token)
        }
      }
    })

    // Désactiver les tokens invalides
    if (invalidTokens.length > 0) {
      console.log(`🧹 [SEND] Nettoyage de ${invalidTokens.length} token(s) invalide(s)`)
      
      const { error: cleanupError } = await supabaseServiceRole
        .from('user_fcm_tokens')
        .update({ 
          active: false,
          invalid_reason: 'Token invalidated by FCM',
          updated_at: new Date().toISOString()
        })
        .in('token', invalidTokens)

      if (cleanupError) {
        console.error('❌ [SEND] Erreur nettoyage tokens:', cleanupError)
      } else {
        console.log('✅ [SEND] Tokens invalides nettoyés')
      }
    }

    return {
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokensCleaned: invalidTokens.length,
      details: response.responses.map((r, i) => ({
        success: r.success,
        error: r.error?.message,
        messageId: r.messageId
      }))
    }

  } catch (error: any) {
    console.error('❌ [SEND] Erreur envoi notifications:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur lors de l\'envoi des notifications'
    })
  }
})

