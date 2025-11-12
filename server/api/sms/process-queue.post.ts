// server/api/sms/process-queue.post.ts
import { createClient } from '@supabase/supabase-js'

interface SMSQueueItem {
  id: string
  reward_id: string
  user_id: string
  boutique_slug: string
  phones: Array<{
    type: 'owner' | 'user'
    phone: string
    delay_seconds: number
    message: string
  }>
  validation_url: string
  status: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  try {
    // Initialisation Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔄 Début traitement queue SMS...')

    // Récupérer les SMS en attente
    const { data: pendingQueues, error } = await supabase
      .from('reward_sms_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5) // Traiter 5 queues max à la fois

    if (error) {
      console.error('❌ Erreur récupération queue:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur récupération queue SMS'
      })
    }

    if (!pendingQueues || pendingQueues.length === 0) {
      console.log('ℹ️ Aucune queue SMS en attente')
      return { processed: 0, message: 'Aucune queue SMS à traiter' }
    }

    console.log(`📱 ${pendingQueues.length} queue(s) SMS à traiter`)

    let totalProcessed = 0

    // Traiter chaque queue
    for (const queue of pendingQueues as SMSQueueItem[]) {
      try {
        console.log(`🔄 Traitement queue ${queue.id} pour reward ${queue.reward_id}`)

        // Marquer comme en cours de traitement
        await supabase
          .from('reward_sms_queue')
          .update({ status: 'processing' })
          .eq('id', queue.id)

        // Traiter chaque téléphone avec ses délais
        for (const phoneData of queue.phones) {
          try {
            console.log(`📱 SMS ${phoneData.type} programmé dans ${phoneData.delay_seconds}s pour ${phoneData.phone}`)

            // Attendre le délai spécifié
            if (phoneData.delay_seconds > 0) {
              await new Promise(resolve => setTimeout(resolve, phoneData.delay_seconds * 1000))
            }

            // Envoyer le SMS
            console.log(`📤 Envoi SMS ${phoneData.type} à ${phoneData.phone}`)
            
            const smsResponse = await $fetch('/api/sendsms', {
              method: 'POST',
              body: {
                phone: phoneData.phone,
                message: phoneData.message,
                user_id: queue.user_id
              }
            })

            console.log(`✅ SMS ${phoneData.type} envoyé avec succès`)

          } catch (smsError: any) {
            console.error(`❌ Erreur SMS ${phoneData.type}:`, smsError)
            // Continuer avec les autres SMS même si un échoue
          }
        }

        // Marquer la queue comme terminée
        await supabase
          .from('reward_sms_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', queue.id)

        console.log(`✅ Queue ${queue.id} terminée`)
        totalProcessed++

      } catch (queueError: any) {
        console.error(`❌ Erreur traitement queue ${queue.id}:`, queueError)
        
        // Marquer comme échoué
        await supabase
          .from('reward_sms_queue')
          .update({ status: 'failed' })
          .eq('id', queue.id)
      }
    }

    console.log(`✅ Traitement terminé: ${totalProcessed}/${pendingQueues.length} queues traitées`)

    return {
      success: true,
      processed: totalProcessed,
      total: pendingQueues.length,
      message: `${totalProcessed} queue(s) SMS traitée(s) avec succès`
    }

  } catch (error: any) {
    console.error('❌ Erreur générale traitement queue SMS:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur traitement queue SMS'
    })
  }
})