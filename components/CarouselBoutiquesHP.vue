<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const boutiques = ref([])
const loading = ref(true)
const error = ref(null)

const fetchBoutiques = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (fetchError) throw fetchError
    boutiques.value = data
  } catch (err) {
    console.error('Erreur lors de la récupération des boutiques:', err)
    error.value = 'Erreur lors de la récupération des boutiques : ' + err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchBoutiques)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4">
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <div v-else-if="boutiques.length === 0" class="text-center py-8">
      Aucune boutique disponible.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
      <div v-for="boutique in boutiques" :key="boutique.slug" class="w-full">
        <NuxtLink :to="`/shop/${boutique.slug}`" class="block hover:shadow-xl transition-shadow duration-300">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="relative">
              <div class="absolute top-3 left-3 bg-blue-800 text-white px-2 py-1 rounded text-sm font-semibold z-10">
                {{ boutique.categories_shop }}
              </div>
              <img :src="boutique.photo_url" :alt="boutique.name_shop" class="w-full h-64 object-cover" loading="lazy">
            </div>
            <div class="p-4 flex flex-col gap-2">
              <p class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded inline-block">
                {{ boutique.actif }}
              </p>
              <h3 class="text-xl font-bold text-blue-800 mb-2 line-clamp-1">
                {{ boutique.name_shop }}
              </h3>

              <p class="text-gray-600 text-sm mb-2 line-clamp-2">
                {{ boutique.address_shop }}
              </p>
              <p class="text-blue-800 text-sm font-medium line-clamp-2">
                {{ boutique.formule_shop }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>