<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import NewMessageBanner from '@/components/NewMessageBanner.vue'
import Loader from '@/components/Loader.vue'
import ProximityChecker from '@/components/ProximityChecker.vue'
import LastShop from '@/components/LastShop.vue'
import BoutiqueAccueil from '@/components/BoutiqueAccueil.vue'
import NewsletterSignup from '@/components/NewsletterSignup.vue'
import WelcomeUser from '@/components/WelcomeUser.vue'
import ShareFaq from '@/components/ShareFaq.vue'
import MadeinConflans from '@/components/MadeinConflans.vue'
import AdSidebar from '@/components/AdSidebar.vue'

definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { checkProfile } = useProfileCheck()
const isLoading = ref(true)
const { $pwa } = useNuxtApp()
const router = useRouter()
const route = useRoute()

// ✅ UN SEUL onMounted clean
onMounted(async () => {
  try {
    // Attendre un peu que Supabase s'initialise
    await new Promise(resolve => setTimeout(resolve, 200))

    // Vérifier le profil si utilisateur connecté
    if (user.value) {
      await checkProfile()
    }

    // PWA ready check
    if ($pwa?.offlineReady) {
      console.log("App ready to work offline")
    }

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
  } finally {
    isLoading.value = false
  }
})
const halloweenLink = ref('https://halloween.grinch.fr')

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    halloweenLink.value = `https://halloween.grinch.fr/auth?token=${session.access_token}&refresh_token=${session.refresh_token}`
  }
})
</script>

<template>
  <div>
    <div class="pb-24" :class="{
      'bg-white text-gray-900': $colorMode.value === 'dark',
      'bg-white text-gray-900': $colorMode.value === 'light'
    }">
      <div class="p-4 mx-auto max-w-2xl">
        <!-- Loader -->
        <div v-if="isLoading">
          <Loader />
        </div>

        <!-- Contenu utilisateur connecté -->
        <div v-else-if="user" class="pt-2">
          <div class="flex justify-start items-stretch flex-col gap-5 w-full">
            <WelcomeUser />
            <NotificationButton />
            <OwnerDashboard />
            <NewMessageBanner />
            <BoxFavoriesLimit :limit="5" />
            <div class="w-full flex justify-center items-center flex-col gap-4">
              <AdSidebar type="boutique" position="medium" />
            </div>
            <LastShop />
            <ShareFaq />
            <MessagesBanner />
            <NewsletterSignup />
          </div>
        </div>

        <!-- Contenu utilisateur non connecté -->
        <div v-else class="pt-10">
          <div class="flex flex-col gap-10 pt-5 items-center justify-center">
            <BoutiqueAccueil />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>