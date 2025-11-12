<script setup>
definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref(null)
const cguChecked = ref(false)
const privacyPolicyChecked = ref(false)
const emailMagicLink = ref('')

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
  if (error) {
    console.error('Erreur de connexion avec google:', error.message)
  }
}

const passwordFieldType = computed(() => {
  return showPassword.value ? 'text' : 'password'
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const signUp = async () => {
  try {
    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (signUpError) throw signUpError

    if (userData.user) {
      router.push({ path: '/create-profil', query: { userId: userData.user.id } })
    } else {
      error.value = "Une erreur s'est produite lors de l'inscription. Veuillez réessayer."
    }
  } catch (e) {
    error.value = "Un compte existe déjà, veuillez vous connecter à votre compte"
  }
}

watchEffect(() => {
  if (user.value) {
    router.push('/')
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="px-4 py-24 h-[100vh] flex flex-col items-stretch justify-center">
      <form @submit.prevent="signUp">
        <div class="flex flex-col items-center justify-center gap-5">
          <p class="text-lg uppercase font-semibold text-blue-800 text-center">Inscription</p>
          <div class="w-full mb-4">
            <div class="flex justify-center items-center gap-5">
              <button @click="signInWithGoogle" class="flex items-center justify-start flex-wrap border border-gray-700 rounded-full p-4 gap-5">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-brand-google-filled stroke-green-800" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#597e8d" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z" stroke-width="0" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          <p class="text-blue-800 uppercase font-semibold">OU</p>
          <div class="w-full">
            <p class="text-xs font-semibold text-blue-800 uppercase text-left pb-1">Votre email</p>
            <input v-model="email" type="email" placeholder="Email" required class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3">
          </div>
          <div class="w-full">
            <p class="text-xs font-semibold text-blue-800 uppercase text-left pb-1">Mot de passe</p>
            <div class="relative w-full">
              <input v-model="password" :type="passwordFieldType" placeholder="Mot de passe" required class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3">
              <button type="button" @click="togglePasswordVisibility" class="absolute right-3 top-6 transform -translate-y-1/2 focus:outline-none"> 
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-start gap-2 w-full">
            <input type="checkbox" v-model="cguChecked" id="cgu" required>
            <label for="cgu" class="text-left">
              J'accepte <NuxtLink to="/cgu" class="text-blue-800 font-medium">les Conditions générale d'utilisation</NuxtLink>  pour poursuivre mon inscription.
            </label>
          </div>
          <div class="flex items-center justify-start gap-2 w-full">
            <input type="checkbox" v-model="privacyPolicyChecked" id="privacy-policy" required>
            <label for="privacy-policy" class="text-left">
              J'accepte <NuxtLink to="/politiques-de-confidentialite" class="text-blue-800 font-medium">les Politiques de confidentialité</NuxtLink> pour m'inscrire sur GRINCH avec grinch.
            </label>
          </div>

          <button type="submit" class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-normal text-white">S'inscrire</button>
        </div>
      </form>
      <p v-if="error" class="text-red-500 text-center">{{ error }}</p>
    </div>
  </div>
</template>
