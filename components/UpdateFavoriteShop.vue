<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isLoading = ref(true)
const showSelector = ref(true)
const shops = ref([])
const selectedShops = ref('')
const error = ref(null)
const isSubmitting = ref(false)
const updateSuccess = ref(false)

const checkExistingPreferences = async () => {
  if (!user.value) return

  try {
    const { data } = await supabase
      .from('newsletters')
      .select('shop_favorites')
      .eq('user_id', user.value.id)
      .single()

    if (data && data.shop_favorites) {
      selectedShops.value = data.shop_favorites
      if (data.shop_favorites.length > 0) {
        showSelector.value = false
      }
    }
  } catch (e) {
    console.error('Erreur lors de la vérification des préférences:', e)
  } finally {
    isLoading.value = false
  }
}

const fetchShops = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('boutique')
      .select('id, slug, name_shop, photo_url, categories_shop')
      .eq('statut', true)
      .order('name_shop', { ascending: true })

    if (fetchError) throw fetchError
    shops.value = data
  } catch (e) {
    error.value = "Erreur lors du chargement des boutiques"
  }
}

const toggleShop = (slug) => {
  let currentShops = selectedShops.value ? selectedShops.value.split(',').map(s => s.trim()) : []

  if (currentShops.includes(slug)) {
    currentShops = currentShops.filter(s => s !== slug)
  } else {
    currentShops.push(slug)
  }

  selectedShops.value = currentShops.join(', ')
}

const saveFavoriteShops = async () => {
  if (!user.value || !selectedShops.value) return

  isSubmitting.value = true
  try {
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        shop_favorites: selectedShops.value
      })
      .eq('user_id', user.value.id)

    if (updateError) throw updateError

    updateSuccess.value = true
    setTimeout(() => {
      updateSuccess.value = false
    }, 3000)

  } catch (e) {
    error.value = "Erreur lors de l'enregistrement de vos choix"
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await nextTick()
  await fetchShops()
  await checkExistingPreferences()
})

watch(user, async (newUser) => {
  if (newUser) {
    await checkExistingPreferences()
  }
})
</script>

<template>
  <div v-if="!isLoading" class="bg-white shadow rounded-lg border dark:bg-gray-800">
    <div class="px-4 py-5 sm:px-6">
      <p class="text-sm font-medium text-blue-900 uppercase">
        Vos boutiques préférées
      </p>
    </div>

    <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
      <div class="py-3 sm:py-5 sm:grid sm:grid-cols sm:gap-4 sm:px-6">
        <div class="text-xs font-semibold text-blue-800 uppercase dark:text-white">
          <div class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
            <div class="max-w-2xl mx-auto">
              <div>
                <div v-if="updateSuccess" class="mb-4 p-3 bg-white text-blue-700 rounded-md">
                  <span class="text-sm normal">
                    Vos boutiques préférées ont été mises à jour avec succès !
                  </span>
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                  <span v-for="shop in shops" :key="shop.slug" :class="[
                    'cursor-pointer px-3 py-1 rounded-full text-xs font-normal transition-colors',
                    selectedShops?.split(',').map(s => s.trim()).includes(shop.slug)
                      ? 'bg-blue-800 text-white hover:bg-blue-800'
                      : 'bg-zinc-100 text-blue-800 hover:bg-zinc-200'
                  ]" @click="toggleShop(shop.slug)">
                    {{ shop.name_shop }}
                  </span>
                </div>

                <div class="flex justify-between items-center mt-6">
                  <button @click="saveFavoriteShops" :disabled="isSubmitting"
                    class="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50">
                    {{ isSubmitting ? 'Mise à jour...' : 'Mettre à jour' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-red-500 text-center">
      {{ error }}
    </div>
  </div>

  <div v-else class="flex justify-center items-center h-40">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
  </div>
</template>