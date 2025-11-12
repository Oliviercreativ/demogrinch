// composables/useFCMNotifications.ts
export const useFCMNotifications = () => {
  /**
   * Envoyer une notification FCM à un ou plusieurs utilisateurs
   * 
   * @param userIds - ID(s) des utilisateurs (string ou array)
   * @param title - Titre de la notification
   * @param message - Corps du message
   * @param options - Options supplémentaires (link_url, image_url, data)
   * @returns Promise avec le résultat de l'envoi
   */
  const sendNotification = async (
    userIds: string | string[],
    title: string,
    message: string,
    options: {
      link_url?: string
      image_url?: string
      data?: Record<string, string>
    } = {}
  ) => {
    try {
      // Normaliser userIds en array
      const userIdsArray = Array.isArray(userIds) ? userIds : [userIds]

      console.log(`📤 [FCM] Envoi notification à ${userIdsArray.length} utilisateur(s)`)

      // Appeler l'API serveur
      const response = await $fetch('/api/notifications/send', {
        method: 'POST',
        body: {
          user_ids: userIdsArray,
          title,
          message,
          ...options
        }
      })

      console.log('✅ [FCM] Notification envoyée:', response)
      return response

    } catch (error) {
      console.error('❌ [FCM] Erreur envoi notification:', error)
      throw error
    }
  }

  /**
   * Envoyer une notification à tous les utilisateurs actifs
   */
  const sendNotificationToAll = async (
    title: string,
    message: string,
    options: {
      link_url?: string
      image_url?: string
      data?: Record<string, string>
    } = {}
  ) => {
    try {
      const supabase = useSupabaseClient()

      // Récupérer tous les utilisateurs avec des tokens actifs
      const { data: tokens, error } = await supabase
        .from('user_fcm_tokens')
        .select('user_id')
        .eq('active', true)

      if (error) throw error

      if (!tokens || tokens.length === 0) {
        console.log('⚠️ [FCM] Aucun utilisateur avec token actif')
        return { success: true, sentCount: 0 }
      }

      // Extraire les user_ids uniques
      const userIds = [...new Set(tokens.map(t => t.user_id))]

      console.log(`📤 [FCM] Envoi broadcast à ${userIds.length} utilisateur(s)`)

      return await sendNotification(userIds, title, message, options)

    } catch (error) {
      console.error('❌ [FCM] Erreur broadcast:', error)
      throw error
    }
  }

  /**
   * Envoyer une notification aux clients d'une boutique
   */
  const sendNotificationToShopCustomers = async (
    boutiqueSlug: string,
    title: string,
    message: string,
    options: {
      link_url?: string
      image_url?: string
      data?: Record<string, string>
    } = {}
  ) => {
    try {
      const supabase = useSupabaseClient()

      // Récupérer les utilisateurs qui ont scanné cette boutique
      const { data: rewards, error } = await supabase
        .from('reward')
        .select('user_uid_reward')
        .eq('store_slug', boutiqueSlug)

      if (error) throw error

      if (!rewards || rewards.length === 0) {
        console.log('⚠️ [FCM] Aucun client trouvé pour cette boutique')
        return { success: true, sentCount: 0 }
      }

      // Extraire les user_ids uniques
      const userIds = [...new Set(rewards.map(r => r.user_uid_reward).filter(Boolean))]

      console.log(`📤 [FCM] Envoi aux clients de ${boutiqueSlug}: ${userIds.length} utilisateur(s)`)

      return await sendNotification(userIds, title, message, {
        ...options,
        data: {
          ...options.data,
          boutique_slug: boutiqueSlug
        }
      })

    } catch (error) {
      console.error('❌ [FCM] Erreur envoi aux clients boutique:', error)
      throw error
    }
  }

  /**
   * Envoyer une notification de nouvelle récompense
   */
  const sendRewardNotification = async (
    userId: string,
    shopName: string,
    rewardDetails: string
  ) => {
    return await sendNotification(
      userId,
      `🎉 Récompense gagnée chez ${shopName} !`,
      rewardDetails,
      {
        link_url: '/cartes-de-fidelite',
        data: {
          type: 'reward',
          shop_name: shopName
        }
      }
    )
  }

  /**
   * Envoyer une notification de message boutique
   */
  const sendShopMessageNotification = async (
    userId: string,
    shopName: string,
    messagePreview: string
  ) => {
    return await sendNotification(
      userId,
      `💬 Nouveau message de ${shopName}`,
      messagePreview,
      {
        link_url: '/messagerie',
        data: {
          type: 'message',
          shop_name: shopName
        }
      }
    )
  }

  return {
    sendNotification,
    sendNotificationToAll,
    sendNotificationToShopCustomers,
    sendRewardNotification,
    sendShopMessageNotification
  }
}

