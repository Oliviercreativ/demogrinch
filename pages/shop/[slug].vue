<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'
import QRCode from '@/components/QRCode.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ShopScheduleDisplay from '@/components/ShopScheduleDisplay.vue'


definePageMeta({
  showHeader: false
})

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)

const { checkProfile } = useProfileCheck()
onMounted(async () => {
  await checkProfile()
})

const boutique = ref(null)
const reward = ref(null)
const isLoading = ref(true)
const error = ref(null)
const dialogOpen = ref(false)
const googleMapsApiKey = ref(process.env.GOOGLE_MAPS_API_KEY)
const scanSuccess = ref(false)

// Timeout de sécurité pour le loader (10 secondes)
let loaderTimeout = null
const startLoaderTimeout = () => {
  if (loaderTimeout) clearTimeout(loaderTimeout)
  loaderTimeout = setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false
      error.value = 'Le chargement a pris trop de temps. Veuillez réessayer.'
    }
  }, 10000)
}

// Extract shop slug from route params
const scannedShopSlug = computed(() => route.params.slug)

const fetchBoutiqueAndReward = async () => {
  isLoading.value = true
  error.value = null
  startLoaderTimeout()
  const boutiqueSlug = route.params.slug

  try {
    const [boutiqueResponse, rewardResponse] = await Promise.all([
      supabase.from('boutique').select('*').eq('slug', boutiqueSlug).single(),
      user.value ? supabase
        .from('reward')
        .select('*')
        .eq('user_uid_reward', user.value.id)
        .eq('store_slug', boutiqueSlug)
        .eq('is_read', false)
        .order('hit_date', { ascending: false })
        .limit(1)
        .single() : null
    ])

    if (boutiqueResponse.error) throw boutiqueResponse.error
    boutique.value = boutiqueResponse.data

    if (rewardResponse) {
      if (rewardResponse.error && rewardResponse.error.code !== 'PGRST116') {
        throw rewardResponse.error
      }
      reward.value = rewardResponse.data
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des données:', err)
    error.value = 'Impossible de charger les informations de la boutique.'
  } finally {
    isLoading.value = false
    if (loaderTimeout) clearTimeout(loaderTimeout)
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const options = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  return new Intl.DateTimeFormat('fr-FR', options).format(date)
}

onMounted(fetchBoutiqueAndReward)

const toggleDialog = () => {
  dialogOpen.value = !dialogOpen.value
}

const isExpanded = ref(false)
const linesLimit = 1

const processedContent = computed(() => {
  if (!boutique.value) return { firstLines: '', remainingLines: '' }
  const lines = boutique.value.description_shop.split('\n')
  const firstLines = lines.slice(0, linesLimit).join('\n')
  const remainingLines = lines.slice(linesLimit).join('\n')
  return { firstLines, remainingLines }
})

const displayedContent = computed(() => {
  if (!boutique.value) return ''
  if (isExpanded.value) {
    return boutique.value.description_shop
  }
  return processedContent.value.firstLines + (hasMoreContent.value ? '...' : '')
})

const hasMoreContent = computed(() => {
  return processedContent.value.remainingLines.trim().length > 0
})

const toggleReadMore = () => {
  isExpanded.value = !isExpanded.value
}

onMounted(() => {
  const scanParam = route.query.scan
  if (scanParam === 'success') {
    scanSuccess.value = true
  }
})
const closeScanSuccessMessage = () => {
  scanSuccess.value = false
}
onMounted(async () => {
  if (user.value) {
    const { data, error } = await supabase
      .from('boutique')
      .select('id')
      .eq('owner', user.value.id)
      .limit(1)

    if (data && data.length > 0) {
      isOwner.value = true
    }
  }
})

const fetchScannedBoutique = async () => {
  const boutiqueSlug = route.query.boutique
  isLoading.value = true
  error.value = null

  if (!boutiqueSlug || !user.value) {
    error.value = 'Paramètres manquants'
    isLoading.value = false
    return
  }

  try {
    // ... code existant ...
  } catch (error) {
    console.error('Erreur:', error)
    error.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex justify-center items-center h-screen">
      <Loader />
    </div>

    <div v-else-if="error" class="text-gray-500 text-center p-4">{{ error }}</div>

    <div v-else-if="boutique" class="rounded-lg">
      <div class="flex flex-col justify-center items-center">
        <div class="max-auto w-full rounded-lg relative">
          <figure>
            <img :src="boutique.photo_url" :alt="boutique.name_shop" class="h-[350px] object-cover w-full">
          </figure>
          <div class="pb-24 mx-auto max-w-2xl">
            <div class="py-3 flex flex-col items-start justify-start gap-6 p-4">
              <div class="rounded-lg w-30 bg-white z-1 -mt-20 p-2">
                <figure>
                  <img :src="boutique.logo_shop" :alt="boutique.name_shop"
                    class="bg-white object-cover w-24 h-24 rounded-lg">
                </figure>
              </div>
              <div>
                <div>
                  <div class="flex justify-start items-start gap-2 flex-col">
                    <div class="flex justify-start items-center gap-2 py-4">
                      <p class="text-2xl font-bold text-blue-800 dark:text-white">{{ boutique.name_shop }}</p>
                    </div>
                  </div>
                  <div v-if="isLoading" class="flex justify-center items-center h-32">
                    <Loader />
                  </div>
                  <div v-else-if="error"
                    class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Erreur :</strong>
                    <span class="block sm:inline">{{ error }}</span>
                  </div>
                  <div v-else-if="!reward" class="text-center text-gray-600 dark:text-white">
                    <p class="text-blue-800 text-left font-medium">{{ boutique.formule_shop }}</p>
                  </div>
                  <div v-else class="w-full">

                  </div>


                  <div class="flex flex-col gap-2 items-start justify-start w-full">

                    <!--
                      <div class="my-3 -ml-2 text-sm text-blue-800 dark:text-white inline-block text-center uppercase font-medium border border-blue-800 rounded-full px-4 py-2">
                        {{ boutique.categories_shop }}
                      </div>
                    -->
                    <div class="flex justify-start items-center gap-2 py-4">
                      <svg xmlns="http://www.w3.org/2000/svg" x-bind:width="size" x-bind:height="size"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" x-bind:stroke-width="stroke"
                        stroke-linecap="round" stroke-linejoin="round" width="26" height="26" stroke-width="1"
                        class="stroke-blue-800">
                        <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
                        <path d="M12.02 21.485a1.996 1.996 0 0 1 -1.433 -.585l-4.244 -4.243a8 8 0 1 1 13.403 -3.651">
                        </path>
                        <path d="M16 22l5 -5"></path>
                        <path d="M21 21.5v-4.5h-4.5"></path>
                      </svg>
                      <p class="text-blue-800">{{ boutique.address_shop }}</p>
                    </div>
                    <div class="flex justify-start items-center gap-2">
                      <NuxtLink :to="`${boutique.google_maps_shop}`" target="_blank"
                        class="flex justify-start items-center gap-4 bg-blue-800 text-white rounded-md px-4 py-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-map-2 stroke-white"
                          width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#597e8d" fill="none"
                          stroke-linecap="round" stroke-linejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5" />
                          <path d="M9 4v13" />
                          <path d="M15 7v5.5" />
                          <path
                            d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z" />
                          <path d="M19 18v.01" />
                        </svg>
                        <span class="text-white text-xs">S'y rendre</span>
                      </NuxtLink>
                      <NuxtLink :to="`${boutique.siteweb_store}`" target="_blank"
                        class="flex justify-start items-center gap-4 bg-blue-800 text-white rounded-md px-4 py-2 text-s">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="stroke-white icon icon-tabler icon-tabler-world-www" width="26" height="26"
                          viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round"
                          stroke-linejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M19.5 7a9 9 0 0 0 -7.5 -4a8.991 8.991 0 0 0 -7.484 4" />
                          <path d="M11.5 3a16.989 16.989 0 0 0 -1.826 4" />
                          <path d="M12.5 3a16.989 16.989 0 0 1 1.828 4" />
                          <path d="M19.5 17a9 9 0 0 1 -7.5 4a8.991 8.991 0 0 1 -7.484 -4" />
                          <path d="M11.5 21a16.989 16.989 0 0 1 -1.826 -4" />
                          <path d="M12.5 21a16.989 16.989 0 0 0 1.828 -4" />
                          <path d="M2 10l1 4l1.5 -4l1.5 4l1 -4" />
                          <path d="M17 10l1 4l1.5 -4l1.5 4l1 -4" />
                          <path d="M9.5 10l1 4l1.5 -4l1.5 4l1 -4" />
                        </svg>
                        <span class="text-white text-xs">Voir le site web</span>
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white w-full flex items-top justify-start gap-5 flex-col rounded-lg p-4 shadow">
                <p class="text-lg uppercase font-semibold text-blue-800 dark:text-white">A propos de {{
                  boutique.name_shop }}</p>
                <p class="text-gray-700 leading-tight preserve-newlines" v-html="displayedContent"></p>
                <button v-if="hasMoreContent" @click="toggleReadMore"
                  class="text-blue-800 dark:text-white font-medium hover:underline flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-circle-chevron-down transition-transform duration-500"
                    :class="{ 'rotate-180': isExpanded }" width="24" height="24" viewBox="0 0 24 24" stroke-width="1"
                    stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 11l-3 3l-3 -3" />
                    <path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18z" />
                  </svg>
                  <span class="ml-2">{{ isExpanded ? 'Lire moins' : 'Lire plus' }}</span>
                </button>
                <div class="py-3 flex flex-col items-start justify-start gap-3 rounded-lg w-full">
                  <ShopOpenStatus :uid="boutique.uid" />
                </div>
              </div>
              <div class="col-span-full py-3 flex flex-col items-start justify-start gap-3 rounded-lg w-full">
                <ShopLoyaltyCard :shop-slug="scannedShopSlug" />
              </div>
              
              <!-- QR Code pour scanner et ajouter un point -->
              <div class="flex flex-col items-start justify-start gap-3 rounded-lg w-full">
                <ShopQRCode 
                  v-if="boutique?.scan_uid" 
                  :scan-uid="boutique.scan_uid"
                  :shop-name="boutique.name_shop"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preserve-newlines {
  white-space: pre-wrap;
}

.rotate-180 {
  transform: rotate(180deg);
}

.transition-max-height {
  transition-property: max-height;
}

.duration-500 {
  transition-duration: 500ms;
  transition-timing-function: ease-in-out;
}
</style>