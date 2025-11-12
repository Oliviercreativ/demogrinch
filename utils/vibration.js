// utils/vibration.js
export const VIBRATION_PATTERNS = {
  SUCCESS: [100, 50, 100],
  ERROR: [200, 100, 200, 100, 200],
  SCAN: [50],
  CELEBRATION: [200, 100, 200, 100, 200, 100, 400] // 🎉 Pattern de fête !
}

let userHasInteracted = false

// Tracker l'interaction utilisateur côté client seulement
if (process.client) {
  const trackInteraction = () => {
    userHasInteracted = true
    // Retirer les listeners une fois qu'on sait que l'utilisateur a interagi
    document.removeEventListener('click', trackInteraction)
    document.removeEventListener('touchstart', trackInteraction)
    document.removeEventListener('keydown', trackInteraction)
  }

  document.addEventListener('click', trackInteraction, {once: true})
  document.addEventListener('touchstart', trackInteraction, {once: true})
  document.addEventListener('keydown', trackInteraction, {once: true})
}

export const vibrate = (pattern) => {
  // Vérifier si on est côté client
  if (!process.client) return false

  // Vérifier le support de la vibration
  if (!navigator.vibrate) {
    console.log('🔇 Vibration non supportée sur cet appareil')
    return false
  }

  // Vérifier l'interaction utilisateur
  if (!userHasInteracted) {
    console.log(
      '🔇 Vibration bloquée - aucune interaction utilisateur détectée'
    )
    return false
  }

  try {
    const success = navigator.vibrate(pattern)
    if (success) {
      console.log('📳 Vibration déclenchée:', pattern)
    } else {
      console.log('🔇 Vibration échouée (possiblement désactivée)')
    }
    return success
  } catch (error) {
    console.warn('⚠️ Erreur vibration:', error)
    return false
  } 
}

// Fonction utilitaire pour tester si la vibration est disponible
export const isVibrationAvailable = () => {
  return process.client && 'vibrate' in navigator && userHasInteracted
}
