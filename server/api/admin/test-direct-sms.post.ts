// server/api/admin/test-direct-sms.post.ts
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { phone, message, token } = body

    if (!phone || !message || !token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'phone, message et token requis'
      })
    }

    // Construire l'URL
    const encodedMessage = encodeURIComponent(message)
    const url = `http://88.202.237.36/sendsms.php?num=${phone}&message=${encodedMessage}&token=${token}`
    
    console.log('🧪 Test direct serveur SMS:', { phone, messageLength: message.length, token })

    // Faire la requête directe
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secondes
    
    const startTime = Date.now()
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Admin-Test-SMS'
        }
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      const responseText = await response.text()
      
      console.log('📱 Réponse serveur SMS:', { 
        status: response.status, 
        responseTime, 
        responseText: responseText.substring(0, 100) 
      })
      
      const isSuccess = response.ok && (
        responseText.toLowerCase().includes('bien envoyé') || 
        responseText.toLowerCase().includes('success') ||
        !responseText.toLowerCase().includes('error')
      )
      
      return {
        success: isSuccess,
        http_status: response.status,
        response_time_ms: responseTime,
        response_text: responseText,
        url_tested: url.replace(token, '***'), // Masquer le token dans la réponse
        timestamp: new Date().toISOString(),
        server_reachable: true
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      console.error('❌ Erreur fetch serveur SMS:', fetchError)
      
      let errorType = 'unknown'
      let errorMessage = fetchError.message
      
      if (fetchError.name === 'AbortError') {
        errorType = 'timeout'
        errorMessage = 'Timeout après 10 secondes'
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        errorType = 'network'
        errorMessage = 'Serveur SMS inaccessible'
      }
      
      return {
        success: false,
        error_type: errorType,
        error_message: errorMessage,
        response_time_ms: responseTime,
        url_tested: url.replace(token, '***'),
        timestamp: new Date().toISOString(),
        server_reachable: false
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erreur API test direct:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur test direct SMS'
    })
  }
})