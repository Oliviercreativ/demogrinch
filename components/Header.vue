<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'

const route = useRoute()
const supabase = useSupabaseClient()
const isActivePage = (path) => route.path === path

const boutiqueImages = ref([])
const ScannerImage = ref('')

const fetchBoutiqueImages = async () => {
  const { data, error } = await supabase
    .from('boutique')
    .select('photo_url')
    .not('photo_url', 'is', null)
    .eq('statut', true)
  
  if (error) {
    console.error('Erreur lors de la récupération des images:', error)
    return
  }
  
  boutiqueImages.value = data.map(boutique => boutique.photo_url)
}

const getRandomImages = (count = 1) => {
  const shuffled = boutiqueImages.value.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const backgroundStyle = computed(() => {
  if (isActivePage('/')) {
    const randomImages = getRandomImages(10)
    return {
      background: randomImages.map(url => `url(${url})`).join(', '),
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else if (isActivePage('/boutiques')) {
    return {
      background: `url(${boutiqueImages.value[0]}) center center no-repeat`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else if (isActivePage('/cartes-de-fidelite')) {
    return {
      background: `url(${boutiqueImages.value[0]}) center center no-repeat`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
  return {}
})

onMounted(fetchBoutiqueImages)
</script>
<template>
  <div v-if="isActivePage('/')" :style="backgroundStyle" class="h-[400px]"></div>
  <div v-else-if="isActivePage('/boutiques')" :style="backgroundStyle" class="h-[250px]"></div>
  <div v-else-if="isActivePage('/cartes-de-fidelite')" :style="backgroundStyle" class="h-[250px]"></div>
  <div v-else-if="isActivePage('/scanner')">
    <figure>
      <div 
        :style="{ 
          'background': `transparent url(${ScannerImage}) center center no-repeat`,
          'background-size': 'cover' 
        }"
        class="h-[300px]"
      ></div>
    </figure>
  </div>
  <div v-else-if="isActivePage('/profil')">

  </div>
  <div v-else :style="backgroundStyle" class="h-[400px]"></div>
</template>