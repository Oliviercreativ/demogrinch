<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

onBeforeUnmount(() => {
  if (html5QrCode) {
    html5QrCode.stop().catch(err => console.log('Erreur lors de l\'arrêt du scanner:', err))
  }
})

const extractScanUid = (url) => {
  const match = url.match(/\/([\w-]+)$/)
  return match ? match[1] : null
}

const findBoutiqueByScanUid = async (scanUid) => {
  const { data, error } = await $supabase
    .from('boutique')
    .select('*')
    .eq('scan_uid', scanUid)
    .single()

  if (error) {
    throw new Error('Boutique non trouvée')
  }

  return data
}

const addHitToReward = async (boutiqueSlug, decodedUrl) => {
  try {
    const { data: { user }, error: userError } = await $supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      errorMessage.value = 'Utilisateur non authentifié'
      return router.push('/login')
    }
    console.log('Utilisateur connecté')

    const userEmail = user.email

    const { data: rewardData, error: rewardError } = await $supabase
      .from('reward')
      .select('*')
      .eq('user_id', userEmail)
      .eq('store_slug', boutiqueSlug)

    if (rewardError) {
      throw rewardError
    }

    let currentSolde = 0
    let newSolde = 0
    let counter = 1

    if (rewardData && rewardData.length > 0) {
      currentSolde = rewardData[0].solde + counter
      newSolde = rewardData[0].new_solde + counter

      const { error: updateError } = await $supabase
        .from('reward')
        .update({ new_solde: newSolde })
        .eq('user_id', userEmail)
        .eq('store_slug', boutiqueSlug)

      if (updateError) {
        console.error('Erreur lors de la mise à jour ou de l\'ajout du reward:', updateError.message)
      } else {
        console.log('Hit mise à jour avec succès')
        const scannedUrl = new URL(decodedUrl)
        scannedUrl.searchParams.append('action', 'visite')
        window.location.href = scannedUrl.href
      }
    } else {
      currentSolde = -1
      newSolde = 0

      const { error: insertError } = await $supabase
        .from('reward')
        .insert([{ user_id: userEmail, store_slug: boutiqueSlug, solde: currentSolde, new_solde: newSolde, hit_date: new Date() }])

      if (insertError) {
        console.error('Erreur lors de la mise à jour ou de l\'ajout du reward:', insertError.message)
      } else {
        console.log('Hit ajouté avec succès')
        const scannedUrl = new URL(decodedUrl)
        scannedUrl.searchParams.append('action', 'visite')
        window.location.href = scannedUrl.href
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout ou de la mise à jour du reward:', error.message)
    errorMessage.value = 'Erreur lors de l\'ajout ou de la mise à jour du reward'
  }
}
</script>

<template>
  <div>
    <div id="reader" style="width: 100%; height: 400px;"></div>
    <p v-if="scanResult">QR Code détecté : {{ scanResult }}</p>
    <p v-if="errorMessage" class="text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
#reader {
  border: 2px solid #ccc;
  width: 100%;
}
</style>