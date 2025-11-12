<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue'
import CoverUpload from '@/components/CoverUpload.vue'
import LogoUpload from '@/components/LogoUpload.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const isLoading = ref(true)
const ownedBoutiques = ref([])

definePageMeta({
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


const updateCoverPhoto = async (boutiqueId, newUrl) => {
  const { data, error } = await supabase
    .from('boutique')
    .update({ photo_url: newUrl })
    .eq('id', boutiqueId)

  if (error) {
    console.error('Erreur lors de la mise à jour de la photo de couverture:', error)
  } else {
    const boutiqueIndex = ownedBoutiques.value.findIndex(b => b.id === boutiqueId)
    if (boutiqueIndex !== -1) {
      ownedBoutiques.value[boutiqueIndex].photo_url = newUrl
    }
  }
}

const updateLogo = async (boutiqueId, newUrl) => {
  const { data, error } = await supabase
    .from('boutique')
    .update({ logo_shop: newUrl })
    .eq('id', boutiqueId)

  if (error) {
    console.error('Erreur lors de la mise à jour du logo:', error)
  } else {
    const boutiqueIndex = ownedBoutiques.value.findIndex(b => b.id === boutiqueId)
    if (boutiqueIndex !== -1) {
      ownedBoutiques.value[boutiqueIndex].logo_shop = newUrl
    }
  }
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
    <div v-if="isLoading"><Loader /></div>
    <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</div>
    <div v-else>     
      <div v-for="boutique in ownedBoutiques" :key="boutique.id" class="mb-8">
        <div 
          class="h-[400px] bg-blue-800 flex items-end p-4 relative" 
          :style="{
            backgroundSize: 'cover',
            backgroundImage: `url('${boutique.photo_url}')`,
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }"
        >
        <CoverUpload @update:coverUrl="(url) => updateCoverPhoto(boutique.id, url)" />
      </div>
      <div class="pb-24 mx-auto max-w-2xl">  
        <div class="rounded-lg w-30 absolute top-[340px] pl-2">
          <div class="flex items-center justify-start gap-5 relative">
            <figure class="inline bg-white p-2 rounded-lg"> 
              <img :src="boutique.logo_shop" alt="Logo de la boutique" class="w-24 h-24 object-contain rounded-lg" />
              <LogoUpload @update:logoUrl="(url) => updateLogo(boutique.id, url)" />
            </figure>
          </div>
        </div>
        <div class="flex flex-col pt-24 p-4 gap-y-10">
          <div class="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800">
            <div class="px-4 py-6 sm:px-6 flex justify-between items-start flex-col">
              <p class="text-xl font-medium text-blue-900">{{ boutique.name_shop }}</p>
            </div>
            <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl class="sm:divide-y sm:divide-gray-200">
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">STAT</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
                    <span class="block"><span class="font-semibold text-blue-800">{{ boutique.uniqueUserCount }}</span> cartes de fidélité</span>
                    <span class="block"><span class="font-semibold text-blue-800">{{ boutique.rewardCount }}</span> scans de votre QRcode</span>
                  </dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Secteur d'activité</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">{{ boutique.categories_shop }}</dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Avantage</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2 flex flex-col justify-start items-start">
                    <p>{{ boutique.formule_shop }}</p>
                  </dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Infos</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2 flex flex-col justify-start">
                    <span>{{ boutique.address_shop }}</span>
                    <span>{{ boutique.tel_shop }}</span>
                    <span>{{ boutique.email_shop }}</span>
                  </dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">A propos</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2 flex flex-col justify-start">
                    <p v-html="`${boutique.description_shop}` "></p>
                  </dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Horaire</dt>
                  <dd class="mt-1 text-sm flex flex-col items-start justify-start gap-3 rounded-lg">
                    <p class="text-gray-700 leading-tight mb-4 preserve-newlines" v-html="boutique.horaire_shop.replace(/\n/g, '<br>')"></p>
                  </dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Mots-clé </dt>
                  <dd class="mt-1 text-sm text-blue-800 sm:mt-0 sm:col-span-2">
                    <span v-for="tag in boutique.tag_shop.split(',')" :key="tag" class="inline-flex items-center px-2 py-1 mb-2 mr-2 text-sm font-medium text-gray-700 bg-blue-100 rounded">
                      {{ tag.trim() }}
                    </span>
                  </dd>
                </div>
                <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">
                    <NuxtLink to="/edit-societe" class="text-xs font-semibold text-blue-800 uppercase dark:text-white hover:underline">
                      Modifier
                    </NuxtLink>
                  </dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2 flex flex-col justify-start items-start"></dd>
                </div>
              </dl>
            </div>
          </div> 
        </div>
      </div>
    </div>
  </div>
  </div>
</template>