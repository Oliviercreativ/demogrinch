// composables/useAdminSettings.ts
export const useAdminSettings = () => {
  const supabase = useSupabaseClient()

  /**
   * Récupérer les paramètres admin actuels
   */
  const getAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || {
        double_points_active: false,
        campaign_name: '',
        campaign_start_date: null,
        campaign_end_date: null,
        max_scans_per_day: 10,
        scan_cleanup_interval: 60
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error)
      return {
        double_points_active: false,
        campaign_name: '',
        campaign_start_date: null,
        campaign_end_date: null,
        max_scans_per_day: 10,
        scan_cleanup_interval: 60
      }
    }
  }

  /**
   * Vérifier si les points double sont activés
   */
  const isDoublePointsActive = async (): Promise<boolean> => {
    try {
      const settings = await getAdminSettings()
      
      // Vérifier si les points double sont activés globalement
      if (!settings.double_points_active) {
        return false
      }

      // Vérifier si on est dans la période de campagne (si définie)
      if (settings.campaign_start_date && settings.campaign_end_date) {
        const now = new Date()
        const startDate = new Date(settings.campaign_start_date)
        const endDate = new Date(settings.campaign_end_date)
        
        return now >= startDate && now <= endDate
      }

      // Si pas de dates définies, on se base uniquement sur le flag
      return settings.double_points_active
    } catch (error) {
      console.error('Erreur lors de la vérification des points double:', error)
      return false
    }
  }

  /**
   * Calculer les points avec multiplicateur si les points double sont actifs
   */
  const calculatePoints = async (basePoints: number): Promise<number> => {
    try {
      const isActive = await isDoublePointsActive()
      return isActive ? basePoints * 2 : basePoints
    } catch (error) {
      console.error('Erreur lors du calcul des points:', error)
      return basePoints
    }
  }

  /**
   * Récupérer les informations de la campagne active
   */
  const getActiveCampaignInfo = async () => {
    try {
      const settings = await getAdminSettings()
      const isActive = await isDoublePointsActive()

      if (!isActive) {
        return null
      }

      return {
        name: settings.campaign_name || 'Points Compte Double',
        startDate: settings.campaign_start_date,
        endDate: settings.campaign_end_date,
        isActive: true
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos de campagne:', error)
      return null
    }
  }

  /**
   * Vérifier si un utilisateur peut scanner (limite par jour)
   */
  const canUserScan = async (userId: string): Promise<{ canScan: boolean; scansToday: number; maxScans: number }> => {
    try {
      const settings = await getAdminSettings()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Compter les scans d'aujourd'hui pour cet utilisateur
      const { data: scans, error } = await supabase
        .from('user_scans') // Table supposée pour tracker les scans
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      if (error) throw error

      const scansToday = scans?.length || 0
      const maxScans = settings.max_scans_per_day || 10

      return {
        canScan: scansToday < maxScans,
        scansToday,
        maxScans
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des limites de scan:', error)
      return {
        canScan: true,
        scansToday: 0,
        maxScans: 10
      }
    }
  }

  /**
   * Enregistrer un scan utilisateur
   */
  const recordUserScan = async (userId: string, commerceId?: string, points?: number) => {
    try {
      const { error } = await supabase
        .from('user_scans')
        .insert([{
          user_id: userId,
          commerce_id: commerceId,
          points_earned: points,
          created_at: new Date().toISOString()
        }])

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du scan:', error)
      return { success: false, error }
    }
  }

  /**
   * Nettoyer les anciens scans selon l'intervalle défini
   */
  const cleanupOldScans = async () => {
    try {
      const settings = await getAdminSettings()
      const intervalMinutes = settings.scan_cleanup_interval || 60
      const cutoffDate = new Date()
      cutoffDate.setMinutes(cutoffDate.getMinutes() - intervalMinutes)

      const { error } = await supabase
        .from('user_scans')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du nettoyage des scans:', error)
      return { success: false, error }
    }
  }

  return {
    getAdminSettings,
    isDoublePointsActive,
    calculatePoints,
    getActiveCampaignInfo,
    canUserScan,
    recordUserScan,
    cleanupOldScans
  }
}