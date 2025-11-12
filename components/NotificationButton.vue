<!-- components/NotificationStrategy.vue -->
<template>
  <div>
    <!-- Étape 1: Soft prompt après engagement -->
    <div v-if="showSoftPrompt" class="notification-soft-prompt bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
      <div class="flex items-start gap-3">
        <div class="text-blue-600 mt-1">🔔</div>
        <div class="flex-1">
          <h3 class="font-semibold text-blue-900">Restez informé</h3>
          <p class="text-blue-700 text-sm mt-1">
            Recevez les dernières offres et nouveautés des boutiques de Conflans
          </p>
          <div class="flex gap-2 mt-3">
            <button @click="requestNotifications"
              class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              Oui, m'alerter
            </button>
            <button @click="dismissSoftPrompt" class="text-blue-600 px-4 py-2 text-sm hover:bg-blue-100 rounded-md">
              Plus tard
            </button>
          </div>
        </div>
        <button @click="dismissSoftPrompt" class="text-blue-400 hover:text-blue-600">
          ×
        </button>
      </div>
    </div>

    <!-- Étape 2: Bouton discret pour ceux qui ont refusé -->
    <button v-if="showDiscreteButton" @click="requestNotifications"
      class="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-40"
      title="Activer les notifications">
      🔔
    </button>
  </div>
</template>

<script setup>
const { requestPermission, saveTokenForUser, sendTestNotification } = useFirebaseMessaging()
const user = useSupabaseUser()

const showSoftPrompt = ref(false)
const showDiscreteButton = ref(false)

onMounted(async () => {
  // Vérifier si l'utilisateur a déjà répondu
  const hasResponded = localStorage.getItem('notification-permission-asked')
  if (hasResponded) {
    console.log('ℹ️ Utilisateur a déjà répondu à la demande de notification')
    return
  }

  // Vérifier si l'utilisateur a déjà des notifications actives
  if (user.value) {
    const { getUserActiveTokens } = useFirebaseMessaging()
    const tokens = await getUserActiveTokens(user.value.id)
    
    // Si l'utilisateur a déjà des tokens actifs, ne pas afficher la popup
    if (tokens && tokens.length > 0) {
      console.log('✅ Utilisateur déjà inscrit aux notifications')
      // Marquer comme déjà demandé pour ne plus afficher
      localStorage.setItem('notification-permission-asked', 'already-subscribed')
      return
    }
  }

  // Afficher la popup immédiatement dès l'arrivée sur la page
  console.log('📢 Affichage de la popup de notification')
  showSoftPrompt.value = true
})

const requestNotifications = async () => {
  showSoftPrompt.value = false
  localStorage.setItem('notification-permission-asked', 'true')

  // Vérifier que l'utilisateur est connecté
  if (!user.value) {
    console.error('❌ Utilisateur non connecté')
    return
  }

  try {
    console.log('🔔 Activation des notifications...')
    
    // 1. Obtenir la permission et le token
    const token = await requestPermission()
    
    if (token) {
      console.log('✅ Token obtenu:', token.substring(0, 40) + '...')
      console.log('👤 User ID:', user.value.id)
      
      // 2. Sauvegarder le token en base de données
      console.log('💾 Tentative de sauvegarde en base...')
      const saveResult = await saveTokenForUser(token, user.value.id)
      console.log('✅ Résultat sauvegarde:', saveResult)
      
      // Vérifier en base si le token a bien été créé
      const supabase = useSupabaseClient()
      const { data: verification, error: verifyError } = await supabase
        .from('user_fcm_tokens')
        .select('id, token, active')
        .eq('user_id', user.value.id)
        .eq('active', true)
      
      if (verifyError) {
        console.error('❌ Erreur vérification:', verifyError)
      } else {
        console.log('🔍 Tokens actifs en base:', verification?.length || 0)
        if (verification && verification.length > 0) {
          console.log('✅ Token bien présent en base !')
        } else {
          console.error('❌ Token NON présent en base malgré la sauvegarde')
        }
      }
      
      // 3. Récupérer le nom de l'utilisateur pour personnaliser
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.value.id)
        .single()
      
      const userName = profile?.full_name?.split(' ')[0] // Prenom uniquement
      
      // 4. Envoyer la notification de bienvenue personnalisée
      await sendTestNotification(userName)
      console.log('✅ Notification de bienvenue envoyée')
      
      console.log('🎉 Notifications activées avec succès !')
    } else {
      // Échec - montrer bouton discret après un délai
      console.log('⚠️ Échec obtention token')
      setTimeout(() => {
        showDiscreteButton.value = true
      }, 60000) // 1 minute plus tard
    }
  } catch (error) {
    console.error('❌ Erreur activation notifications:', error)
    
    // Si erreur, proposer de réessayer plus tard
    setTimeout(() => {
      showDiscreteButton.value = true
    }, 60000)
  }
}

const dismissSoftPrompt = () => {
  showSoftPrompt.value = false
  localStorage.setItem('notification-permission-asked', 'dismissed')

  // Proposer à nouveau dans 3 jours
  setTimeout(() => {
    localStorage.removeItem('notification-permission-asked')
  }, 3 * 24 * 60 * 60 * 1000)
}
</script>