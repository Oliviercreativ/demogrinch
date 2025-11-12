<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
 
const supabase = useSupabaseClient()
const isChecking = ref(false)
const nearbyShops = ref([])
const error = ref(null)
const checked = ref(false)

const MAX_DISTANCE = 2000 // Distance maximale en mètres

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Rayon de la terre en mètres
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance en mètres
}

function vibrate(pattern) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Erreur lors de la vibration:', error);
    }
  } else {
    console.log('La vibration n\'est pas supportée sur cet appareil');
  }
}

async function checkProximity() {
  isChecking.value = true
  error.value = null
  nearbyShops.value = []
  checked.value = false

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    const { latitude, longitude } = position.coords

    const { data: shops, error: shopError } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', false)
      .eq('demo', true)

    if (shopError) throw shopError

    const shopsWithDistance = shops.map(shop => ({
      ...shop,
      distance: calculateDistance(latitude, longitude, shop.latitude, shop.longitude)
    }))

    nearbyShops.value = shopsWithDistance
      .filter(shop => shop.distance <= MAX_DISTANCE)
      .sort((a, b) => a.distance - b.distance)

    checked.value = true
    if (nearbyShops.value.length > 0) {
      vibrate([200, 100, 200]);
    } else {
      vibrate([200]);
    }

  } catch (e) {
    if (e.code === 1) {
      error.value = "Permission de géolocalisation refusée. Veuillez l'activer dans les paramètres de votre navigateur."
    } else {
      error.value = "Erreur lors de la vérification de la proximité : " + e.message
    }
    vibrate([100, 50, 100, 50, 100]);
  } finally {
    isChecking.value = false
  }
}
</script>

<template>
  <div class="flex justify-center items-center flex-col">
    <!-- Bouton de vérification -->
    <button @click="checkProximity" :disabled="isChecking"
      class="text-white bg-blue-800 border text-center border-blue-800 rounded-md p-2 flex items-center justify-center gap-2 text-sm w-full max-w-lg mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-map-pin-star stroke-white" width="36"
        height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round"
        stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M15 11a3 3 0 1 0 -3.908 2.86" />
        <path d="M11.059 21.25a2 2 0 0 1 -.472 -.35l-4.244 -4.243a8 8 0 1 1 13.646 -6.079" />
        <path
          d="M17.8 20.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138z" />
      </svg>
      {{ isChecking ? 'Vérification en cours...' : 'Vérifier les boutiques à proximité' }}
    </button>
    <span class="text-zinc-500 text-xs text-center mb-6">Vous devez activer la geolocalisation sur votre
      smartphone</span>

    <div v-if="nearbyShops.length > 0" class="w-full">
      <p class="text-lg uppercase text-blue-800 font-semibold py-4 text-center">
        Les boutiques à proximité
      </p>

      <div class="relative w-full">
        <div class="overflow-x-auto snap-x snap-mandatory flex space-x-4 pb-6 px-4 scrollbar-hide">
          <div v-for="shop in nearbyShops" :key="shop.id" class="snap-center flex-none w-[90vw] md:w-[400px]">
            <NuxtLink :to="`/shop/${shop.slug}`">
              <div
                class="bg-white rounded-2xl overflow-hidden transform transition-transform hover:scale-[1.02] duration-300 h-[400px]">
                <div class="relative h-48 md:h-64">
                  <div
                    class="absolute top-3 left-3 z-10 bg-blue-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {{ shop.categories_shop }}
                  </div>
                  <img :src="shop.photo_url" :alt="shop.name_shop" class="w-full h-full object-cover">
                </div>

                <div class="p-5 space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-blue-800">{{ shop.name_shop }}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {{ shop.actif }}
                    </span>
                  </div>

                  <p class="text-gray-600 text-sm text-left">{{ shop.address_shop }}</p>
                  <p class="text-blue-800 text-sm font-medium text-left">{{ shop.formule_shop }}</p>

                  <div class="flex items-center space-x-2 text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{{ Math.round(shop.distance) }}m</span>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
        <div class="flex justify-center space-x-2 mt-4">
          <div v-for="(shop, index) in nearbyShops" :key="index" class="w-2 h-2 rounded-full bg-gray-300">
          </div>
        </div>
      </div>
    </div>

    <p v-else-if="checked" class="text-center text-blue-800 mt-4">
      Aucune boutique à proximité.
    </p>
    <p v-if="error" class="text-red-500 text-center mt-4">{{ error }}</p>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>