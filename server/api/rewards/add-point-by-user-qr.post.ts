import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Types pour l'API
interface AddPointByUserQRRequest {
  scanned_user_id: string // ID de l'utilisateur scanné depuis le QR code
  scanner_user_id?: string // ID de l'utilisateur qui scanne (optionnel, pour logs)
}

interface AddPointByUserQRResponse {
  success: boolean
  data: {
    user_id: string
    boutique_slug: string
    boutique_name: string
    previous_solde: number
    new_solde: number
    points_added: number
    boutique_limit: number
    limit_reached: boolean
    reward_earned: boolean
    reward_description: string
    series_uid: string
  }
  message: string
}

interface BoutiqueData {
  id: string
  slug: string
  name_shop: string
  limite: string
  lot: string
}

interface UserProfile {
  id: string
  full_name: string
  email?: string
}

interface RewardData {
  id: string
  hit_date: string
  solde: string
  new_solde: number
  store_slug: string
  rewardSlug: string
  user_uid_reward: string
  is_used: boolean
  series_uid: string
}

// Boutique fixe : Boulangerie Artisanale
const BOUTIQUE_SLUG = 'boulangerie-artisanale'

export default defineEventHandler(async (event): Promise<AddPointByUserQRResponse> => {
  try {
    // Initialisation Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupération des données du body
    const body: AddPointByUserQRRequest = await readBody(event)
    const { scanned_user_id, scanner_user_id } = body

    // Validation
    if (!scanned_user_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'scanned_user_id est requis'
      })
    }

    console.log(`[ADD POINT BY USER QR] Ajout point pour user: ${scanned_user_id}, boutique: ${BOUTIQUE_SLUG}`)

    // 1. VÉRIFIER QUE L'UTILISATEUR SCANNÉ EXISTE
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', scanned_user_id)
      .single() as { data: UserProfile | null, error: any }

    if (profileError || !userProfile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Utilisateur non trouvé'
      })
    }

    // 2. RÉCUPÉRER LA BOUTIQUE BOULANGERIE ARTISANALE
    const { data: boutique, error: boutiqueError } = await supabase
      .from('boutique')
      .select('id, slug, name_shop, limite, lot')
      .eq('slug', BOUTIQUE_SLUG)
      .eq('statut', false)
      .eq('demo', true)
      .single() as { data: BoutiqueData | null, error: any }

    if (boutiqueError || !boutique) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Boutique Boulangerie Artisanale non trouvée'
      })
    }

    console.log(`✅ Boutique trouvée: ${boutique.name_shop}`)

    // 3. RÉCUPÉRER LE DERNIER REWARD DE L'UTILISATEUR POUR CETTE BOUTIQUE
    const { data: lastReward } = await supabase
      .from('reward')
      .select('*')
      .eq('store_slug', BOUTIQUE_SLUG)
      .eq('user_uid_reward', scanned_user_id)
      .order('hit_date', { ascending: false })
      .limit(1)
      .single() as { data: RewardData | null }

    // 4. CALCULER LE NOUVEAU SOLDE
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

    // 5. AJOUTER LE POINT
    const newSolde = currentSolde + 1
    let rewardEarned = false

    // Insérer le reward
    const { data: rewardData, error: insertError } = await supabase
      .from('reward')
      .insert({
        hit_date: new Date().toISOString(),
        solde: currentSolde.toString(),
        new_solde: newSolde,
        store_slug: BOUTIQUE_SLUG,
        rewardSlug: seriesUid,
        user_uid_reward: scanned_user_id,
        is_used: false,
        is_read: false,
        series_uid: seriesUid,
        source: 'user_qr_scanner',
        admin_notes: scanner_user_id ? `Scanné par: ${scanner_user_id}` : null
      })
      .select()
      .single() as { data: RewardData | null, error: any }

    if (insertError || !rewardData) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de l\'insertion du reward: ' + insertError?.message
      })
    }

    // Vérifier si récompense gagnée
    if (newSolde >= parseInt(boutique.limite)) {
      rewardEarned = true
      console.log(`🎉 Limite ${boutique.limite} atteinte ! Récompense gagnée !`)
    }

    // 6. RÉPONSE
    const response: AddPointByUserQRResponse = {
      success: true,
      data: {
        user_id: scanned_user_id,
        boutique_slug: BOUTIQUE_SLUG,
        boutique_name: boutique.name_shop,
        previous_solde: currentSolde,
        new_solde: newSolde,
        points_added: 1,
        boutique_limit: parseInt(boutique.limite),
        limit_reached: newSolde >= parseInt(boutique.limite),
        reward_earned: rewardEarned,
        reward_description: boutique.lot || 'une récompense',
        series_uid: seriesUid
      },
      message: rewardEarned
        ? `Félicitations ! ${userProfile.full_name} a gagné ${boutique.lot || 'une récompense'} !`
        : `Point ajouté avec succès ! ${newSolde}/${boutique.limite} points`
    }

    console.log('✅ API Response:', JSON.stringify(response, null, 2))
    return response

  } catch (error: any) {
    console.error('[ADD POINT BY USER QR ERROR]:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur interne du serveur'
    })
  }
})

