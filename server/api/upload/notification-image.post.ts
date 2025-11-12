// server/api/upload/notification-image.post.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun fichier fourni'
      })
    }

    const file = formData[0]
    if (!file.data || !file.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Fichier invalide'
      })
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type de fichier non autorisé'
      })
    }

    // Vérifier la taille (5MB max)
    if (file.data.length > 5 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Fichier trop volumineux (max 5MB)'
      })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const extension = file.filename.split('.').pop() || 'jpg'
    const filename = `notification-${timestamp}-${randomId}.${extension}`

    // Créer le client Supabase avec Service Role Key
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload direct sans redimensionnement (pour l'instant)
    const { data, error } = await supabase.storage
      .from('notification-images')
      .upload(filename, file.data, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600'
      })

    if (error) {
      console.error('Erreur upload:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de l\'upload'
      })
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('notification-images')
      .getPublicUrl(filename)

    return {
      success: true,
      filename: data.path,
      url: urlData.publicUrl,
      size: file.data.length,
      dimensions: 'Original (redimensionnement côté client)'
    }

  } catch (error) {
    console.error('Erreur upload image:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur serveur'
    })
  }
})
