<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  limit: {
    type: Number,
    default: null
  }
})

const supabase = useSupabaseClient()
const banners = ref([])
const isLoading = ref(true)
const error = ref(null)
const activeIndex = ref(0)
const carouselRef = ref(null)

const fetchBanners = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    let query = supabase
      .from('banners')
      .select('*')
      .eq('position', 'bonplan')
      .eq('active', true)
      .eq('public', true)
      .order('created_at', { ascending: false })
    
    if (props.limit) {
      query = query.limit(props.limit)
    }
    
    const { data, error: fetchError } = await query
    
    if (fetchError) throw fetchError
    
    banners.value = data || []
    
    // Suivi des vues pour tous les banners
    if (banners.value.length > 0) {
      banners.value.forEach(async (banner) => {
        try {
          await supabase
            .from('banners')
            .update({ views: (banner.views || 0) + 1 })
            .eq('id', banner.id)
        } catch (e) {
          console.error('Erreur vue:', e)
        }
      })
    }
  } catch (e) {
    console.error('Erreur lors du chargement des banners:', e)
    error.value = 'Erreur lors du chargement des bons plans'
  } finally {
    isLoading.value = false
  }
}

const handleClick = async (banner) => {
  try {
    await supabase
      .from('banners')
      .update({ clicks: (banner.clicks || 0) + 1 })
      .eq('id', banner.id)
  } catch (e) {
    console.error('Erreur clic:', e)
  }
  
  if (banner.link_url) {
    if (banner.link_url.startsWith('/')) {
      navigateTo(banner.link_url)
    } else {
      window.open(banner.link_url, '_blank')
    }
  }
}

const updateActiveIndex = () => {
  if (!carouselRef.value || banners.value.length === 0) return
  
  const scrollLeft = carouselRef.value.scrollLeft
  const containerWidth = carouselRef.value.offsetWidth
  const padding = 16 // px-4 = 1rem = 16px
  const gap = 16 // space-x-4 = 1rem = 16px
  
  // Calculer la largeur d'un banner (85vw sur mobile, 350px sur desktop)
  const bannerWidth = window.innerWidth < 768 
    ? window.innerWidth * 0.85 
    : 350
  
  // Largeur totale d'un élément (banner + gap)
  const itemWidth = bannerWidth + gap
  
  // Calculer l'index en tenant compte du padding initial
  const index = Math.round((scrollLeft + padding) / itemWidth)
  activeIndex.value = Math.min(Math.max(0, index), banners.value.length - 1)
}

onMounted(() => {
  fetchBanners()
  
  // Attendre que le DOM soit prêt
  nextTick(() => {
    if (carouselRef.value) {
      carouselRef.value.addEventListener('scroll', updateActiveIndex)
      // Initialiser l'index actif
      updateActiveIndex()
    }
  })
})

onUnmounted(() => {
  if (carouselRef.value) {
    carouselRef.value.removeEventListener('scroll', updateActiveIndex)
  }
})
</script>

<template>
  <div class="w-full" v-if="!isLoading && banners.length > 0">
    <p class="text-lg uppercase text-blue-800 font-semibold py-4 text-left">
      Bons Plans
    </p>

    <div class="relative w-full">
      <div 
        ref="carouselRef"
        class="overflow-x-auto snap-x snap-mandatory flex space-x-4 pb-6 px-4 scrollbar-hide"
      >
        <div 
          v-for="banner in banners" 
          :key="banner.id" 
          class="snap-center flex-none w-[85vw] md:w-[350px] items-stretch"
          @click="handleClick(banner)"
        >
          <div
            class="overflow-hidden cursor-pointer bg-white rounded-lg">
            <!-- Image -->
            <div class="relative h-40 md:h-48">
              <img 
                :src="banner.image_url" 
                :alt="banner.title"
                class="w-full h-full object-cover rounded-lg"
              />
              <!-- Badge promo -->
              <div 
                v-if="banner.code_promo || banner.Promo || banner['Montant de la promo']"
                class="absolute top-3 left-3 z-10 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold"
              >
                {{ banner.code_promo || banner.Promo || `-${banner['Montant de la promo']}` }}
              </div>
            </div>

            <!-- Contenu réduit -->
            <div class="p-4 space-y-2">
              <h3 class="text-lg font-bold text-blue-800 line-clamp-1">{{ banner.title }}</h3>
              <p v-if="banner.description" class="text-gray-600 text-sm line-clamp-2">
                {{ banner.description }}
              </p>
              <div v-if="banner.company_name" class="text-xs text-gray-500 font-medium">
                {{ banner.company_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Indicateurs de pagination -->
      <div class="flex justify-center space-x-2 mt-4">
        <div 
          v-for="(banner, index) in banners" 
          :key="index" 
          :class="[
            'w-2 h-2 rounded-full transition-all duration-300',
            index === activeIndex ? 'bg-blue-800 w-6' : 'bg-gray-300'
          ]"
        ></div>
      </div>
    </div>
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

