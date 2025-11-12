// server/api/sendsms.ts - Version corrigée
import { createClient } from '@supabase/supabase-js'

interface SMSRequest {
  phone: string
  message: string
  user_id?: string
}

interface SMSResponse {
  success: boolean
  message?: string
  response?: string
  phone?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<SMSResponse> => {
  let phone = ''
  let message = ''
  let user_id: string | undefined
  let supabase: any

  try {
    console.log('🚀 Début API sendsms')

    // ✅ VÉRIFICATIONS PRÉLIMINAIRES
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Variables Supabase manquantes')
      throw createError({
        statusCode: 500,
        statusMessage: 'Configuration Supabase manquante'
      })
    }

    // Initialisation Supabase avec gestion d'erreur
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      console.log('✅ Supabase initialisé')
    } catch (supabaseError) {
      console.error('❌ Erreur init Supabase:', supabaseError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur connexion Supabase'
      })
    }

    // Récupérer les paramètres avec gestion d'erreur
    try {
      const query = getQuery(event)
      let body = {}
      
      // ✅ LECTURE BODY SÉCURISÉE
      try {
        body = await readBody(event)
      } catch (bodyError) {
        console.log('📝 Pas de body, utilisation query params uniquement')
        body = {}
      }
      
      phone = (query.phone as string) || (body as any).phone || ''
      message = (query.message as string) || (body as any).message || ''
      user_id = (query.user_id as string) || (body as any).user_id

      console.log('📱 Paramètres:', { 
        hasPhone: !!phone, 
        messageLength: message.length,
        hasUserId: !!user_id 
      })

    } catch (paramError) {
      console.error('❌ Erreur lecture paramètres:', paramError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Erreur lecture paramètres'
      })
    }
    
    // Validation des paramètres obligatoires
    if (!phone || !message) {
      const errorMsg = 'phone et message sont requis'
      console.error('❌ Paramètres manquants')
      
      // Logger sans faire planter l'API
      try {
        await supabase.from('sms_logs').insert({
          phone: phone || 'N/A',
          message: message ? 'présent' : 'N/A',
          status: 'validation_error',
          response: null,
          error: errorMsg,
          sent_at: new Date().toISOString(),
          user_id: user_id || null
        })
      } catch (logError) {
        console.warn('⚠️ Erreur logging validation (ignorée):', logError)
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg
      })
    }

    // Validation du format téléphone
    const cleanPhone = phone.replace(/\s+/g, '')
    if (!/^(\+33|0)[1-9](\d{8})$/.test(cleanPhone)) {
      const errorMsg = 'Format de téléphone invalide'
      console.error('❌ Format téléphone invalide:', cleanPhone)
      
      // Logger sans faire planter l'API
      try {
        await supabase.from('sms_logs').insert({
          phone: cleanPhone,
          message: 'format_check',
          status: 'format_error',
          response: null,
          error: errorMsg,
          sent_at: new Date().toISOString(),
          user_id: user_id || null
        })
      } catch (logError) {
        console.warn('⚠️ Erreur logging format (ignorée):', logError)
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg
      })
    }

    // ✅ VÉRIFICATION TOKEN SMS
    const token = process.env.SMS_API_TOKEN
    if (!token) {
      console.error('❌ SMS_API_TOKEN manquant')
      throw createError({
        statusCode: 500,
        statusMessage: 'Configuration SMS manquante'
      })
    }
    
    // Encoder le message
    let encodedMessage
    try {
      encodedMessage = encodeURIComponent(message)
    } catch (encodeError) {
      console.error('❌ Erreur encodage message:', encodeError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Erreur encodage message'
      })
    }
    
    // Construire l'URL
    const url = `http://88.202.237.36/sendsms.php?num=${cleanPhone}&message=${encodedMessage}&token=${token}`
    
    console.log('📤 Envoi SMS vers:', cleanPhone.substring(0, 4) + '****')
    
    // ✅ REQUÊTE SMS AVEC GESTION D'ERREUR ROBUSTE
    let response
    let responseText = ''
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Nuxt-SMS-API'
        }
      })
      
      clearTimeout(timeoutId)
      responseText = await response.text()
      
      console.log('📱 Réponse SMS:', { 
        status: response.status, 
        responseLength: responseText.length 
      })
      
    } catch (fetchError: any) {
      console.error('❌ Erreur requête SMS:', fetchError)
      
      // Logger l'erreur de connexion
      try {
        await supabase.from('sms_logs').insert({
          phone: cleanPhone,
          message: 'fetch_error',
          status: 'network_error',
          response: null,
          error: fetchError.message || 'Erreur réseau',
          sent_at: new Date().toISOString(),
          user_id: user_id || null
        })
      } catch (logError) {
        console.warn('⚠️ Erreur logging network (ignorée):', logError)
      }
      
      throw createError({
        statusCode: 503,
        statusMessage: 'Service SMS temporairement indisponible'
      })
    }
    
    // Vérifier le statut HTTP
    if (!response.ok) {
      const errorMessage = `Erreur serveur SMS (${response.status})`
      console.error('❌ Erreur HTTP SMS:', response.status)
      
      // Logger l'erreur HTTP
      try {
        await supabase.from('sms_logs').insert({
          phone: cleanPhone,
          message: 'http_error',
          status: 'http_error',
          response: responseText,
          error: errorMessage,
          sent_at: new Date().toISOString(),
          user_id: user_id || null
        })
      } catch (logError) {
        console.warn('⚠️ Erreur logging HTTP (ignorée):', logError)
      }
      
      throw createError({
        statusCode: 502,
        statusMessage: errorMessage
      })
    }

    // Analyser la réponse
    const isSuccess = responseText.toLowerCase().includes('bien envoyé') || 
                     responseText.toLowerCase().includes('success') ||
                     !responseText.toLowerCase().includes('error')

    // Logger le succès
    try {
      await supabase.from('sms_logs').insert({
        phone: cleanPhone,
        message: message.substring(0, 50), // Limiter pour éviter les messages trop longs
        status: isSuccess ? 'success' : 'warning',
        response: responseText.substring(0, 200), // Limiter la réponse
        error: isSuccess ? null : 'Réponse ambiguë',
        sent_at: new Date().toISOString(),
        user_id: user_id || null
      })
      console.log('✅ SMS loggé avec succès')
    } catch (logError) {
      console.warn('⚠️ Erreur logging succès (ignorée):', logError)
      // Ne pas faire planter l'API
    }
    
    return {
      success: isSuccess,
      message: isSuccess ? 'SMS envoyé avec succès' : 'SMS possiblement envoyé',
      response: responseText,
      phone: cleanPhone
    }

  } catch (error: any) {
    console.error('❌ Erreur générale SMS:', error)
    
    // Si c'est déjà une erreur HTTP, la renvoyer telle quelle
    if (error.statusCode) {
      throw error
    }
    
    // Sinon, logger et renvoyer erreur 500
    if (supabase) {
      try {
        await supabase.from('sms_logs').insert({
          phone: phone || 'unknown',
          message: 'system_error',
          status: 'system_error',
          response: null,
          error: error.message || 'Erreur système inconnue',
          sent_at: new Date().toISOString(),
          user_id: user_id || null
        })
      } catch (logError) {
        console.warn('⚠️ Erreur logging final (ignorée):', logError)
      }
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur SMS'
    })
  }
})