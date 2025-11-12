<script setup>
const supabase = useSupabaseClient()
const ad = ref(null)

const props = defineProps({
   size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'medium', 'large'].includes(value)
  },
  rounded: {
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    required: true
  }
})

const fetchAd = async () => {
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('position', props.position)
    .eq('active', true)
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .single()

  ad.value = data
  if (data) trackView()
}

const trackView = async () => {
  try {
    if (ad.value) {
      const { error } = await supabase
        .from('banners')
        .update({ views: (ad.value.views || 0) + 1 })
        .eq('id', ad.value.id)
      
      if (error) throw error
    }
  } catch (e) {
    console.error('Erreur vue:', e)
  }
}

const trackClick = async () => {
  if (ad.value) {
    await supabase
      .from('banners')
      .update({ 
        clicks: (ad.value.clicks || 0) + 1 
      })
      .match({ id: ad.value.id })
  }
}

onMounted(() => {
  fetchAd()
})
</script>

<template>
  <div v-if="ad"
    class="bg-white shadow-sm"
    :class="[
      size === 'large' ? 'h-48' : 'h-[250px]',
      rounded ? 'rounded-lg' : ''
    ]"
  >
    <div class="relative rounded-lg">
      <a 
      :href="ad.link_url" 
      rel="noopener"
      class="flex mt-2 text-sm font-medium rounded-lg hover:underline w-full"
      @click="trackClick"
    >
      <img 
        :src="ad.image_url" 
        :alt="ad.title"
        class="w-full h-full object-cover object-center rounded-lg"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center rounded-lg">
        <div class="p-6 text-white flex flex-col justify-start items-start gap-2 relative">
          <p class="font-bold" :class="size === 'large' ? 'text-xl' : 'text-lg'">
            {{ ad.title }}
          </p>
          <p class="text-sm text-gray-200">
            {{ ad.description }}
          </p>
          <p class="text-sm text-gray-200">
            En savoir plus
          </p>
          <div class="absolute -top-7 left-6 z-20 flex items-center rounded-lg">
            <p class="text-white py-1 px-4 text-xs font-normal rounded-lg bg-[#33cccc]">
              Bon Plans
            </p>
          </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>