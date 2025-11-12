import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Types pour l'API
interface AddPointRequest {
  user_id: string
  boutique_slug: string
  source?: 'scan' | 'qr_code' | 'scanner' | 'reader' | 'scan_uid' | 'admin' | 'owner' | 'woocommerce' | 'api'
  admin_notes?: string
  api_key?: string
  points_to_add?: number
  check_scan_limit?: boolean
  check_geolocation?: boolean
  user_latitude?: number
  user_longitude?: number
}

interface AddPointResponse {
  success: boolean
  data: {
    user_id: string
    boutique_slug: string
    boutique_name: string
    previous_solde: number
    new_solde: number
    points_added: number
    actual_points_added: number
    double_points_campaign: boolean
    boutique_limit: number
    limit_reached: boolean
    reward_earned: boolean
    reward_description: string
    series_uid: string
    source: string
    rewards_created: string[]
  }
  notifications: {
    sms_sent: boolean
    message_sent: boolean
    errors: string[]
  }
  message: string
}

interface BoutiqueData {
  id: string
  slug: string
  name_shop: string
  limite: string
  lot: string
  check_location: boolean
  latitude?: number
  longitude?: number
  owner?: string
  tel_shop?: string
  statut: boolean
  reward_link?: string  // Ajoutez ce champ pour le lien de la récompense
  enable_auto_messages?: boolean
  message_1_point?: string
  message_recompense?: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  tel?: string
}

interface RewardData {
  id: string
  hit_date: string
  solde: number
  new_solde: number
  store_slug: string
  rewardSlug: string
  user_uid_reward: string
  is_used: boolean
  series_uid: string
}

interface AdminSettings {
  double_points_active: boolean
}

export default defineEventHandler(async (event): Promise<AddPointResponse> => {
  try {
    // Initialisation Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupération des données du body avec validation TypeScript
    const body: AddPointRequest = await readBody(event)
    const { 
      user_id, 
      boutique_slug, 
      source = 'api', 
      admin_notes, 
      api_key,
      points_to_add = 1,
      check_scan_limit = true,
      check_geolocation = false,
      user_latitude,
      user_longitude
    } = body

    // Validation des paramètres obligatoires
    if (!user_id || !boutique_slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'user_id et boutique_slug sont requis'
      })
    }

    if (!Number.isInteger(points_to_add) || points_to_add < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'points_to_add doit être un entier positif'
      })
    }

    // Sécurité API Key (optionnel)
    if (api_key && api_key !== process.env.LOYALTY_API_KEY) {
      throw createError({
        statusCode: 401,
        statusMessage: 'API Key invalide'
      })
    }

    console.log(`[LOYALTY API] Ajout ${points_to_add} point(s): user=${user_id}, boutique=${boutique_slug}, source=${source}`)

    // 1. RÉCUPÉRER LES INFORMATIONS DE LA BOUTIQUE
    // ✅ CORRECTION : Chercher par scan_uid OU par slug selon le format
    let boutique = null
    let boutiqueError = null

    // Détecter si c'est un UUID (scan_uid) ou un slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boutique_slug)
    
    if (isUUID) {
      // Chercher par scan_uid
      console.log(`🔍 Recherche boutique par scan_uid: ${boutique_slug}`)
      const result = await supabase
        .from('boutique')
        .select('*')
        .eq('scan_uid', boutique_slug)
        .eq('statut', true)
        .single() as { data: BoutiqueData | null, error: any }
      
      boutique = result.data
      boutiqueError = result.error
    } else {
      // Chercher par slug
      console.log(`🔍 Recherche boutique par slug: ${boutique_slug}`)
      const result = await supabase
        .from('boutique')
        .select('*')
        .eq('slug', boutique_slug)
        .eq('statut', true)
        .single() as { data: BoutiqueData | null, error: any }
      
      boutique = result.data
      boutiqueError = result.error
    }

    if (boutiqueError || !boutique) {
      console.log(`❌ Boutique non trouvée: ${boutiqueError?.message || 'Aucune donnée'}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Boutique non trouvée ou inactive'
      })
    }

    console.log(`✅ Boutique trouvée: ${boutique.name_shop} (slug: ${boutique.slug})`)
    
    // Utiliser le slug de la boutique pour la suite (cohérence)
    const actualBoutiqueSlug = boutique.slug

    // 2. VÉRIFIER LE PROFIL UTILISATEUR
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, tel')
      .eq('id', user_id)
      .single() as { data: UserProfile | null, error: any }

    if (profileError || !userProfile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Utilisateur non trouvé'
      })
    }

    // 3. VÉRIFICATION GÉOLOCALISATION (si demandée)
    if (check_geolocation && boutique.check_location) {
      if (!user_latitude || !user_longitude) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Coordonnées utilisateur requises pour cette boutique'
        })
      }

      if (!boutique.latitude || !boutique.longitude) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Coordonnées de la boutique non configurées'
        })
      }

      const distance = calculateDistance(
        user_latitude, user_longitude,
        boutique.latitude, boutique.longitude
      )

      const MAX_DISTANCE = 100 // mètres
      if (distance > MAX_DISTANCE) {
        throw createError({
          statusCode: 403,
          statusMessage: `Vous êtes trop loin de ${boutique.name_shop} (${Math.round(distance)}m)`
        })
      }
    }

    // 4. VÉRIFIER CAMPAGNE DOUBLE POINTS (optionnel si table manquante)
    let actualPointsToAdd = points_to_add
    const physicalScanSources: string[] = ['scan', 'qr_code', 'scanner', 'reader', 'scan_uid']
    
    if (physicalScanSources.includes(source)) {
      try {
        const { data: campaignSettings } = await supabase
          .from('admin_settings')
          .select('double_points_active')
          .single() as { data: AdminSettings | null }

        if (campaignSettings?.double_points_active) {
          actualPointsToAdd = points_to_add * 2
          console.log(`[DOUBLE POINTS] Campagne active: ${points_to_add} → ${actualPointsToAdd} points`)
        }
      } catch (settingsError) {
        console.warn('⚠️ Table admin_settings manquante, pas de double points')
      }
    }

    // 5. VÉRIFIER LES SCANS JOURNALIERS (si demandé)
    // ✅ VÉRIFICATION AVANT D'AJOUTER LE REWARD
    const shouldCheckScans = check_scan_limit && physicalScanSources.includes(source)
    
    if (shouldCheckScans) {
      const todayUTC = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
      const boutiqueIdString = String(boutique.id) // Convertir en string car la colonne est de type text
      
      // ✅ VÉRIFIER SI UN SCAN EXISTE DÉJÀ AUJOURD'HUI
      const { data: existingScan, error: scanCheckError } = await supabase
        .from('scans')
        .select('id')
        .eq('boutique_id', boutiqueIdString)
        .eq('user_id', user_id)
        .gte('created_at', todayUTC)
        .maybeSingle()

      if (scanCheckError && scanCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Erreur vérification scan:', scanCheckError)
      }

      // ✅ SI UN SCAN EXISTE → BLOQUER AVANT D'AJOUTER LE REWARD
      if (existingScan) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Vous avez déjà scanné cette boutique aujourd\'hui !'
        })
      }

      // ✅ AUCUN SCAN TROUVÉ → ON VA ENREGISTRER LE NOUVEAU SCAN APRÈS L'AJOUT DU REWARD
      // (pour éviter de créer une entrée si l'ajout du reward échoue)
    }

    // 6. RÉCUPÉRER LE DERNIER REWARD
    const { data: lastReward } = await supabase
      .from('reward')
      .select('*')
      .eq('store_slug', actualBoutiqueSlug) // ✅ Utiliser le slug réel
      .eq('user_uid_reward', user_id)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single() as { data: RewardData | null }

    // 7. CALCULER LE NOUVEAU SOLDE
    let currentSolde = 0
    let seriesUid = uuidv4()

    if (lastReward) {
      if (lastReward.is_used || lastReward.new_solde >= parseInt(boutique.limite)) {
        // Nouveau cycle si lot récupéré ou limite déjà atteinte
        currentSolde = 0
        seriesUid = uuidv4()
      } else {
        // Continuer la série en cours
        currentSolde = lastReward.new_solde
        seriesUid = lastReward.series_uid
      }
    }

    // 8. AJOUTER LES POINTS AVEC GESTION LIMITE
    const rewardsCreated: RewardData[] = []
    let rewardEarned = false
    let finalSolde = currentSolde
    let lastSeriesUid = seriesUid

    for (let i = 0; i < actualPointsToAdd; i++) {
      const newSolde = currentSolde + 1

      // Insérer le reward
      const { data: rewardData, error: insertError } = await supabase
        .from('reward')
        .insert({
          hit_date: new Date().toISOString(),
          solde: currentSolde.toString(), // Convertir en string car solde est TEXT
          new_solde: newSolde,
          store_slug: actualBoutiqueSlug, // ✅ CORRECTION : Utiliser le slug réel
          rewardSlug: seriesUid,
          user_uid_reward: user_id,
          is_used: false,
          is_read: false,
          series_uid: seriesUid,
          source: source,
          admin_notes: admin_notes || null
        })
        .select()
        .single() as { data: RewardData | null, error: any }

      if (insertError || !rewardData) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de l\'insertion du reward: ' + insertError?.message
        })
      }

      rewardsCreated.push(rewardData)
      finalSolde = newSolde
      currentSolde = newSolde

      // Si limite atteinte - déclencher récompense
      if (newSolde >= parseInt(boutique.limite)) {
        rewardEarned = true
        lastSeriesUid = seriesUid
        console.log(`🎉 Limite ${boutique.limite} atteinte ! Récompense gagnée !`)
        
        // NOUVEAU CYCLE pour les points restants
        currentSolde = 0
        seriesUid = uuidv4()
        console.log(`🔄 Nouveau cycle démarré avec series_uid: ${seriesUid}`)
      }
    }

    // 9. NOTIFICATIONS - WEBHOOK MAKE.COM (DIRECT SMS)
    const notifications = {
      sms_sent: false,
      message_sent: false,
      errors: [] as string[]
    }

    if (rewardEarned) {
      try {
        const siteUrl = 'https://madeinconflans.grinch.fr'
        // Utilisez la dernière récompense du tableau rewardsCreated
        const lastReward = rewardsCreated.at(-1)
        
        // ✅ VÉRIFIER enable_auto_messages AVANT DE CRÉER LE MESSAGE
        let felicitationMessage = ''
        let shopMessage = ''
        
        if (boutique.enable_auto_messages) {
          // ✅ UTILISER LE MESSAGE PERSONNALISÉ SI DISPONIBLE
          if (boutique.message_recompense) {
            // Message personnalisé de la boutique
            felicitationMessage = boutique.message_recompense
            console.log('✅ Utilisation du message personnalisé de récompense:', felicitationMessage)
          } else {
            // Message par défaut générique
            felicitationMessage = `Félicitations ! Vous avez atteint ${boutique.limite} points chez ${boutique.name_shop} et gagné ${boutique.lot || 'une récompense'}. Rendez-vous en boutique et présentez ce message pour récupérer votre cadeau !`
            console.log('✅ Utilisation du message par défaut (enable_auto_messages activé mais pas de message_recompense)')
          }
          
          shopMessage = `${userProfile.full_name} a gagné son lot ! Validez la récompense ici : ${siteUrl}/validation-recompense/${lastReward?.id}`
          
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 30)
          const { error: messageError } = await supabase
            .from('user_messages')
            .insert([{
              user_id: user_id,
              message: felicitationMessage,
              is_read: false,
              expiry_date: expiryDate.toISOString(),
              boutique_slug: actualBoutiqueSlug
            }])
          if (!messageError) {
            notifications.message_sent = true
            console.log('✅ Message de récompense créé dans user_messages')
          } else {
            console.error('❌ Erreur création message récompense:', messageError)
          }
        } else {
          console.log('⚠️ Messages automatiques désactivés - aucun message de récompense ne sera créé')
          // Message par défaut pour le webhook même si enable_auto_messages est false
          felicitationMessage = `Félicitations ! Vous avez atteint ${boutique.limite} points chez ${boutique.name_shop} et gagné ${boutique.lot || 'une récompense'}. Rendez-vous en boutique et présentez ce message pour récupérer votre cadeau !`
          shopMessage = `${userProfile.full_name} a gagné son lot ! Validez la récompense ici : ${siteUrl}/validation-recompense/${lastReward?.id}`
        }
        
        // ✅ WEBHOOK MAKE.COM POUR SMS DIRECT (Plus efficace !)
        if (userProfile.tel && lastReward) {
          const webhookToken = process.env.MAKE_WEBHOOK_TOKEN || '65c9e6ae25f22da5e8b5c2fc98cbcaf844af0dbfb7dc1294c496c6da7a50369e'

          const webhookData = {
            // Oui, c'est bien le user_id ici. Il est inclus dans les données envoyées au webhook :
            user_id: user_id,
            user_phone: userProfile.tel.replace(/[\s\-\.]/g, ''), // Nettoyer le numéro
            user_name: userProfile.full_name || 'Client',
            boutique_name: boutique.name_shop,
            boutique_slug: actualBoutiqueSlug,
            boutique_phone: boutique.tel_shop,
            reward_message: felicitationMessage,
            reward_id: lastReward.id,
            shop_message: shopMessage, // Ajoutez ce message aux données du webhook
            delay_seconds: 10, // Make.com gérera ce délai
            trigger_time: new Date().toISOString(),
            reward_link: siteUrl + '/validation-recompense/' + lastReward.id,
            webhook_token: webhookToken
          }
          const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL

          if (makeWebhookUrl) {
            console.log(`📡 Envoi webhook Make.com pour SMS direct...`)

            // Appel asynchrone (fire-and-forget) - plus rapide car pas de callback
            fetch(makeWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(webhookData)
            }).then(async (response) => {
              if (response.ok) {
                console.log(`✅ Webhook Make.com envoyé avec succès`)
              } else {
                console.error(`❌ Erreur webhook Make.com: ${response.status}`)
              }
            }).catch((error) => {
              console.error('❌ Erreur appel webhook Make.com:', error)
              // Ne pas faire planter l'API principale
            })
            notifications.sms_sent = true // Marquer comme "programmé"
            console.log(`📱 SMS programmé via Make.com direct pour ${userProfile.tel} dans 10 secondes`)

          } else {
            console.warn('⚠️ MAKE_WEBHOOK_URL non configuré')
            notifications.errors.push('Configuration webhook manquante')
          }
        } else {
          notifications.errors.push('Numéro de téléphone manquant')
        }
      } catch (notificationError: any) {
        console.error('Erreur notifications:', notificationError)
        notifications.errors.push('Erreur notifications: ' + notificationError.message)
      }
    }

    // 10. ENREGISTRER LE SCAN DANS LA TABLE scans (si vérification activée)
    // ✅ AJOUT APRÈS LE SUCCÈS DE L'AJOUT DES REWARDS
    if (shouldCheckScans) {
      const boutiqueIdString = String(boutique.id) // Convertir en string car la colonne est de type text
      const now = new Date().toISOString()
      
      try {
        const { error: scanInsertError } = await supabase
          .from('scans')
          .insert({
            boutique_id: boutiqueIdString,
            user_id: user_id,
            last_scan_at: now,
            created_at: now
          })

        if (scanInsertError) {
          console.error('❌ Erreur insertion scan:', scanInsertError)
          // Ne pas bloquer la réponse si l'insertion du scan échoue
          // Le point a déjà été ajouté avec succès
        } else {
          console.log(`✅ Scan enregistré: boutique=${boutiqueIdString}, user=${user_id}`)
        }
      } catch (scanError) {
        console.error('❌ Exception lors de l\'insertion du scan:', scanError)
      }
    }

    // 11. LOGS D'ACTIVITÉ (optionnel si table manquante)
    try {
      await supabase.from('activity_logs').insert({
        user_id: user_id,
        boutique_slug: actualBoutiqueSlug, // ✅ Logger avec le slug réel
        action: 'add_points',
        details: {
          points_requested: points_to_add,
          points_added: rewardsCreated.length,
          actual_points: actualPointsToAdd,
          double_points_applied: actualPointsToAdd !== points_to_add,
          source: source,
          previous_solde: lastReward?.new_solde || 0,
          new_solde: finalSolde,
          reward_earned: rewardEarned,
          admin_notes: admin_notes
        },
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.warn('⚠️ Logging ignoré (table activity_logs manquante):', logError)
    }

    // 12. RÉPONSE STANDARDISÉE
    const response = {
      success: true,
      data: {
        user_id: user_id,
        boutique_slug: actualBoutiqueSlug, // ✅ Retourner le slug réel
        boutique_name: boutique.name_shop,
        previous_solde: lastReward?.new_solde || 0,
        new_solde: finalSolde,
        points_added: rewardsCreated.length,
        actual_points_added: actualPointsToAdd,
        double_points_campaign: actualPointsToAdd !== points_to_add,
        boutique_limit: parseInt(boutique.limite), // ✅ CORRECTION : Convertir en number pour la réponse
        limit_reached: finalSolde >= parseInt(boutique.limite),
        reward_earned: rewardEarned,
        reward_description: boutique.lot || 'une récompense',
        series_uid: lastSeriesUid,
        source: source,
        rewards_created: rewardsCreated.map(r => r.id)
      },
      notifications: notifications,
      message: rewardEarned 
        ? `Félicitations ! Vous avez gagné ${boutique.lot || 'une récompense'} ! SMS en cours d'envoi...`
        : `${rewardsCreated.length} point(s) ajouté(s) ! ${finalSolde}/${boutique.limite} points${actualPointsToAdd !== points_to_add ? ' (campagne x2 active)' : ''}`
    }

    console.log('✅ API Response:', JSON.stringify(response, null, 2))
    return response

  } catch (error: any) {
    console.error('[LOYALTY API ERROR]:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur interne du serveur'
    })
  }
})

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Rayon de la terre en mètres
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}