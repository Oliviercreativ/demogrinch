<!-- components/UserPreferences.vue -->
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isLoading = ref(true)
const error = ref(null)
const updateSuccess = ref(false)

// Tags d'intérêts
const availableTags = [
  'Restaurant', 'Café', 'Mode', 'Beauté', 'Littérature', 'Sport',
  'Bien-être', 'Artisanat', 'Bio', 'Décoration', 'Arts', 'Concert',
  'Musique', 'Voyage', 'Famille & amis', 'Bénévolats', 'Jeux vidéos',
  'Cinéma', 'Photographie', 'Nouvelles technologie', 'Théâtre',
  'Sculture', 'Peinture', 'Poterie', 'Danse', 'Culture'
]
const selectedTags = ref('')

// Boutiques
const shops = ref([])
const selectedShops = ref('')

const fetchData = async () => {
  try {
    // Récupérer les préférences utilisateur
    const { data: preferences } = await supabase
      .from('newsletters')
      .select('tags, shop_favorites')
      .eq('user_id', user.value.id)
      .single()

    if (preferences) {
      selectedTags.value = preferences.tags || ''
      selectedShops.value = preferences.shop_favorites || ''
    }

    // Récupérer les boutiques
    const { data: shopsData } = await supabase
      .from('boutique')
      .select('slug, name_shop')
      .eq('statut', true)
      .order('name_shop', { ascending: true })

    shops.value = shopsData || []

  } catch (e) {
    console.error('Erreur:', e)
    error.value = "Erreur lors du chargement des données"
  } finally {
    isLoading.value = false
  }
}

const toggleTag = (tag, type) => {
  const targetRef = type === 'tag' ? selectedTags : selectedShops
  let current = targetRef.value ? targetRef.value.split(',').map(t => t.trim()) : []

  if (current.includes(tag)) {
    current = current.filter(t => t !== tag)
  } else {
    current.push(tag)
  }

  targetRef.value = current.join(', ')
}

const updatePreferences = async () => {
  try {
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        tags: selectedTags.value,
        shop_favorites: selectedShops.value
      })
      .eq('user_id', user.value.id)

    if (updateError) throw updateError

    updateSuccess.value = true
    setTimeout(() => {
      updateSuccess.value = false
    }, 3000)
  } catch (e) {
    error.value = "Erreur lors de la mise à jour"
  }
}

onMounted(async () => {
  await nextTick()
  await fetchData()
})

watch(user, async (newUser) => {
  if (newUser) {
    await fetchData()
  }
})
</script>

<template>
  <div v-if="!isLoading" class="space-y-8">
    <!-- Message de succès -->

    <div v-if="updateSuccess" class="bg-white fixed top-10 w-max-full z-30">
      <span class="text-sm  text-blue-800 text-center bg-white p-4 w-full border shadow-lg rounded-md">
        Vos préférences ont été mises à jour avec succès !
      </span>
    </div>

    <!-- Section Centres d'intérêt -->
    <div class="bg-white shadow rounded-lg border dark:bg-gray-800 pb-5">
      <div class="px-4 py-5 sm:px-6">
        <p class="text-sm font-medium text-blue-900 uppercase">
          Vos centres d'intérêt
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Sélectionnez vos centres d'intérêt pour personnaliser votre expérience
        </p>
      </div>

      <div class="border-t border-gray-200 px-4 py-5">
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in availableTags" :key="tag" :class="[
            'cursor-pointer px-3 py-1 rounded-full text-xs font-normal transition-colors',
            selectedTags?.split(',').map(t => t.trim()).includes(tag)
              ? 'bg-blue-800 text-white hover:bg-blue-800'
              : 'bg-zinc-100 text-blue-800 hover:bg-zinc-200'
          ]" @click="toggleTag(tag, 'tag')">
            {{ tag }}
          </span>
        </div>
      </div>
      <!-- Bouton de mise à jour -->
      <div class="flex w-full px-2">
        <button @click="updatePreferences"
          class="bg-blue-800 hover:bg-blue-800 text-xs font-normal  text-white px-4 py-2 rounded-full transition-colors">
          Mettre à jour mes préférences
        </button>
      </div>
    </div>


    <!-- Section Boutiques préférées -->
    <div class="bg-white shadow rounded-lg border dark:bg-gray-800 pb-5">
      <div class="px-4 py-5 sm:px-6">
        <p class="text-sm font-medium text-blue-900 uppercase">
          Vos boutiques préférées
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Choisissez les boutiques que vous fréquentez
        </p>
      </div>

      <div class="border-t border-gray-200 px-4 py-5">
        <div class="flex flex-wrap gap-2">
          <span v-for="shop in shops" :key="shop.slug" :class="[
            'cursor-pointer px-3 py-1 rounded-full text-xs font-normal transition-colors',
            selectedShops?.split(',').map(s => s.trim()).includes(shop.slug)
              ? 'bg-blue-800 text-white hover:bg-blue-800'
              : 'bg-zinc-100 text-blue-800 hover:bg-zinc-200'
          ]" @click="toggleTag(shop.slug, 'shop')">
            {{ shop.name_shop }}
          </span>
        </div>
      </div>
      <!-- Bouton de mise à jour -->
      <div class="flex w-full px-2">
        <button @click="updatePreferences"
          class="bg-blue-800 hover:bg-blue-800 text-xs font-normal  text-white px-4 py-2 rounded-full transition-colors">
          Mettre à jour mes préférences
        </button>
      </div>
    </div>


    <!-- Message d'erreur -->
    <div v-if="error" class="p-3 bg-red-50 text-red-500 rounded-md">
      {{ error }}
    </div>
  </div>

  <!-- Loader -->
  <div v-else class="flex justify-center items-center h-40">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
  </div>
</template>