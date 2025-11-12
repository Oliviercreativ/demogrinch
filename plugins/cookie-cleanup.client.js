// plugins/cookie-cleanup.client.js
// Nettoie automatiquement les anciens cookies Supabase qui peuvent causer des conflits
// S'exécute une seule fois par session navigateur (partagé entre tous les onglets) pour éviter les conflits

export default defineNuxtPlugin(async () => {
  if (!process.client) return

  // 🆔 Générer un ID unique pour cet onglet (sessionStorage est isolé par onglet)
  const tabId = sessionStorage.getItem('tab-id') || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  if (!sessionStorage.getItem('tab-id')) {
    sessionStorage.setItem('tab-id', tabId)
  }
  console.log(`[Tab ${tabId}] Cookie cleanup plugin initializing`)

  // ✅ Vérifier si le nettoyage a déjà été fait (localStorage partagé entre onglets)
  // Utiliser localStorage au lieu de sessionStorage pour partager entre onglets
  const cleanupDone = localStorage.getItem('supabase-cookie-cleanup-done')
  const cleanupTimestamp = localStorage.getItem('supabase-cookie-cleanup-timestamp')

  // ✅ Vérifier aussi la date (si le nettoyage a été fait il y a plus de 24h, on peut le refaire)
  const now = Date.now()
  const oneDayAgo = now - (24 * 60 * 60 * 1000)

  if (cleanupDone === 'true' && cleanupTimestamp && parseInt(cleanupTimestamp) > oneDayAgo) {
    console.log(`[Tab ${tabId}] ✅ Nettoyage des cookies déjà effectué récemment, skip`)
    return // Déjà fait récemment, on sort
  }

  try {
    const allCookies = document.cookie.split(';')
    const currentDomain = window.location.hostname
    const rootDomain = currentDomain.includes('.') 
      ? '.' + currentDomain.split('.').slice(-2).join('.')
      : currentDomain

    // Patterns de cookies Supabase (format par défaut de Supabase)
    // ⚠️ IMPORTANT : Ne nettoyer QUE les anciens cookies (sans le domaine .grinch.fr)
    // Les nouveaux cookies avec le bon domaine doivent être conservés
    const supabasePatterns = [
      /^sb-.*-auth-token/,
      /^sb-.*-auth-token-code-verifier/,
      /^supabase\.auth\.token/,
    ]

    // Filtrer tous les cookies Supabase
    const supabaseCookies = allCookies
      .map(cookie => cookie.trim().split('=')[0])
      .filter(name => supabasePatterns.some(pattern => pattern.test(name)))

    if (supabaseCookies.length === 0) {
      // Pas de cookies Supabase détectés, on marque comme fait et on sort
      localStorage.setItem('supabase-cookie-cleanup-done', 'true')
      localStorage.setItem('supabase-cookie-cleanup-timestamp', now.toString())
      return
    }

    // ✅ VÉRIFIER D'ABORD SI UNE SESSION EXISTE AVANT DE NETTOYER
    // Si une session valide existe, ne JAMAIS nettoyer les cookies (ils sont valides)
    // 🔒 Utiliser navigator.locks pour éviter les race conditions entre onglets

    try {
      // Attendre un court délai pour que Supabase s'initialise
      await new Promise(resolve => setTimeout(resolve, 500)) // Réduit à 500ms
      
      const { useSupabaseClient } = await import('#imports')
      const supabase = useSupabaseClient()

      // 🔒 Utiliser Web Locks API pour éviter les conflits entre onglets
      if ('locks' in navigator) {
        await navigator.locks.request('supabase-cookie-cleanup', { ifAvailable: true }, async (lock) => {
          if (!lock) {
            console.log(`[Tab ${tabId}] 🔒 Un autre onglet effectue déjà le nettoyage, skip`)
            return
          }

          console.log(`[Tab ${tabId}] 🔒 Lock acquis, vérification de session`)

          // Essayer 3 fois avec des délais réduits
          for (let i = 0; i < 3; i++) {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (session) {
              console.log(`[Tab ${tabId}] ✅ Session valide détectée, pas de nettoyage`)
              localStorage.setItem('supabase-cookie-cleanup-done', 'true')
              localStorage.setItem('supabase-cookie-cleanup-timestamp', now.toString())
              return // NE JAMAIS NETTOYER SI SESSION EXISTE
            }

            // Si pas de session mais pas d'erreur, attendre un peu
            if (!error && i < 2) {
              await new Promise(resolve => setTimeout(resolve, 300)) // Réduit à 300ms
            }
          }

          console.log(`[Tab ${tabId}] ℹ️ Aucune session détectée, nettoyage autorisé`)
        })
      } else {
        // Fallback si Web Locks API non disponible
        console.log(`[Tab ${tabId}] ⚠️ Web Locks API non disponible, vérification directe`)

        for (let i = 0; i < 3; i++) {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (session) {
            console.log(`[Tab ${tabId}] ✅ Session valide détectée, pas de nettoyage`)
            localStorage.setItem('supabase-cookie-cleanup-done', 'true')
            localStorage.setItem('supabase-cookie-cleanup-timestamp', now.toString())
            return
          }

          if (!error && i < 2) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }

      console.log(`[Tab ${tabId}] ℹ️ Nettoyage conditionnel autorisé`)
    } catch (e) {
      console.log(`[Tab ${tabId}] ⚠️ Erreur lors de la vérification de session:`, e)
      // En cas d'erreur, ne JAMAIS nettoyer par sécurité
      localStorage.setItem('supabase-cookie-cleanup-done', 'true')
      localStorage.setItem('supabase-cookie-cleanup-timestamp', now.toString())
      return
    }

    console.log(`[Tab ${tabId}] 🧹 Nettoyage de ${supabaseCookies.length} cookie(s) Supabase`)

    // Liste de tous les domaines possibles où les cookies peuvent être stockés
    const domainsToTry = [
      rootDomain,
      currentDomain,
      '.madeinconflans.grinch.fr',
      '.grinch.fr',
      'madeinconflans.grinch.fr',
      'grinch.fr',
      'halloween.grinch.fr',
      '.halloween.grinch.fr',
      '' // localhost (pas de domaine)
    ]

    // Liste de tous les paths possibles
    const pathsToTry = ['/', '/auth', '']

    // Supprimer chaque cookie Supabase avec toutes les combinaisons possibles
    supabaseCookies.forEach(cookieName => {
      domainsToTry.forEach(domain => {
        pathsToTry.forEach(path => {
          // Essayer différentes combinaisons d'attributs
          const expiration = 'Thu, 01 Jan 1970 00:00:00 UTC'
          
          // Sans attributs supplémentaires
          document.cookie = `${cookieName}=; expires=${expiration}; path=${path}; domain=${domain || ''}`
          
          // Avec secure
          document.cookie = `${cookieName}=; expires=${expiration}; path=${path}; domain=${domain || ''}; secure`
          
          // Avec sameSite=Lax
          document.cookie = `${cookieName}=; expires=${expiration}; path=${path}; domain=${domain || ''}; sameSite=Lax`
          
          // Avec secure et sameSite
          document.cookie = `${cookieName}=; expires=${expiration}; path=${path}; domain=${domain || ''}; secure; sameSite=Lax`
        })
      })
    })

    console.log(`[Tab ${tabId}] ✅ Nettoyage terminé`)

    // Marquer que le nettoyage a été fait (localStorage partagé entre onglets)
    localStorage.setItem('supabase-cookie-cleanup-done', 'true')
    localStorage.setItem('supabase-cookie-cleanup-timestamp', now.toString())

  } catch (error) {
    console.error(`[Tab ${tabId}] ❌ Erreur lors du nettoyage:`, error)
    // Marquer quand même comme fait pour éviter les boucles infinies
    localStorage.setItem('supabase-cookie-cleanup-done', 'true')
    localStorage.setItem('supabase-cookie-cleanup-timestamp', now.toString())
  }
})

