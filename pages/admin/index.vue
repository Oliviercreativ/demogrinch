<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue'
import NotifyButton from '@/components/NotifyButton.vue';
import NotificationPrompt from '@/components/NotificationPrompt.vue'
import Papa from 'papaparse'


definePageMeta({
  showHeader: false,
  showNavbar: false,
  showAdminbar: false,
  middleware: ['auth', 'owner']
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const currentUser = useSupabaseUser()
const isOwner = ref(false)
const isLoading = ref(true)
const ownedBoutiques = ref([])

const protectedUserId = 'd04dad76-47de-468b-ba95-b5269b1d5385'
const isProtectedUser = computed(() => {
  return currentUser.value?.id === protectedUserId
})

async function fetchBoutiqueData(boutique) {
  const [rewardCountResult, rewardsResult] = await Promise.all([
    supabase
      .from('reward')
      .select('count', { count: 'exact' })
      .eq('store_slug', boutique.slug),
    supabase
      .from('reward')
      .select('user_uid_reward')
      .eq('store_slug', boutique.slug)
  ])

  if (rewardCountResult.error) {
    console.error('Erreur lors du comptage des récompenses:', rewardCountResult.error)
  }

  if (rewardsResult.error) {
    console.error('Erreur lors de la récupération des récompenses:', rewardsResult.error)
  } else {
    const uniqueUserIds = new Set(rewardsResult.data.map(reward => reward.user_uid_reward))
    boutique.uniqueUserCount = uniqueUserIds.size
  }

  boutique.rewardCount = rewardCountResult.count
}

const props = defineProps({
  boutiqueSlug: {
    type: String,
    required: false,
    default: ''
  }
})

const exportProfiles = async () => {
  if (!props) return;

  const { data: newsletter, error } = await supabase
    .from('newsletters')
    .select(`
      created_at,
      share_email,
      full_name_nl,
      email
    `);

  if (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return;
  }

  const csvData = newsletter.map(profile => ({
    created_at: newsletter.created_at,
    full_name_nl: newsletter.full_name_nl,
    share_email: newsletter.share_email,
    email: newsletter.email
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'profiles.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(async () => {
  if (user.value) {
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)

    if (boutiques && boutiques.length > 0) {
      isOwner.value = true
      ownedBoutiques.value = boutiques

      await Promise.all(ownedBoutiques.value.map(fetchBoutiqueData))
    }
  }
  isLoading.value = false
})
</script>

<template>
  <div>
    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
    </div>
    <div v-else>
      <div class="pt-8 pb-24">
        <p class="text-lg uppercase font-semibold text-blue-800 dark:text-white text-center pb-10">tableau de bord</p>
        <div class="flex flex-col justify-center items-start">
          <div v-if="isProtectedUser" class="w-full">
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/liste-scans" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-users-group stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
                      <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M17 10h2a2 2 0 0 1 2 2v1" />
                      <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Liste des Rewards</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/points-double" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                      class="icon icon-tabler icons-tabler-outline icon-tabler-award">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
                      <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
                      <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Points double</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/message" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-user-down stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="M10 14l11 -11" />
                      <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Envoyer un message</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </Nuxtlink>
            </div>

            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/messages-globaux" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-speakerphone stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M18 8a3 3 0 0 1 0 6" />
                      <path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" />
                      <path
                        d="M12 8h0l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Messages Globaux</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>

            <!-- Mes Bons Plans -->
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/mes-bons-plans" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tag stroke-blue-800"
                      width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                      <path
                        d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Mes Bons Plans</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>

            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/newsletter" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-user-down stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="M12 18h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v7.5" />
                      <path d="M3 6l9 6l9 -6" />
                      <path d="M15 18h6" />
                      <path d="M18 15l3 3l-3 3" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Newsletter</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </Nuxtlink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/liste-totale-clients" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-users-group stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
                      <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M17 10h2a2 2 0 0 1 2 2v1" />
                      <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Liste des clients</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>

            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/blog" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-article stroke-blue-800"
                      width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                      <path d="M7 8h10" />
                      <path d="M7 12h10" />
                      <path d="M7 16h10" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Articles de Blog</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>

            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/test-boutique" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-qrcode stroke-blue-800"
                      width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                      <path d="M7 17l0 .01" />
                      <path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                      <path d="M7 7l0 .01" />
                      <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                      <path d="M17 7l0 .01" />
                      <path d="M14 14l3 0" />
                      <path d="M20 14l0 .01" />
                      <path d="M14 14l0 3" />
                      <path d="M14 20l3 0" />
                      <path d="M17 17l3 0" />
                      <path d="M20 17l0 3" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Test QR Codes</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>

            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/connected" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-users-group stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="M7 6a7.75 7.75 0 1 0 10 0" />
                      <path d="M12 4l0 8" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Dernières connexions</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/ajouter-un-reward" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-users-group stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                      <path d="M9 12h6" />
                      <path d="M12 9v6" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Ajouter un reward</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/carte-de-fidelite" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-users-group stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                      <path d="M9 12h6" />
                      <path d="M12 9v6" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Carte de fidélité</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/logs" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                      class="icon icon-tabler icons-tabler-outline icon-tabler-lollipop stroke-blue-800">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M14 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                      <path d="M21 10a3.5 3.5 0 0 0 -7 0" />
                      <path d="M14 10a3.5 3.5 0 0 1 -7 0" />
                      <path d="M14 17a3.5 3.5 0 0 0 0 -7" />
                      <path d="M14 3a3.5 3.5 0 0 0 0 7" />
                      <path d="M3 21l6 -6" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Logs</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/test-sms" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="#1e40af" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                      class="icon icon-tabler icon-tabler-message stroke-blue-800">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M8 9h8" />
                      <path d="M8 13h6" />
                      <path
                        d="M21 12c0 4.418 -4.03 8 -9 8a9.77 9.77 0 0 1 -4 -.8l-4 1l1 -3.5c-1.25 -1.45 -2 -3.28 -2 -5.2c0 -4.418 4.03 -8 9 -8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">test-sms</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/envoyer-notification" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="#1e40af" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                      class="icon icon-tabler icon-tabler-bell stroke-blue-800">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M5 17h14" />
                      <path d="M17 17v-6a5 5 0 0 0 -10 0v6" />
                      <path d="M9 21h6" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Envoyer une notification</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <button @click="exportProfiles" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-user-down stroke-blue-800" width="24" height="24"
                      viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                      stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                      <path d="M6 21v-2a4 4 0 0 1 4 -4h4c.342 0 .674 .043 .99 .124" />
                      <path d="M19 16v6" />
                      <path d="M22 19l-3 3l-3 -3" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Exporter les clients</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-download stroke-blue-800"
                  width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                  <path d="M7 11l5 5l5 -5" />
                  <path d="M12 4l0 12" />
                </svg>
              </button>
            </div>
            <div class="border-b border-b border-b-gray-200 w-full">
              <NuxtLink to="/admin/annuaire-vers-boutique" class="p-2 flex items-center justify-between w-full">
                <div class="flex justify-start items-center gap-3">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                      class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-right stroke-blue-800">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-10" />
                      <path d="M3 7l9 6l9 -6l-9 -4z" />
                      <path d="M13 17v-8l4 2" />
                    </svg>
                  </div>
                  <p class="text-sm uppercase font-medium text-blue-800 text-center">Annuaire vers Boutique</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </NuxtLink>
            </div>
          </div>
          <div class="border-b border-t border-b-gray-200 w-full">
            <NuxtLink to="/admin/ma-boutique" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-building-store stroke-blue-800" width="26" height="26"
                    viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 21l18 0" />
                    <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
                    <path d="M5 21l0 -10.15" />
                    <path d="M19 21l0 -10.15" />
                    <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Ma boutique</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/validate-reward" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-qrcode stroke-blue-800"
                    width="26" height="26" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                    <path d="M7 17l0 .01" />
                    <path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                    <path d="M7 7l0 .01" />
                    <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                    <path d="M17 7l0 .01" />
                    <path d="M14 14l3 0" />
                    <path d="M20 14l0 .01" />
                    <path d="M14 14l0 3" />
                    <path d="M14 20l3 0" />
                    <path d="M17 17l3 0" />
                    <path d="M20 17l0 3" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Scans</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/liste-clients" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-users stroke-blue-800"
                    width="26" height="26" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Mes clients</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/horaires" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-qrcode stroke-blue-800"
                    width="26" height="26" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 12l-3 -2" />
                    <path d="M12 7v5" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Horaires</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/recompenses" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
                    <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
                    <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Récompenses</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/mes-bons-plans" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tag stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path
                      d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Bons Plans</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/messages-clients" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    class="icon icon-tabler icon-tabler-message-circle stroke-blue-800" width="24" height="24"
                    viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path
                      d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Messages Clients</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full hidden">
            <NuxtLink to="/admin/jeux-concours" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
                    <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
                    <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Résultat Concours</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/envoyer-un-message" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-down stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 14l11 -11" />
                    <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Envoyer un message</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </Nuxtlink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/invitation" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M19 22.5a4.75 4.75 0 0 1 3.5 -3.5a4.75 4.75 0 0 1 -3.5 -3.5a4.75 4.75 0 0 1 -3.5 3.5a4.75 4.75 0 0 1 3.5 3.5" />
                    <path d="M11.5 19h-6.5a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5" />
                    <path d="M3 7l9 6l9 -6" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Invitation en test</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </NuxtLink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="/admin/creativcard" class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-down stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 19h-6a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" />
                    <path d="M3 10h18" />
                    <path d="M16 19h6" />
                    <path d="M19 16l3 3l-3 3" />
                    <path d="M7.005 15h.005" />
                    <path d="M11 15h2" />
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Commander une CREATIVCARD</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />
              </svg>
            </Nuxtlink>
          </div>
          <div class="border-b border-b border-b-gray-200 w-full">
            <NuxtLink to="https://billing.stripe.com/p/login/3cs6q09Ju6ja3BKbII" target="_blank"
              class="p-2 flex items-center justify-between w-full">
              <div class="flex justify-start items-center gap-3">
                <div class="bg-gray-50 rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-down stroke-blue-800"
                    width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M11.453 8.056c0 -.623 .518 -.979 1.442 -.979c1.69 0 3.41 .343 4.605 .923l.5 -4c-.948 -.449 -2.82 -1 -5.5 -1c-1.895 0 -3.373 .087 -4.5 1c-1.172 .956 -2 2.33 -2 4c0 3.03 1.958 4.906 5 6c1.961 .69 3 .743 3 1.5c0 .735 -.851 1.5 -2 1.5c-1.423 0 -3.963 -.609 -5.5 -1.5l-.5 4c1.321 .734 3.474 1.5 6 1.5c2 0 3.957 -.468 5.084 -1.36c1.263 -.979 1.916 -2.268 1.916 -4.14c0 -3.096 -1.915 -4.547 -5 -5.637c-1.646 -.605 -2.544 -1.07 -2.544 -1.807z">
                    </path>
                  </svg>
                </div>
                <p class="text-sm uppercase font-medium text-blue-800 text-center">Gérer mon abonnement</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right stroke-blue-800"
                width="24" height="24" viewBox="0 0 24 24" stroke-width="1" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 6l6 6l-6 6" />*
              </svg>
            </Nuxtlink>
          </div>
          <div class="flex flex-col gap-6 w-full p-4">
            <NotificationToggle />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>