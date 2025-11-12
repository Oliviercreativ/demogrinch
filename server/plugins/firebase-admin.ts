// server/plugins/firebase-admin.ts

export default defineNitroPlugin(async (nitroApp) => {
  try {
    // Import dynamique pour éviter les problèmes de bundling
    const admin = await import('firebase-admin').then(m => m.default || m)

    // Vérifier que admin est bien importé
    if (!admin || !admin.apps) {
      console.error('❌ Firebase Admin SDK non disponible - vérifiez l\'installation de firebase-admin')
      return
    }

    // Initialiser Firebase Admin SDK une seule fois
    if (admin.apps.length === 0) {
      const projectId = process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID

      // Option 1 : Variables d'environnement (local)
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      // Option 2 : JSON base64 (Vercel/Netlify)
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64

      let credential

      if (serviceAccountBase64) {
        // Méthode base64 (recommandée pour Vercel/Netlify)
        console.log('🔑 [FCM] Utilisation des credentials en base64')
        try {
          const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
          const serviceAccount = JSON.parse(serviceAccountJson)
          credential = admin.credential.cert(serviceAccount)
        } catch (e) {
          console.error('❌ [FCM] Erreur décodage base64:', e)
          throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 invalide')
        }
      } else if (clientEmail && privateKey && projectId) {
        // Méthode classique (local)
        console.log('🔑 [FCM] Utilisation des credentials séparés')
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      } else {
        console.warn('⚠️ Firebase Admin SDK - Credentials manquants')
        console.warn('   Option A: FIREBASE_SERVICE_ACCOUNT_BASE64 (recommandé Vercel/Netlify)')
        console.warn('   Option B: FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY')
        console.warn('')
        console.warn('📖 Consultez ACTION_IMMEDIATE.md pour configurer')
        return
      }

      admin.initializeApp({ credential })

      console.log('✅ Firebase Admin SDK initialisé avec succès')
      console.log(`📦 Project ID: ${projectId}`)
    } else {
      console.log('ℹ️ Firebase Admin SDK déjà initialisé')
    }
  } catch (error) {
    console.error('❌ Erreur critique initialisation Firebase Admin SDK:', error)
  }
})

