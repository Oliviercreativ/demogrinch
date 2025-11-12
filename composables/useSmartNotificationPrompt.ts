// composables/useSmartNotificationPrompt.ts
export const useSmartNotificationPrompt = () => {
  const showSoftPrompt = ref(false)
  const showDiscreteButton = ref(false)
  const showBrowserHelp = ref(false)
  const userEngaged = ref(false)
  const currentContext = ref<{ name: string; condition: () => boolean | string | null; message: string; cta: string } | null>(null)

  // Déclencheurs contextuels intelligents
  const triggerContexts = [
    {
      name: 'after_first_reward',
      condition: () => localStorage.getItem('first_reward_earned'),
      message: '🎉 Félicitations ! Recevez vos prochaines récompenses par notification',
      cta: 'Oui, m\'alerter !'
    },
    {
      name: 'after_boutique_visit',
      condition: () => localStorage.getItem('boutique_visited'),
      message: '🏪 Soyez alerté des nouvelles offres de cette boutique',
      cta: 'Activer les alertes'
    },
    {
      name: 'after_newsletter_signup',
      condition: () => localStorage.getItem('newsletter_subscribed'),
      message: '📱 Recevez aussi nos alertes instantanées sur votre téléphone',
      cta: 'Recevoir les notifications'
    },
    {
      name: 'general_engagement',
      condition: () => true, // Fallback
      message: '🔔 Restez informé des dernières offres',
      cta: 'Oui, m\'alerter'
    }
  ]

  // Tracking d'engagement utilisateur
  const engagementTriggers = ref({
    timeSpent: 0,
    pagesVisited: 0,
    hasScrolled: false,
    hasInteracted: false,
    hasUsedFeature: false
  })

  const findBestContext = () => {
    // Chercher le contexte le plus pertinent
    for (const context of triggerContexts) {
      if (context.condition()) {
        return context
      }
    }
    return triggerContexts[triggerContexts.length - 1] // Fallback
  }

  const startEngagementTracking = () => {
    // Vérifier si l'utilisateur a déjà répondu
    const hasResponded = localStorage.getItem('notification-permission-asked')
    const lastDismissed = localStorage.getItem('notification-dismissed-at')
    
    // Vérification supplémentaire : si la permission est déjà accordée au niveau navigateur
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      localStorage.setItem('notification-permission-asked', 'granted')
      return
    }
    
    if (hasResponded === 'granted') return
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 3 * 24 * 60 * 60 * 1000) return

    // Timer - après 45 secondes sur le site
    setTimeout(() => {
      engagementTriggers.value.timeSpent = 45
      checkEngagement()
    }, 45000)

    // Scroll tracking
    let scrollThreshold = 0.3 // 30% de la page
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      if (scrollPercent > scrollThreshold) {
        engagementTriggers.value.hasScrolled = true
        checkEngagement()
        window.removeEventListener('scroll', handleScroll)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Interaction tracking
    let interactionCount = 0
    const handleInteraction = () => {
      interactionCount++
      if (interactionCount >= 3) { // Après 3 interactions
        engagementTriggers.value.hasInteracted = true
        checkEngagement()
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
      }
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction, { passive: true })

    // Navigation tracking
    const router = useRouter()
    router.afterEach(() => {
      engagementTriggers.value.pagesVisited++
      checkEngagement()
    })
  }

  const checkEngagement = () => {
    const { timeSpent, hasScrolled, hasInteracted, pagesVisited } = engagementTriggers.value
    
    // Conditions d'engagement (OR logic)
    const isEngaged = 
      timeSpent >= 45 || 
      hasScrolled || 
      hasInteracted || 
      pagesVisited >= 2

    if (isEngaged && !userEngaged.value) {
      userEngaged.value = true
      
      // Attendre encore un peu avant de montrer le prompt
      setTimeout(() => {
        currentContext.value = findBestContext()
        showSoftPrompt.value = true
      }, 8000) // 8 secondes après engagement
    }
  }

  const dismissSoftPrompt = (reason = 'dismissed') => {
    showSoftPrompt.value = false
    localStorage.setItem('notification-permission-asked', reason)
    localStorage.setItem('notification-dismissed-at', Date.now().toString())
    
    if (reason === 'dismissed') {
      // Montrer le bouton discret après 2 minutes
      setTimeout(() => {
        if (localStorage.getItem('notification-permission-asked') !== 'granted') {
          showDiscreteButton.value = true
        }
      }, 120000)
    }
  }

  const handlePermissionResult = (success: boolean, token: string | null = null) => {
    if (success) {
      localStorage.setItem('notification-permission-asked', 'granted')
      localStorage.setItem('fcm-token', token || '')
      showSoftPrompt.value = false
      showDiscreteButton.value = false
    } else {
      // Vérifier si c'est un blocage navigateur
      if (Notification.permission === 'denied') {
        showBrowserHelp.value = true
        localStorage.setItem('notification-permission-asked', 'blocked')
      } else {
        dismissSoftPrompt('declined')
      }
    }
  }

  return {
    showSoftPrompt,
    showDiscreteButton,
    showBrowserHelp,
    currentContext,
    startEngagementTracking,
    dismissSoftPrompt,
    handlePermissionResult,
    triggerContexts
  }
}