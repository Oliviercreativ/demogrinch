// server/api/sms/check-queue.get.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer tous les SMS de la queue
    const { data: allSMS, error } = await supabase
      .from('reward_sms_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Compter par statut
    const pending = allSMS?.filter(sms => sms.status === 'pending').length || 0
    const processing = allSMS?.filter(sms => sms.status === 'processing').length || 0
    const completed = allSMS?.filter(sms => sms.status === 'completed').length || 0
    const failed = allSMS?.filter(sms => sms.status === 'failed').length || 0

    return {
      success: true,
      summary: {
        pending,
        processing,
        completed,
        failed,
        total: allSMS?.length || 0
      },
      recent_sms: allSMS?.slice(0, 5) || []
    }

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur vérification queue: ' + error.message
    })
  }
})