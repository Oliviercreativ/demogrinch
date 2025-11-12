<script setup>
import { ref, computed, provide, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useState } from '#app'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import ServiceWorkerUpdateNotification from '@/components/ServiceWorkerUpdateNotification.vue'

const isMobile = ref(false)
const showEmergencyButton = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth <= 1280
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 1280
  })
  setTimeout(() => {
    showEmergencyButton.value = true
  }, 15000)
})

const HeaderTdb = defineAsyncComponent(() => import('@/components/HeaderTdb.vue'))
const NavBar = defineAsyncComponent(() => import('@/components/NavBar.vue'))
const Header = defineAsyncComponent(() => import('@/components/Header.vue'))

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser() // ✅ Utiliser le composable du module @nuxtjs/supabase
const isLoading = ref(true)
provide('isLoading', isLoading)

const showHeader = computed(() => {
  return route.meta.showHeader !== false
})
const showNavbar = computed(() => {
  return route.meta.showNavbar !== false
})
const showAdminbar = computed(() => {
  return route.meta.showAdminbar !== false
})
const showFooter = computed(() => {
  return route.meta.showFooter !== false
})

const updateLastSeen = async () => {
  if (user.value) {
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.value.id)
  }
}

const emergencyReset = () => {
  try {
    // Nettoyer tout le storage
    localStorage.clear()
    sessionStorage.clear()

    // Redirection forcée vers la page de connexion
    window.location.href = '/login'
  } catch (error) {
    // En cas d'erreur, forcer le reload de la page
    window.location.reload()
  }
}

onMounted(async () => {
  // ✅ useSupabaseUser() est automatiquement synchronisé par @nuxtjs/supabase
  // Pas besoin de fetchUserData() manuellement
  updateLastSeen()
  const interval = setInterval(updateLastSeen, 60000)
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="light-mode">
    <NuxtLoadingIndicator />
    <VitePwaManifest />
    <ClientOnly>
      <div v-if="!isMobile" class="fixed inset-0 z-50 bg-black/80 w-screen h-screen">
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-full h-full flex items-center justify-center">
          <div class="text-center flex flex-col justify-center items-center">
            <h2 class="text-xl font-bold mb-4 text-blue-800">Site uniquement disponible sur mobile</h2>
            <p>Veuillez consulter ce site depuis votre téléphone portable.</p>
          </div>
        </div>
      </div>
    </ClientOnly>

    <ServiceWorkerUpdateNotification />
    <HeaderTdb v-if="showAdminbar" />
    <NavBar v-if="showNavbar" />
    <Header v-if="showHeader" />
    <NuxtPage />
    <Footer v-if="showFooter" />
  </div>
</template>

<style>
/* Forcer le mode light sur toute l'application */
html,
body,
#__nuxt {
  color-scheme: light !important;
  background-color:#f7f5f2 !important;
}

.light-mode {
  color-scheme: light !important;
}

.bg-white {
  background-color: #ffffff !important;
}

/* Empêcher les styles dark mode de s'appliquer */
.dark,
.dark-mode,
[data-theme="dark"] {
  color-scheme: light !important;
  background-color: #ffffff !important;
  color: #000000 !important;
}
</style>