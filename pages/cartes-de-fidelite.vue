<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'
import BoxFavories from '@/components/BoxFavories.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const profile = ref(null)
const isLoading = ref(true)
const error = ref(null)

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const { checkProfile } = useProfileCheck()
onMounted(async () => {
  await checkProfile()
})

onMounted(async () => {
  if (user.value) {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (fetchError) throw fetchError

      profile.value = data
    } catch (err) {
      console.error('Erreur lors de la récupération du profil:', err)
      error.value = "Impossible de charger le profil. Veuillez réessayer plus tard."
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
    error.value = "Veuillez vous connecter pour voir vos favoris."
  }
})

onMounted(async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      router.push('/')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="">
    <div class="pb-24" :class="{ 'bg-gray-900 text-white': $colorMode.value === 'dark', 'bg-white text-gray-900': $colorMode.value === 'light' }">
      <div class="pt-0 p-4">
        <div v-if="isLoading">
          <Loader />
        </div>
        <div v-else-if="error">
          <p>{{ error }}</p>
        </div>
        <div v-else class="mx-auto max-w-2xl">
          <div class="relative z-30">
            <StatReward />
          </div>
          <div class="pt-6">
            <AdSidebar position="creativcard" size="large" />
          </div>
          <div class="flex justify-center items-center flex-col gap-3 pt-4 pb-4 w-full">
          <p class="text-lg uppercase text-blue-800 font-semibold my-3">Vos cartes de fidélité</p>
        </div>
          <BoxFavories :profile="profile" />
        </div>
      </div>
    </div>
  </div>
</template>
