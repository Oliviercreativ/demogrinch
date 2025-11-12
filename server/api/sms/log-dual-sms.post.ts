// server/api/sms/log-dual-sms.post.ts
// API adaptée à votre structure sms_logs existante

import { createClient } from '@supabase/supabase-js'

interface DualSMSLogRequest {
  user_id: string
  user_phone: string
  user_name: string
  boutique_name: string
  boutique_slug: string
  immediate_sms: {
    message: string
    response: string
    success: boolean
  }
  delayed_sms: {
    message: string
    response: string
    success: boolean
    delay_seconds: number
  }
  original_trigger_time: string
  webhook_token: string
  processed_at: string
}

export default defineEventHandler(async (event) => {
  try {
    console.log('📝 Log Double SMS reçu de Make.com')

    const body: DualSMSLogRequest = await readBody(event)
    const {
      user_id,
      user_phone,
      user_name,
      boutique_name,
      boutique_slug,
      immediate_sms,
      delayed_sms,
      original_trigger_time,
      webhook_token,
      processed_at
    } = body

    // 1. VÉRIFICATION SÉCURITÉ TOKEN
    if (webhook_token !== process.env.MAKE_WEBHOOK_TOKEN) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token webhook invalide'
      })
    }

    // 2. VALIDATION DES DONNÉES
    if (!user_phone || !immediate_sms || !delayed_sms) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données SMS manquantes'
      })
    }

    console.log(`📱 Log Double SMS: ${user_phone} (${boutique_name})`)
    console.log(`   📤 SMS immédiat: ${immediate_sms.success ? '✅' : '❌'}`)
    console.log(`   ⏰ SMS différé (15s): ${delayed_sms.success ? '✅' : '❌'}`)

    // 3. ENREGISTRER DANS SUPABASE (Structure existante)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Nettoyer le numéro (votre colonne phone est Integer)
    const cleanPhone = parseInt(user_phone.replace(/[\s\-\.]/g, ''))

    // 4. INSÉRER LES 2 SMS SELON VOTRE STRUCTURE EXISTANTE
    const smsLogs = [
      // SMS Immédiat
      {
        // id sera auto-généré par Supabase
        sent_at: original_trigger_time, // Date du déclenchement
        phone: cleanPhone, // Integer selon votre structure
        message: immediate_sms.message,
        status: immediate_sms.success ? 'sent_immediate' : 'failed_immediate',
        response: immediate_sms.response,
        error: immediate_sms.success ? null : 1, // Float: 1 pour erreur, null pour succès
        user_id: user_id
      },
      // SMS Différé
      {
        // id sera auto-généré par Supabase
        sent_at: processed_at, // Date effective d'envoi (après délai)
        phone: cleanPhone, // Integer selon votre structure
        message: delayed_sms.message,
        status: delayed_sms.success ? 'sent_delayed' : 'failed_delayed',
        response: delayed_sms.response,
        error: delayed_sms.success ? null : 1, // Float: 1 pour erreur, null pour succès
        user_id: user_id
      }
    ]

    const { error: insertError, data: insertedData } = await supabase
      .from('sms_logs')
      .insert(smsLogs)
      .select()

    if (insertError) {
      console.error('❌ Erreur insertion logs double SMS:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur enregistrement logs: ' + insertError.message
      })
    }

    // Calculer délai total
    const triggerTime = new Date(original_trigger_time)
    const processedTime = new Date(processed_at)
    const totalDelay = Math.round((processedTime.getTime() - triggerTime.getTime()) / 1000)

    console.log(`✅ Double SMS loggé: ${cleanPhone} (délai total: ${totalDelay}s)`)
    console.log(`📊 ${insertedData?.length || 0} entrées créées dans sms_logs`)

    // 5. RÉPONSE SUCCÈS
    return {
      success: true,
      message: 'Double SMS loggé avec succès',
      data: {
        phone: cleanPhone,
        boutique: boutique_name,
        immediate_sms: {
          sent: immediate_sms.success,
          delay: 0
        },
        delayed_sms: {
          sent: delayed_sms.success,
          delay: delayed_sms.delay_seconds
        },
        total_delay_seconds: totalDelay,
        logs_created: insertedData?.length || 0,
        logged_at: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur log double SMS:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur log double SMS'
    })
  }
})