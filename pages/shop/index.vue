<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'
import ProximityChecker from '@/components/ProximityChecker.vue'
import Favorite from '@/components/Favorite.vue'
import ScannerQrcode from '@/components/ScannerQrcode.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const boutiques = ref([])
const scannedBoutiques = ref([])
const isLoading = ref(true)
const isisLoading = ref(true)
const error = ref(null)
const search = ref('')
const isActive = ref('')

definePageMeta({
  showHeader: false,
})

const { checkProfile } = useProfileCheck()
onMounted(async () => {
  await checkProfile()
})

const fetchBoutiques = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', true)
      .order('name_shop', { ascending: true })

    if (fetchError) throw fetchError

    // Vérifier et nettoyer les données reçues
    if (data && Array.isArray(data)) {
      console.log('Données des boutiques reçues:', data.length, 'boutiques')

      // S'assurer que tous les champs nécessaires existent
      boutiques.value = data.map(boutique => ({
        ...boutique,
        name_shop: boutique.name_shop || '',
        address_shop: boutique.address_shop || '',
        tag_shop: boutique.tag_shop || '',
        categories_shop: boutique.categories_shop || ''
      }))
    } else {
      console.error('Les données reçues ne sont pas un tableau:', data)
      boutiques.value = []
    }

    isActive.value = data && data.length > 0 ? data[0].actif === 1 : false

    if (user.value) {
      await fetchScannedBoutiques()
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des boutiques:', err)
    error.value = 'Erreur lors de la récupération des boutiques. Veuillez réessayer plus tard.'
  } finally {
    isLoading.value = false
  }
}

const fetchScannedBoutiques = async () => {
  try {
    const { data, error: scanError } = await supabase
      .from('reward')
      .select('store_slug')
      .eq('is_read', false)
      .eq('user_uid_reward', user.value.id)

    if (scanError) throw scanError

    scannedBoutiques.value = new Set(data.map(item => item.store_slug))
  } catch (err) {
    console.error('Erreur lors de la récupération des boutiques scannées:', err)
  }
}

// Fonction de filtrage améliorée avec logs de débogage
const filteredBoutiques = computed(() => {
  // Si la recherche est vide, retourner toutes les boutiques
  if (!search.value.trim()) {
    return boutiques.value;
  }

  const searchTerm = search.value.toLowerCase().trim();
  console.log('Terme de recherche:', searchTerm);
  console.log('Nombre total de boutiques avant filtrage:', boutiques.value.length);

  // Vérifier si les champs existent pour la première boutique (débogage)
  if (boutiques.value.length > 0) {
    const firstBoutique = boutiques.value[0];
    console.log('Exemple de boutique:', {
      name: firstBoutique.name_shop,
      address: firstBoutique.address_shop,
      tags: firstBoutique.tag_shop,
      categories: firstBoutique.categories_shop
    });
  }

  // Filtrer les boutiques avec une gestion plus robuste des valeurs null/undefined
  const filtered = boutiques.value.filter(boutique => {
    // Vérifier que les champs existent avant de les utiliser
    const nameMatch = boutique.name_shop && boutique.name_shop.toLowerCase().includes(searchTerm);
    const addressMatch = boutique.address_shop && boutique.address_shop.toLowerCase().includes(searchTerm);
    const tagMatch = boutique.tag_shop && boutique.tag_shop.toLowerCase().includes(searchTerm);
    const categoryMatch = boutique.categories_shop && boutique.categories_shop.toLowerCase().includes(searchTerm);

    return nameMatch || addressMatch || tagMatch || categoryMatch;
  });

  console.log('Nombre de boutiques après filtrage:', filtered.length);
  return filtered;
})

const isScanned = (boutiqueSlug) => {
  return scannedBoutiques.value.has(boutiqueSlug)
}

// Fonction pour gérer la recherche
const handleSearch = () => {
  console.log('Recherche déclenchée avec le terme:', search.value)
  // La recherche est déjà réactive grâce au computed property,
  // mais cette fonction permet de déclencher des actions supplémentaires si nécessaire
}

onMounted(fetchBoutiques)

onMounted(async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      router.push('/')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
  } finally {
    isisLoading.value = false
  }
})
</script>

<template>
  <div class="">
    <div class="mt-1 pb-24"
      :class="{ 'bg-gray-900 text-white': $colorMode.value === 'dark', 'bg-white text-gray-900': $colorMode.value === 'light' }">
      <div class="p-4 mx-auto max-w-2xl">
        <div class="flex justify-center items-center flex-col gap-3 pt-4pb-4 w-full">
          <p class="text-lg uppercase text-blue-800 font-semibold my-3">Les boutiques</p>
          <p class="text-blue-800 text-center text-balance w-full">
            <ProximityChecker />
          </p>
        </div>
        <AdSidebar type="boutique" position="medium" />
        <div class="pt-6 pb-6">
          <div class="flex w-full rounded bg-white border border-gray-300">
            <input class="w-full border-none bg-white px-4 py-1 text-gray-700 outline-none focus:outline-none"
              v-model="search" type="search" name="search" placeholder="Rechercher une boutique..."
              @input="handleSearch" />
            <button type="button" @click="handleSearch" class="m-2 rounded bg-blue-800 px-4 py-2 text-white">
              <svg class="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56.966 56.966">
                <path
                  d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17s-17-7.626-17-17S14.61,6,23.984,6z" />
              </svg>
            </button>
          </div>
          <div v-if="search" class="mt-2 text-sm text-gray-600">
            Recherche en cours: "{{ search }}" ({{ filteredBoutiques.length }} résultats)
          </div>
        </div>


        <div v-if="isLoading" class="flex justify-center items-center h-64">
          <Loader />
        </div>

        <div v-else-if="error" class="text-red-500 text-center">
          <p>{{ error }}</p>
        </div>

        <ul v-else-if="filteredBoutiques.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 items-stretch">
          <li v-for="boutique in filteredBoutiques" :key="boutique.slug" class="bg-white rounded-lg shadow-lg">
            <NuxtLink :to="`/shop/${boutique.slug}`">
              <div class="flex flex-col justify-center items-center bg-white rounded-lg">
                <div class="w-full rounded-lg relative">
                  <div
                    class="absolute top-3 left-3 bg-blue-800 text-white inline-block text-center px-2 py-1 rounded text-md font-semibold">
                    {{ boutique.categories_shop }}
                  </div>
                  <div class="absolute top-2 right-2 z-20">
                    <Favorite :active="isScanned(boutique.slug)" />
                  </div>
                  <figure>
                    <img :src="boutique.photo_url" :alt="boutique.name_shop"
                      class="h-[300px] object-cover w-full rounded-lg">
                  </figure>
                  <div class="p-4 flex flex-col items-start justify-start gap-3">
                    <div class="flex items-center justify-between gap-2 w-full">
                      <p class="text-blue-800 font-bold bg-blue-100 rounded-lg p-2 text-xs">{{ boutique.actif }}</p>
                    </div>
                    <div class="flex items-center justify-start gap-2 w-full">
                      <p class="text-2xl font-bold text-blue-800">{{ boutique.name_shop }}</p>
                    </div>
                    <p class="text-gray-700 leading-tight">{{ boutique.address_shop }}</p>
                    <p class="text-blue-800 leading-tight">{{ boutique.formule_shop }}</p>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </li>
          <li class="bg-white">
            <AdSidebar type="boutique" position="medium" />
          </li>
        </ul>

        <p v-else class="text-center mt-4">
          Aucune boutique trouvée pour votre recherche.
        </p>
      </div>
    </div>
  </div>
</template>