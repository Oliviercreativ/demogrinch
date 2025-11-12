<script setup>
import { ref, watchEffect, computed } from 'vue'
import { useSupabaseUser, useSupabaseClient, navigateTo } from '#imports'

definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const email = ref('')
const password = ref('')
const error = ref(null)
const showPassword = ref(false)
const emailMagicLink = ref('')
const magicLinkSent = ref(false)

// État de soumission
const isSubmitting = ref(false)

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
  if (error) {
    console.error('Erreur de connexion avec google:', error.message)
  }
}

// Validation format email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const passwordFieldType = computed(() => {
  return showPassword.value ? 'text' : 'password'
})
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const login = async () => {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    error.value = null

    // Validation avant soumission
    if (!email.value.trim()) {
      throw new Error("Veuillez entrer votre email")
    }

    if (!isValidEmail(email.value)) {
      throw new Error("Format d'email invalide")
    }

    if (!password.value) {
      throw new Error("Veuillez entrer votre mot de passe")
    }

    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    })

    if (signInError) {
      // Messages d'erreur personnalisés selon le type d'erreur de Supabase Auth
      const errorMessage = signInError.message.toLowerCase()
      
      if (errorMessage.includes('invalid login credentials') || 
          errorMessage.includes('invalid email or password')) {
        throw new Error("❌ Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.")
      } else if (errorMessage.includes('email not confirmed')) {
        throw new Error("📧 Veuillez confirmer votre email avant de vous connecter. Vérifiez vos emails.")
      } else if (errorMessage.includes('user not found')) {
        throw new Error("❌ Aucun compte n'est associé à cet email. Créez un compte pour continuer.")
      } else if (errorMessage.includes('email rate limit exceeded')) {
        throw new Error("⏱️ Trop de tentatives. Veuillez patienter quelques minutes.")
      } else if (errorMessage.includes('user already registered')) {
        throw new Error("✅ Ce compte existe déjà. Connectez-vous avec vos identifiants.")
      } else {
        throw new Error(`⚠️ ${signInError.message}`)
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      error.value = "Votre compte n'est plus actif. Veuillez contacter l'administrateur."
    } else {
      navigateTo('/')
    }
  } catch (e) {
    error.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

watchEffect(() => {
  if (user.value) {
    navigateTo('/login')
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="p-4 pb-24 h-[100vh] flex flex-col items-stretch justify-justify gap-5 relative z-30">
      <p class="text-lg uppercase font-semibold text-blue-800 text-center">Connexion</p>
      <div class="flex justify-center items-center gap-5">
        <button @click="signInWithGoogle" class="flex items-center justify-start flex-wrap border border-gray-700 rounded-full p-4 gap-5">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-brand-google-filled stroke-green-800" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#597e8d" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z" stroke-width="0" fill="currentColor" />
          </svg>
        </button>
      </div>
      <p class="text-lg uppercase font-semibold text-blue-800 text-center">ou</p>
      <form @submit.prevent="login">
        <div class="flex flex-col items-center justify-center gap-5">          
          <!-- Email -->
          <input 
            v-model="email" 
            type="email" 
            placeholder="Email" 
            required 
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
          >

          <!-- Mot de passe -->
          <div class="relative w-full">
            <input 
              v-model="password" 
              :type="passwordFieldType" 
              placeholder="Mot de passe" 
              required 
              class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
            >
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

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full rounded-lg bg-blue-800 px-5 py-3 font-normal text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {{ isSubmitting ? 'Connexion...' : 'Se connecter' }}
          </button>
        </div>
      </form>

      <NuxtLink to="/mot-de-passe-perdu" class="text-center uppercase font-sm font-semibold text-blue-800">Mot de passe oublié ?</NuxtLink>
      
      <!-- Message d'erreur amélioré -->
      <div v-if="error" class="text-red-600 text-center p-4 bg-red-50 rounded-lg border border-red-200">
        <p class="font-semibold">{{ error }}</p>
      </div>
      <div class="flex justify-center items-center flex-col gap-5 py-5">
        <button class="mb-3 w-full rounded-lg border border-blue-800 text-blue-800 px-5 py-3 font-normal">
          <NuxtLink to="/signup" class="block w-full">Créér un compte</NuxtLink>
        </button>
      </div>
    </div>
  </div>
</template>
