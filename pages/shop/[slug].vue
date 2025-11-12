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
                    <p class="block text-blue-800 font-bold bg-blue-100 rounded-lg p-2 text-xs">{{ boutique.actif }}</p>
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
                        <span class="text-white text-sm">S'y rendre</span>
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
                        <span class="text-white text-sm">Voir le site web</span>
                      </NuxtLink>
                      <NuxtLink :to="`${boutique.madeinconflans}`" target="_blank"
                        class="flex justify-start items-center gap-4  text-white rounded-md px-4 py-2 text-s">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="36"
                          viewBox="0 0 115 70">
                          <defs>
                            <path id="eabe003wha" d="M0.09 0.077L5.848 0.077 5.848 8.846 0.09 8.846z"></path>
                            <path id="gotb4uvgkc" d="M0.01 0.077L27.818 0.077 27.818 5.435 0.01 5.435z"></path>
                          </defs>
                          <g fill="none" fill-rule="evenodd">
                            <g>
                              <g>
                                <path fill="#0B0754"
                                  d="M38.666 9L38.666 3.576 36.639 7.651 36.361 7.651 34.334 3.576 34.334 9 33 9 33 0 34.146 0 36.5 4.736 38.854 0 40 0 40 9z"
                                  transform="translate(-53 -19) translate(53 19)"></path>
                                <g>
                                  <g transform="translate(-53 -19) translate(53 19) translate(43.001)">
                                    <mask id="ljrwpuypyb" fill="#fff">
                                      <use xlink:href="#eabe003wha"></use>
                                    </mask>
                                    <path fill="#0B0754"
                                      d="M4.398 3.388c0-1.267-.647-1.876-1.436-1.876-.789 0-1.436.609-1.436 1.876v1.15h2.872v-1.15zM1.526 8.846H.09V3.388C.09 1.254 1.384.076 2.962.076c1.591 0 2.886 1.178 2.886 3.312v5.458h-1.45V5.975H1.526v2.871z"
                                      mask="url(#ljrwpuypyb)"></path>
                                  </g>
                                  <path fill="#0B0754"
                                    d="M53.157 7.41h.582c1.256 0 2.29-1.293 2.29-2.871 0-1.59-1.034-2.885-2.29-2.885h-.582V7.41zM51.721.22h2.018c2.135 0 3.882 1.926 3.882 4.319 0 2.38-1.747 4.307-3.882 4.307h-2.018V.219zM60.351.219L64.659.219 64.659 1.655 61.787 1.655 61.787 3.388 64.659 3.388 64.659 4.824 61.787 4.824 61.787 7.41 64.659 7.41 64.659 8.846 60.351 8.846zM73.289 1.654L71.853 1.654 71.853.219 76.161.219 76.161 1.654 74.726 1.654 74.726 7.41 76.161 7.41 76.161 8.846 71.853 8.846 71.853 7.41 73.289 7.41zM83.511.219L84.805.219 84.805 8.846 83.718 8.846 80.341 3.336 80.341 8.846 79.047 8.846 79.047.219 80.121.219 83.511 5.729zM7.236 17.815c2.467 0 4.186.665 5.822 2.495l-2.412 2.55c-.887-1.082-1.996-1.525-3.41-1.387-2.385.25-3.188 2.827-3.188 5.211 0 2.383.803 5.044 3.188 5.21 1.47.083 2.606-.443 3.41-1.663l2.412 2.827c-1.636 1.83-3.355 2.495-5.822 2.495C2.772 35.553 0 31.146 0 26.684s3.05-8.869 7.236-8.869M18.52 26.684c0 2.771.915 5.21 3.327 5.21 2.411 0 3.326-2.439 3.326-5.21 0-2.772-.915-5.21-3.326-5.21-2.412 0-3.328 2.438-3.328 5.21m3.328-8.869c4.49 0 7.374 4.38 7.374 8.869 0 4.49-2.883 8.869-7.374 8.869-4.492 0-7.375-4.38-7.375-8.87 0-4.489 2.883-8.868 7.375-8.868M41.309 34.998L35.598 25.575 35.598 34.998 31.606 34.998 31.606 18.37 35.598 18.37 41.309 27.792 41.309 18.37 45.301 18.37 45.301 34.998zM52.51 34.998L48.517 34.998 48.517 18.37 57.638 18.37 57.638 22.083 52.51 22.083 52.51 24.688 57.362 24.688 57.362 28.402 52.51 28.402zM64.043 31.284L69.865 31.284 69.865 34.998 60.051 34.998 60.051 18.37 64.043 18.37zM78.293 23.552l-1.497 4.933h2.994l-1.497-4.933zm-3.66 12l-3.992-.886 5.96-16.296h3.383l5.96 16.296-3.992.887-1.025-3.354h-5.268l-1.025 3.354zM97.423 34.998L91.712 25.575 91.712 34.998 87.719 34.998 87.719 18.37 91.712 18.37 97.423 27.792 97.423 18.37 101.415 18.37 101.415 34.998zM107.265 27.238c-1.608-.86-3.188-2.217-3.188-4.656 0-2.772 3.05-4.767 5.545-4.767 1.996 0 3.41.555 4.713 1.94l-2.218 2.633c-.693-.693-1.303-1.025-2.218-1.025-.998 0-1.94.277-1.94 1.22 0 .941 1.025 1.468 2.078 2.022l1.525.832c1.969 1.053 3.327 2.66 3.327 4.85 0 2.993-2.828 5.266-5.822 5.266-1.857 0-3.88-.555-5.267-2.356l2.356-2.91c.693.97 1.803 1.663 2.911 1.663.943 0 1.941-.582 1.941-1.663 0-.97-.97-1.524-2.218-2.217l-1.525-.832zM62.736 58.487H54.02c-.905 0-1.639-.598-1.653-1.336l.955-10.767h1.61v1.46c0 .268.214.482.481.482s.481-.214.481-.481v-1.46h4.963v1.46c0 .267.214.48.481.48s.481-.213.481-.48v-1.46h1.61l.959 10.766c-.014.738-.752 1.336-1.653 1.336m-4.358-15.493c1.35 0 2.452 1.082 2.48 2.425h-4.96c.03-1.343 1.13-2.425 2.48-2.425m6.97 14.093l-.998-11.23c-.022-.249-.232-.438-.478-.438H61.82c-.028-1.873-1.56-3.387-3.442-3.387-1.88 0-3.413 1.514-3.441 3.387h-2.053c-.249 0-.456.189-.477.438l-.998 11.23c0 .015-.003.029-.003.043 0 1.279 1.172 2.319 2.615 2.319h8.715c1.443 0 2.615-1.04 2.615-2.319 0-.014 0-.028-.004-.043"
                                    transform="translate(-53 -19) translate(53 19)"></path>
                                  <path fill="#0B0754"
                                    d="M74.28 57.896c.103.032.2.083.288.156.355.293.404.818.11 1.172-2.545 3.072-5.912 5.323-9.736 6.508-3.92 1.214-8.074 1.222-12.015.022-4.846-1.475-8.955-4.674-11.57-9.007-.237-.394-.11-.905.283-1.143.394-.237.906-.11 1.143.283 2.402 3.98 6.177 6.92 10.63 8.275 3.62 1.102 7.436 1.095 11.036-.02 3.514-1.09 6.608-3.157 8.947-5.98.22-.267.573-.36.884-.266"
                                    transform="translate(-53 -19) translate(53 19)"></path>
                                  <g transform="translate(-53 -19) translate(53 19) translate(45.143 63.74)">
                                    <mask id="iu2hiy8rdd" fill="#fff">
                                      <use xlink:href="#gotb4uvgkc"></use>
                                    </mask>
                                    <path fill="#0B0754"
                                      d="M27.644.154c.039.028.074.063.102.105.132.197.077.472-.123.614-4.058 2.885-8.786 4.46-13.673 4.557-4.993.1-9.753-1.368-13.766-4.243-.192-.138-.23-.412-.087-.612C.24.375.513.324.705.462 4.57 3.232 9.157 4.646 13.968 4.55c4.71-.094 9.266-1.612 13.176-4.391.157-.112.357-.108.5-.006"
                                      mask="url(#iu2hiy8rdd)"></path>
                                  </g>
                                  <path fill="#0B0754"
                                    d="M27.092 4.716c0 .703-.57 1.273-1.274 1.273-.704 0-1.274-.57-1.274-1.273 0-.704.57-1.274 1.274-1.274.704 0 1.274.57 1.274 1.274M92.26 4.716c0 .703-.57 1.273-1.274 1.273-.704 0-1.274-.57-1.274-1.273 0-.704.57-1.274 1.274-1.274.704 0 1.274.57 1.274 1.274"
                                    transform="translate(-53 -19) translate(53 19)"></path>
                                </g>
                              </g>
                            </g>
                          </g>
                        </svg>
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
              <div class="py-3 flex flex-col items-start justify-start gap-3 rounded-lg w-full">
                <ShopLoyaltyCard :shop-slug="scannedShopSlug" />
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