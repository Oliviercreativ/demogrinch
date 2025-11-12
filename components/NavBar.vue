<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useRoute } from 'vue-router'
import BackButton from './BackButton.vue'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userProfile = ref(null)
const unreadNotificationsCount = ref(0)
const isActivePage = (path) => route.path === path
const isManager = ref(false)

const fetchUserProfile = async () => {
  if (user.value) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.value.id)
        .single()

      if (error) throw error
      userProfile.value = data
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error.message)
    }
  }
}

const fetchUnreadNotificationsCount = async () => {
  if (user.value) {
    try {
      const { count, error } = await supabase
        .from('reward')
        .select('id')
        .eq('user_uid_reward', user.value.id)
        .eq('is_read', false)

      if (error) throw error
      unreadNotificationsCount.value = count
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications non lues:", error.message)
    }
  }
}

onMounted(fetchUserProfile)
watch(user, (newUser) => {
  if (newUser) {
    fetchUserProfile()
  } else {
    userProfile.value = null
  }
})
const combinedUserData = computed(() => {
  return {
    ...user.value,
    profiles: userProfile.value
  }
})
onMounted(() => {
  fetchUserProfile()
  fetchUnreadNotificationsCount()
})

watch(user, (newUser) => {
  if (newUser) {
    fetchUserProfile()
    fetchUnreadNotificationsCount()
  } else {
    userProfile.value = null
    unreadNotificationsCount.value = 0
  }
})

const checkIfManager = async () => {
  if (user.value) {
    try {
      const { data, error } = await supabase
        .from('boutique')
        .select()
        .eq('manager_id', user.value.id)
        .single()

      if (!error && data) {
        isManager.value = true
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut manager:", error.message)
    }
  }
}

onMounted(async () => {
  await fetchUserProfile()
  await checkIfManager()
  if (!isManager.value) {
    await fetchUnreadNotificationsCount()
  }
})

watch(user, async (newUser) => {
  if (newUser) {
    await fetchUserProfile()
    await checkIfManager()
    if (!isManager.value) {
      await fetchUnreadNotificationsCount()
    }
  } else {
    userProfile.value = null
    unreadNotificationsCount.value = 0
    isManager.value = false
  }
})
</script>

<template>
  <div v-if="user">
    <div v-if="userProfile">
      <div class="relative z-10">
        <div class="absolute top-3 w-full">
          <div class="grid grid-cols-2 p-2 justify-items-stretch">
            <div class="justify-self-start">
              <NuxtLink to="/scanner" class="hidden">
                <div
                  v-if="isActivePage('/scanner') || isActivePage('/profil') || isActivePage('/tableau-de-bord') || isActivePage('/politiques-de-confidentialite') || isActivePage('/cgu') || isActivePage('/mentions-legales') || isActivePage('/qsn') || isActivePage('/edit-societe') || isActivePage('/edit-profil') || isActivePage('/admin/') || isActivePage('/admin/scans') || isActivePage('/admin/liste-clients') || isActivePage('/faq')"
                  class="bg-white rounded-lg">
                  <BackButton />
                </div>
                <div v-else class="bg-white rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-qr-code stroke-blue-800">
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" />
                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                    <path d="M3 12h.01" />
                    <path d="M12 3h.01" />
                    <path d="M12 16v.01" />
                    <path d="M16 12h1" />
                    <path d="M21 12v.01" />
                    <path d="M12 21v-1" />
                  </svg>
                </div>
              </NuxtLink>
            </div>
            <div class="justify-self-end bg-white rounded-lg">
              <div v-if="user">
                <NuxtLink v-if="isManager" to="/manager" class="rounded-lg relative">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    class="rounded-lg icon icon-tabler icon-tabler-building-store stroke-blue-800" width="44"
                    height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 21l18 0" />
                    <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
                    <path d="M5 21l0 -10.15" />
                    <path d="M19 21l0 -10.15" />
                    <path d="M9 21l0 -4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2l0 4" />
                  </svg>
                </NuxtLink>
                <NuxtLink v-else to="/notifications" class="rounded-lg relative">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    class="rounded-lg icon icon-tabler icon-tabler-bell stroke-blue-800" width="44" height="44"
                    viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
                    <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
                  </svg>
                  <span v-if="unreadNotificationsCount > 0"
                    class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {{ unreadNotificationsCount }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="relative z-10">
      <div class="absolute top-3 w-full">
        <div class="grid grid-cols-2 p-2 justify-items-stretch">
          <div class="justify-self-start">
            <NuxtLink to="/login" class="bg-white rounded-lg">
              <div v-if="isActivePage('/login')" class="bg-white rounded-lg">
                <BackButton />
              </div>
              <div v-else class="bg-white rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-power stroke-blue-800"
                  width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M7 6a7.75 7.75 0 1 0 10 0" />
                  <path d="M12 4l0 8" />
                </svg>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>