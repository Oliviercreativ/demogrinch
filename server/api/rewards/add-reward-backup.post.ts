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
  limite: number
  lot: string
  check_location: boolean
  latitude?: number
  longitude?: number
  owner?: string
  tel_shop?: string
  statut: boolean
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
    const shouldCheckScans = check_scan_limit && physicalScanSources.includes(source)
    
    if (shouldCheckScans) {
      const todayUTC = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
      
      const { data: existingScan } = await supabase
        .from('scans')
        .select('id')
        .eq('boutique_id', boutique.id)
        .eq('user_id', user_id)
        .gte('created_at', todayUTC)
        .single()

      if (existingScan) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Vous avez déjà scanné cette boutique !'
        })
      }

      // Enregistrer le nouveau scan
      await supabase
        .from('scans')
        .insert({
          boutique_id: boutique.id,
          user_id: user_id,
          last_scan_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
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
      if (lastReward.is_used || lastReward.new_solde >= boutique.limite) {
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
          solde: currentSolde,
          new_solde: newSolde,
          store_slug: actualBoutiqueSlug, // ✅ CORRECTION ICI
          rewardSlug: seriesUid,
          user_uid_reward: user_id,
          is_used: false,
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
      if (newSolde >= boutique.limite) {
        rewardEarned = true
        lastSeriesUid = seriesUid
        console.log(`🎉 Limite ${boutique.limite} atteinte ! Récompense gagnée !`)
        
        // NOUVEAU CYCLE pour les points restants
        currentSolde = 0
        seriesUid = uuidv4()
        console.log(`🔄 Nouveau cycle démarré avec series_uid: ${seriesUid}`)
      }
    }

    // 9. NOTIFICATIONS SMS SI LIMITE ATTEINTE
    const notifications = {
      sms_sent: false,
      message_sent: false,
      errors: [] as string[]
    }

    if (rewardEarned) {
      try {
        // Message interne utilisateur
        const felicitationMessage = `Félicitations ! Vous avez atteint ${boutique.limite} points chez ${boutique.name_shop} et gagné ${boutique.lot || 'une récompense'}. Rendez-vous en boutique et présentez ce message pour récupérer votre cadeau !`
        
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)

        const { error: messageError } = await supabase
          .from('user_messages')
          .insert([{
            user_id: user_id,
            message: felicitationMessage,
            is_read: false,
            expiry_date: expiryDate.toISOString(),
            boutique_slug: boutique_slug
          }])

        if (!messageError) {
          notifications.message_sent = true
        }

        // SMS AU GÉRANT IMMÉDIATEMENT
        const rewardWinningId = rewardsCreated.find(r => r.new_solde >= boutique.limite)?.id
        const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://votre-app.com'
        const validationUrl = rewardWinningId 
          ? `${baseUrl}/validation-recompense/${rewardWinningId}`
          : ''

        // SMS propriétaire boutique
        if (boutique.owner) {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('tel')
            .eq('id', boutique.owner)
            .single() as { data: { tel?: string } | null }

          if (ownerProfile?.tel) {
            const ownerSmsMessage = `GRINCH: ${userProfile.full_name} a gagné ${boutique.lot || 'un lot'}. Validez: ${validationUrl}`
            
            console.log('📱 Envoi SMS gérant:', ownerProfile.tel)
            try {
              await $fetch('/api/sendsms', {
                method: 'POST',
                body: { 
                  phone: ownerProfile.tel, 
                  message: ownerSmsMessage,
                  user_id: user_id
                }
              })
              console.log('✅ SMS gérant envoyé')
            } catch (error: any) {
              console.error('❌ Erreur SMS gérant:', error)
              notifications.errors.push('Erreur SMS propriétaire: ' + error.message)
            }
          }
        }

        // SMS numéro boutique (backup)
        if (boutique.tel_shop) {
          const shopSmsMessage = `GRINCH: ${userProfile.full_name} a gagné ${boutique.lot || 'un lot'}. Validez: ${validationUrl}`
          
          console.log('📱 Envoi SMS boutique:', boutique.tel_shop)
          try {
            await $fetch('/api/sendsms', {
              method: 'POST',
              body: { 
                phone: boutique.tel_shop, 
                message: shopSmsMessage,
                user_id: user_id
              }
            })
            console.log('✅ SMS boutique envoyé')
          } catch (error: any) {
            console.error('❌ Erreur SMS boutique:', error)
            notifications.errors.push('Erreur SMS boutique: ' + error.message)
          }
        }

        // SMS AU CLIENT APRÈS 15 SECONDES
        if (userProfile.tel) {
          console.log('📱 Programmation SMS client dans 15 secondes:', userProfile.tel)
          setTimeout(async () => {
            try {
              const userSmsMessage = `GRINCH: Félicitations ! Vous avez atteint ${boutique.limite} points chez ${boutique.name_shop} et gagné ${boutique.lot || 'une récompense'}. Présentez ce message en boutique pour récupérer votre cadeau !`
              
              await $fetch('/api/sendsms', {
                method: 'POST',
                body: { 
                  phone: userProfile.tel!, 
                  message: userSmsMessage,
                  user_id: user_id
                }
              })
              console.log('✅ SMS client envoyé après 15s')
              // Note: on ne peut pas modifier notifications ici car c'est async
            } catch (error: any) {
              console.error('❌ Erreur SMS client différé:', error)
            }
          }, 15000)
        }

      } catch (notificationError: any) {
        console.error('Erreur notifications:', notificationError)
        notifications.errors.push('Erreur générale notifications: ' + notificationError.message)
      }
    }

    // 10. LOGS D'ACTIVITÉ (optionnel si table manquante)
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

    // 11. RÉPONSE STANDARDISÉE
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
        boutique_limit: boutique.limite,
        limit_reached: finalSolde >= boutique.limite,
        reward_earned: rewardEarned,
        reward_description: boutique.lot || 'une récompense',
        series_uid: lastSeriesUid,
        source: source,
        rewards_created: rewardsCreated.map(r => r.id)
      },
      notifications: notifications,
      message: rewardEarned 
        ? `Félicitations ! Vous avez gagné ${boutique.lot || 'une récompense'} !`
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