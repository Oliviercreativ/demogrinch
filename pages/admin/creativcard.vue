<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const isLoading = ref(true)
const ownedBoutiques = ref([])

definePageMeta({
  middleware: ['auth'],
  showHeader: false,
  showNavbar: false,
})

async function fetchBoutiqueData(boutique) {
  const [rewardCountResult, rewardsResult] = await Promise.all([
    supabase
      .from('reward')
      .select('count', { count: 'exact' })
      .eq('store_slug', boutique.slug),
    supabase
      .from('reward')
      .select('user_uid_reward')
      .eq('store_slug', boutique.slug)
  ])

  if (rewardCountResult.error) {
    console.error('Erreur lors du comptage des récompenses:', rewardCountResult.error)
  }

  if (rewardsResult.error) {
    console.error('Erreur lors de la récupération des récompenses:', rewardsResult.error)
  } else {
    const uniqueUserIds = new Set(rewardsResult.data.map(reward => reward.user_uid_reward))
    boutique.uniqueUserCount = uniqueUserIds.size
  }

  boutique.rewardCount = rewardCountResult.count
}

onMounted(async () => {
  if (user.value) {
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)

    if (boutiques && boutiques.length > 0) {
      isOwner.value = true
      ownedBoutiques.value = boutiques

      await Promise.all(ownedBoutiques.value.map(fetchBoutiqueData))
    }
  }
  isLoading.value = false
})
</script>

<template>
  <div>
    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
    </div>
    <div v-else>
      <div class="pb-24 mx-auto">
        <div class="flex flex-col justify-center items-center gap-5 w-full">
          <img src="https://www.creativcard.fr/wp-content/uploads/2024/04/dscf4632.webp" class="w-full" />
          <div class="flex flex-col justify-center items-center gap-5 w-full p-4">
            <img src="https://www.creativcard.fr/wp-content/uploads/2024/04/logo-od-cc.png" width="150" />
            <p class="font-bold uppercase text-center">Commander votre dernière carte de visite</p>
            <p class="text-center">Vous avez juste à passer derrière le téléphone votre carte de
              visite personnalisée et votre profil s'affichera avec les infos que vous avez renseigné grâce à la technologie NFC directement sur le smartphone de votre interlocuteur.</p>
            <NuxtLink to="https://www.creativcard.fr" target="_blank" class="text-blue-800 underline">
              En savoir plus
            </NuxtLink>
            <NuxtLink to="https://my.creativcard.fr/olivier-demontant" target="_blank" class="text-blue-800 underline">
              Consulter un profil
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>