<!-- components/LastShops.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useSupabaseClient } from '#imports';

const supabase = useSupabaseClient();
const latestShops = ref([]);

const fetchLatestShops = async () => {
  const { data } = await supabase
    .from('boutique')
    .select('id, slug, name_shop, photo_url, categories_shop, lot')
    .eq('statut', false)
    .eq('demo', true)
    .order('created_at', { ascending: false })
    .limit(10);

  latestShops.value = data;
};

onMounted(() => {
  fetchLatestShops();
});
</script>

<template>
  <div class="rounded-lg">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg uppercase text-blue-800 font-semibold">Nouvelle boutiques</h2>
      <NuxtLink to="/boutiques" class="text-blue-800 text-sm font-medium hover:text-blue-600">
        Voir tout
      </NuxtLink>
    </div>
    <div class="space-y-3">
      <NuxtLink v-for="shop in latestShops" :key="shop.id" :to="`/shop/${shop.slug}`"
        class="block bg-white rounded-lg hover:shadow-md  duration-300">
        <div class="flex items-center space-x-4 p-3">
          <div class="w-20 h-20 flex-shrink-0">
            <img :src="shop.photo_url" :alt="shop.name_shop" loading="lazy"
              class="w-full h-full object-cover rounded-lg" />
          </div>
          <div class="flex-grow min-w-0">
            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
              {{ shop.categories_shop }}
            </span>
            <h3 class="font-medium text-blue-800 truncate">{{ shop.name_shop }}</h3>
            <p class="font-normal text-blue-800 text-sm truncate">{{ shop.lot }}</p>
          </div>
          <div class="text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </NuxtLink>
    </div>
    <!--
    <div class="mt-6">
      <NuxtLink to="/shops"
        class="block w-full bg-blue-800 text-white text-center px-6 py-3 rounded-lg font-medium transition-colors duration-300">
        Découvrir toutes les boutiques
      </NuxtLink>
    </div>
    -->
  </div>
</template>