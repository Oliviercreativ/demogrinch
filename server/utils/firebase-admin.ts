// server/utils/firebase-admin.ts

/**
 * Obtenir l'instance Firebase Admin (initialisée par le plugin)
 * À utiliser dans vos API serveur
 */
export const getFirebaseAdmin = async () => {
  const admin = await import('firebase-admin').then(m => m.default || m)
  
  if (!admin || !admin.apps || admin.apps.length === 0) {
    throw new Error('Firebase Admin SDK non initialisé')
  }
  
  return admin
}

/**
 * Obtenir le service Messaging de Firebase Admin
 */
export const getFirebaseMessaging = async () => {
  const admin = await getFirebaseAdmin()
  return admin.messaging()
}

/**
 * Raccourci : Envoyer une notification FCM
 * 
 * @example
 * await sendFCMNotification({
 *   token: 'user-fcm-token',
 *   title: 'Hello',
 *   body: 'World'
 * })
 */
export const sendFCMNotification = async (options: {
  token?: string
  tokens?: string[]
  title: string
  body: string
  imageUrl?: string
  data?: Record<string, string>
}) => {
  const messaging = await getFirebaseMessaging()
  
  const message: any = {
    notification: {
      title: options.title,
      body: options.body
    }
  }
  
  if (options.imageUrl) {
    message.notification.imageUrl = options.imageUrl
  }
  
  if (options.data) {
    message.data = options.data
  }
  
  // Envoi à un seul token
  if (options.token) {
    message.token = options.token
    return await messaging.send(message)
  }
  
  // Envoi à plusieurs tokens
  if (options.tokens && options.tokens.length > 0) {
    message.tokens = options.tokens
    return await messaging.sendEachForMulticast(message)
  }
  
  throw new Error('token ou tokens requis')
}

