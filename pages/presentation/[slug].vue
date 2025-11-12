<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'
import Dialog from '@/components/Dialog.vue'
import QRCode from '@/components/QRCode.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { GoogleMap, Marker } from 'vue3-google-map'

definePageMeta({
showHeader: false,
showNavbar: false,
showAdminbar: false,
showFooter: false
})


const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)

const boutique = ref(null)
const reward = ref(null)
const isLoading = ref(true)
const error = ref(null)
const dialogOpen = ref(false)
const googleMapsApiKey = ref(process.env.GOOGLE_MAPS_API_KEY)
const scanSuccess = ref(false)

const fetchBoutiqueAndReward = async () => {
const boutiqueSlug = route.params.slug

try {
  const [boutiqueResponse, rewardResponse] = await Promise.all([
    supabase.from('boutique').select('*').eq('slug', boutiqueSlug).single(),
    user.value ? supabase
      .from('reward')
      .select('*')
      .eq('user_uid_reward', user.value.id)
      .eq('store_slug', boutiqueSlug)
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

onMounted(async () => {
const { data, error } = await supabase
  .from('boutique')
  .select('*')
  .eq('slug', route.params.slug)
  .single()

if (error) {
  console.error('Error fetching boutique:', error)
} else {
  boutique.value = data
}
})

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

const mapCenter = computed(() => {
if (boutique.value && boutique.value.latitude && boutique.value.longitude) {
  return { lat: boutique.value.latitude, lng: boutique.value.longitude }
}
return { lat: 0, lng: 0 }
})

const isOneVisitAway = computed(() => {
return boutique.value && reward.value && (boutique.value.limite - reward.value.new_solde === 1)
})

const isRewardWon = computed(() => {
return boutique.value && reward.value && (reward.value.new_solde >= boutique.value.limite)
})

const hasWebsite = computed(() => {
return !!boutique.value?.site_web_store
})
const hasGoogleMaps = computed(() => {
return !!boutique.value?.google_maps_store
})

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
</script>

<template>
  <div class="min-h-screen flex items-center justify-center w-full bg-black">
    <div v-if="isLoading" class="flex justify-center items-center h-screen">
      <Loader />
    </div>

    <div v-else-if="boutique" class="rounded-lg">
      <div class="grid md:grid-cols-2 lg:grid-cols-2 sm:grid-cols gap-4 place-items-center">
        <div class="py-3 flex flex-col items-start justify-start gap-6 p-4">
          <div>
            <div>
              <div class="flex justify-center items-center gap-2 flex-col">
                <p class="text-white text-xl text-left">
                  Profitez de la carte de fidélité de <span class="text-blue-500 font-semibold">{{ boutique.name_shop
                    }}</span> pour gagner votre lot: <br><span class="text-blue-500 font-semibold">{{
                    boutique.formule_shop }}</span>
                </p>
                <div class="text-white text-md text-left py-10 flex flex-col gap-10">
                  <span class="text-lg font-semibold">Comment ça marche ?</span>
                  <ul class="flex gap-5 flex-col">
                    <li class="text-white">
                      <p>1 - Scannez le QRCODE de la carte de fidélité <span class="text-blue-500 font-semibold">{{
                          boutique.name_shop }}</span> à votre droite ou rendez-vous sur <u>madeinconflans.grinch.fr</u>
                      </p>
                    </li>
                    <li class="text-white">
                      <p>2 - Créer un compte ou connectez-vous</p>
                    </li>
                    <li class="text-white flex flex-wrap gap-2 justify-start items-center">
                      <p>3 - Cliquez sur l'icone en haut à gauche et scanner ce QRCODE <svg
                          xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-qrcode stroke-white"
                          width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none"
                          stroke-linecap="round" stroke-linejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                          <path d="M7 17l0 .01" />
                          <path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                          <path d="M7 7l0 .01" />
                          <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                          <path d="M17 7l0 .01" />
                          <path d="M14 14l3 0" />
                          <path d="M20 14l0 .01" />
                          <path d="M14 14l0 3" />
                          <path d="M14 20l3 0" />
                          <path d="M17 17l3 0" />
                          <path d="M20 17l0 3" />
                        </svg></p>
                    </li>
                    <li class="text-white">
                      <p>4 - Une fois scanné, votre point a été ajouté automatiquement sur votre carte de fidélité <span
                          class="text-blue-500 font-semibold">{{ boutique.name_shop }}</span> et décrouvrez d'autres
                        boutiques</p>
                    </li>
                  </ul>
                  <span class="text-sm font-semibold">Inscription rapide avec google, spotify, facebook</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 bg-white radius-lg">
          <QRCode :value="`https://madeinconflans.grinch.fr/presentation/${route.params.slug}`" :size="200" />
        </div>
      </div>
    </div>
  </div>
</template>