<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'
import LogOut from '@/components/LogOut.vue'
import QRCode from '@/components/QRCode.vue'
import themeSwitch from '@/components/themeSwitch.vue'
import StatReward from '@/components/StatReward.vue'
import ShareFaq from '@/components/ShareFaq.vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const profile = ref(null)
const isLoading = ref(true)
const currentAvatarUrl = ref('')
const avatarUrl = ref('')
const coverPhotoUrl = ref('')
const defaultCoverUrl = './profil.webp'
const isOwner = ref(false)
const showConfirmation = ref(false)
const protectedIds = ['d04dad76-47de-468b-ba95-b5269b1d5385']

definePageMeta({
  showHeader: false,
})


const { checkProfile } = useProfileCheck()
onMounted(async () => {
  await checkProfile()
})

const fetchAvatar = async () => {
  if (!user.value) return

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.value.id)
      .single()

    if (error) throw error

    avatarUrl.value = data.avatar_url
  } catch (e) {
    console.error("Erreur lors de la récupération de l'avatar :", e.message)
  }
}

const updateAvatar = (newUrl) => {
  avatarUrl.value = newUrl
}
onMounted(fetchAvatar)

const formatInscriptionDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const options = { 
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  return new Intl.DateTimeFormat('fr-FR', options).format(date)
}

const router = useRouter()

const fetchProfile = async () => {
  if (user.value) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (error || !data) {
      console.error('Erreur lors de la récupération du profil ou profil non trouvé:', error)
      await handleInactiveAccount()
    } else {
      profile.value = data
      currentAvatarUrl.value = data.avatar_url
    }
  } else {
    profile.value = null
  }
  isLoading.value = false
}
const handleInactiveAccount = async () => {
  try {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    router.push('/') // Redirige vers la page d'accueil ou une page de connexion
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

onMounted(fetchProfile)

watch(user, (newUser) => {
  if (newUser) {
    fetchProfile()
  } else {
    profile.value = null
    isLoading.value = false
  }
})
watch(user, (newUser) => {
  if (newUser) {
    fetchProfile()
  } else {
    profile.value = null
    isLoading.value = false
  }
})

const deleteAccount = async () => {
  if (!user.value) return
  if (protectedIds.includes(user.value.id)) {
    alert("Ce compte ne peut pas être supprimé.")
    showConfirmation.value = false
    return
  }

  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.value.id)

    if (profileError) throw profileError
    await supabase.auth.signOut()
    await router.push('/login')

  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    alert(`Une erreur est survenue lors de la suppression du compte : ${error.message}`)
  } finally {
    showConfirmation.value = false
  }
}

onMounted(async () => {
  if (user.value) {
    const { data, error } = await supabase
      .from('boutique')
      .select('id')
      .eq('owner', user.value.id)
      .limit(1)

    if (data && data.length > 0) {
      isOwner.value = true
    }
  }
})
</script>
<template>
  <div>
    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-else-if="user && profile" class="pb-24 ">
      <div class="flex flex-col justify-center items-center">
        <div class="bg-white max-auto w-full rounded-lg relative">
        </div>
      </div>
      <div class="p-4 mx-auto max-w-2xl">
        <div class="pb-6">
          <div class="flex flex-col items-center justify-center gap-5">
            <figure class="inline bg-white p-2 rounded-lg relative">
              <img :src="avatarUrl" alt="Avatar de l'utilisateur" class="w-24 h-24 object-contain rounded-full" />
              <!--<AddPhoto :currentAvatarUrl="avatarUrl" @avatar-updated="updateAvatar" />-->
              <div class="absolute -bottom-3 left-10 bg-white rounded-full p-2 text-gray-500">
                <NuxtLink to="/edit-profil">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil-minus" width="20"
                    height="20" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                    <path d="M13.5 6.5l4 4" />
                    <path d="M16 19h6" />
                    <path d="M19 16l3 3l-3 3" />
                    <path d="M7.005 15h.005" />
                    <path d="M11 15h2" />
                  </svg>
                </NuxtLink>
              </div>
            </figure>
            <div class="flex flex-col justify-center items-center w-full">
              <p class="text-lg font-semibold text-blue-800 uppercase dark:text-white hover:underline">{{
                profile.full_name }}</p>
              <p class="text-xs font-normal text-zinc-500  dark:text-white hover:underline">{{ profile.adresse }}</p>
              <p class="text-xs font-normal text-zinc-500  dark:text-white hover:underline">{{ user.email }}</p>
              <p class="text-xs font-normal text-zinc-500  dark:text-white hover:underline">Inscription le {{
                formatInscriptionDate(user.created_at) }}</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-start items-stretch gap-3 w-full pb-5">
          <ShareFaq />
        </div>

        <div class="w-full rounded-lg">
          <NewMessageBanner />
        </div>

        <div class="pb-6">
          <AdSidebar type="boutique" position="medium" />
        </div>

        <div class="flex flex-col justify-start items-stretch gap-5 w-full">

        <tagInput />

        <div class="bg-white overflow-hidden shadow rounded-lg border-t-1 border-gray-200 dark:bg-gray-800">
          <div class="px-4 py-5 sm:px-6">
            <p class="text-sm font-medium text-blue-900 uppercase">Votre QR Code personnel</p>
            <p class="text-xs font-medium text-zinc-500">Certains boutiques peuvent vous demander votre QRcode pourvalider votre récompense</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
            <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white"></dt>
              <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
                <QRCode v-if="profile.id" :value="`profile/${profile.id}`" :size="200" />
              </dd>
            </div>
          </div>
        </div>
 
        <div class="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800">
          <div class="px-4 py-5 sm:px-6">
            <p class="text-sm font-medium text-blue-900 uppercase">Paramètres de l'application</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl class="sm:divide-y sm:divide-gray-200">
              <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">Activer le dark-mode</dt>
                <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
                  <themeSwitch />
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800">
          <div class="px-4 py-5 sm:px-6">
            <p class="text-sm font-medium text-blue-900 uppercase">Notifications</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
            <NotificationToggle />
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg border dark:bg-gray-800">
          <div class="px-4 py-5 sm:px-6">
            <p class="text-sm font-medium text-blue-900 uppercase">Mon compte</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl class="sm:divide-y sm:divide-gray-200">
              <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt>
                  <LogOut />
                </dt>
                <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2"></dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-gray-200">
              <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-xs font-semibold text-blue-800 uppercase dark:text-white">
                  <NuxtLink to="/change-password" class="text-center uppercase font-sm font-semibold">
                    Modifier le mot de passe
                  </NuxtLink>
                </dt>
                <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2"></dd>
              </div>
            </dl>
            <dl class="sm:divide-y sm:divide-gray-200">
              <div class="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt>
                  <button @click="showConfirmation = true" class="text-xs font-semibold text-red-800 uppercase">
                    Supprimer mon compte
                  </button>
                </dt>
                <dd class="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2"></dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="flex flex-col items-start justify-start px-2 gap-4">
          <!--<NuxtLink to="/qsn" class="text-xs font-semibold light:text-blue-800 uppercase dark:text-white">Qui sommes-nous</NuxtLink>-->
          <NuxtLink to="/mentions-legales"
            class="text-xs font-semibold light:text-blue-800 uppercase dark:text-white">Mentions légales</NuxtLink>
          <NuxtLink to="/politiques-de-confidentialite"
            class="text-xs font-semibold light:text-blue-800 uppercase dark:text-white">Politique de
            Confidentialités
          </NuxtLink>
          <NuxtLink to="/cgu" class="text-xs font-semibold light:text-blue-800 uppercase dark:text-white">CGU
          </NuxtLink>
        </div>
      </div>
    </div>
    <div v-if="showConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-medium mb-4">Confirmer la suppression du compte</h2>
        <p class="mb-4">Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.</p>
        <div class="flex justify-end">
          <button @click="showConfirmation = false"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">
            Annuler
          </button>
          <button @click="deleteAccount" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Confirmer la suppression
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="!isLoading && user && !profile" class="p-4">
    <p class="text-red-600 font-bold">Votre compte n'est plus actif. Vous allez être déconnecté.</p>
  </div>
  <div v-else>

  </div>
</div>
</template>