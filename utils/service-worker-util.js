export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Service Worker enregistré avec succès:', registration.scope)
      return registration
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du Service Worker:', error)
      return null
    }
  } else {
    console.log('Les Service Workers ne sont pas supportés')
    return null
  }
}

export async function waitForServiceWorkerActivation(registration) {
  if (!registration) return false

  if (registration.active) {
    return true
  }

  if (registration.installing) {
    return new Promise(resolve => {
      registration.installing.addEventListener('statechange', function() {
        if (this.state === 'activated') {
          resolve(true)
        }
      })
    })
  }

  return false
}