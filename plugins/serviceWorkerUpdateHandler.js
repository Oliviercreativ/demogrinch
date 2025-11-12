// plugins/serviceWorkerUpdateHandler.js
export default defineNuxtPlugin((nuxtApp) => {
  if (process.client && 'serviceWorker' in navigator) {
    let refreshing = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        console.log('[SW] Service worker updated - considering refresh')
      }
    })

    // ✅ Vérification d'update seulement au focus de la page
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update()
          }
        })
      }
    })
  }
})