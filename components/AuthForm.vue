<script setup>
import { ref, reactive } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const emit = defineEmits(['registration-started', 'user-authenticated', 'auth-error'])

const isLogin = ref(true) // Afficher le formulaire de connexion par défaut
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const authError = ref('')
const showPassword = ref(false)
const showRegisterPassword = ref(false)
const loadingMessage = ref('')

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  email: '',
  password: '',
  full_name: '',
  tel: '',
  adresse: '' // Code postal
})

const signInWithGoogle = async () => {
  try {
    isGoogleLoading.value = true
    authError.value = ''
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    })
    
    if (error) throw error
    
  } catch (error) {
    console.error('Erreur de connexion avec Google:', error.message)
    authError.value = 'Erreur lors de la connexion avec Google'
    emit('auth-error', authError.value)
  } finally {
    isGoogleLoading.value = false
  }
}

const handleLogin = async () => {
  try {
    isLoading.value = true
    authError.value = ''
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    })
    
    if (error) throw error
    
    emit('user-authenticated', data.user)
  } catch (error) {
    // Personnalisation des messages d'erreur de connexion
    if (error.message.includes('Invalid login credentials')) {
      authError.value = 'Email ou mot de passe incorrect'
    } else if (error.message.includes('Email not confirmed')) {
      authError.value = 'Veuillez confirmer votre email avant de vous connecter'
    } else if (error.message.includes('rate limit')) {
      authError.value = 'Trop de tentatives de connexion. Veuillez réessayer plus tard'
    } else {
      authError.value = 'Erreur lors de la connexion. Veuillez réessayer'
    }
    
    emit('auth-error', authError.value)
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  try {
    isLoading.value = true
    authError.value = ''
    
    // ✅ IMPORTANT : Émettre l'événement AVANT de créer le compte
    // pour bloquer le watcher dans la page parent
    emit('registration-started')
    console.log('🔒 Événement registration-started émis')
    
    loadingMessage.value = '📝 Création de votre compte...'
    console.log('📝 Étape 1/4 : Création du compte...')
    
    // ✅ ÉTAPE 1 : Créer le compte
    const { data, error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        data: {
          full_name: registerForm.full_name,
          tel: registerForm.tel,
          adresse: registerForm.adresse
        }
      }
    })
    
    if (error) throw error
    if (!data.user) throw new Error('Aucun utilisateur créé')
    
    console.log('✅ Compte créé :', data.user.id)
    
    loadingMessage.value = '👤 Création de votre profil...'
    console.log('📝 Étape 2/3 : Création du profil...')
    
    // ✅ ÉTAPE 2 : Créer le profil manuellement
    const slug = registerForm.full_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim() || data.user.id
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: registerForm.full_name,
        email: registerForm.email,
        tel: registerForm.tel,
        adresse: registerForm.adresse,
        avatar_url: 'https://media.madeinconflans.fr/wp-content/uploads/2020/04/logo.svg',
        Actif: '1',
        slug: slug,
        newsletter: false,
        notification: false,
        cover_photo_url: './bg-header-hp-madeinconflans.jpg',
        visit_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) throw profileError
    
    console.log('✅ Profil créé')
    
    // ✅ ÉTAPE 3 : Vérifier que le profil est accessible (retry jusqu'à 10 fois)
    loadingMessage.value = '🔄 Vérification du profil...'
    console.log('📝 Étape 3/3 : Vérification du profil...')
    
    let profileFound = false
    let attempts = 0
    const maxAttempts = 10
    
    while (!profileFound && attempts < maxAttempts) {
      attempts++
      console.log(`⏳ Tentative ${attempts}/${maxAttempts}...`)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: checkProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', data.user.id)
        .maybeSingle()
      
      if (checkProfile && !checkError) {
        profileFound = true
        console.log('✅ Profil trouvé et accessible :', checkProfile.full_name)
      }
    }
    
    if (!profileFound) {
      throw new Error('Le profil n\'a pas pu être vérifié. Veuillez réessayer.')
    }
    
    loadingMessage.value = '🚀 Redirection en cours...'
    console.log('✅ Authentification réussie ! Profil propagé.')
    
    // ✅ ÉTAPE 4 : Émettre l'événement d'authentification
    // La page boutique/[scan_uid].vue va ajouter le point et rediriger
    emit('user-authenticated', data.user)
    
  } catch (error) {
    // Personnalisation des messages d'erreur d'inscription
    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      authError.value = 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email'
    } else if (error.message.includes('password')) {
      authError.value = 'Le mot de passe doit contenir au moins 6 caractères'
    } else if (error.message.includes('valid email')) {
      authError.value = 'Veuillez entrer une adresse email valide'
    } else if (error.message.includes('duplicate key')) {
      authError.value = 'Un profil avec cet email existe déjà'
    } else {
      authError.value = error.message || 'Erreur lors de l\'inscription. Veuillez réessayer'
    }
    
    console.error('❌ Erreur d\'inscription:', error.message)
    emit('auth-error', authError.value)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}
</script>

<template>
  <div class="p-2 w-full max-w-md mx-auto">
    <!-- Onglets de navigation -->
    <div class="flex border-b border-gray-200 mb-6">
      <button
        @click="isLogin = true"
        :class="[
          'flex-1 py-3 px-4 text-center font-medium transition-all duration-200',
          isLogin
            ? 'text-blue-800 border-b-2 border-blue-800'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Se connecter
      </button>
      <button
        @click="isLogin = false"
        :class="[
          'flex-1 py-3 px-4 text-center font-medium transition-all duration-200',
          !isLogin
            ? 'text-blue-800 border-b-2 border-blue-800'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Créer un compte
      </button>
    </div>

    <p class="text-gray-600 mb-6 text-center text-sm">
      {{ isLogin ? 'Connectez-vous pour scanner et recevoir vos points' : 'Inscrivez-vous pour commencer à collecter des points' }}
    </p>
     
    <!-- Bouton Google uniquement pour la connexion -->
    <div v-if="isLogin" class="mb-6">
      <button 
        @click="signInWithGoogle" 
        :disabled="isGoogleLoading"
        class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm"
      >
        <span v-if="isGoogleLoading" class="flex items-center justify-center">
          <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
        <span v-else>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </span>
        <span>Se connecter avec Google</span>
      </button>
      
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">ou</span>
        </div>
      </div>
    </div>
    
    <!-- Formulaire de connexion -->
    <form v-if="isLogin" @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input 
          id="login-email" 
          v-model="loginForm.email" 
          type="email" 
          required 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
        />
      </div>
      
      <div>
        <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <div class="relative">
          <input 
            id="login-password" 
            v-model="loginForm.password" 
            :type="showPassword ? 'text' : 'password'" 
            required 
            class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
      </div>
      
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full bg-blue-800 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 font-medium"
      >
        <span v-if="isLoading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connexion en cours...
        </span>
        <span v-else>Se connecter</span>
      </button>
    </form>
    
    <!-- Formulaire d'inscription -->
    <form v-else @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label for="register-full_name" class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
        <input 
          id="register-full_name" 
          v-model="registerForm.full_name" 
          type="text" 
          required 
          placeholder="Prénom et nom"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
        />
      </div>
      
      <div>
        <label for="register-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input 
          id="register-email" 
          v-model="registerForm.email" 
          type="email" 
          required 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
        />
      </div>
      
      <div>
        <label for="register-phone" class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input 
          id="register-phone" 
          v-model="registerForm.tel" 
          type="tel" 
          required 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
        />
      </div>

      <div>
        <label for="register-adresse" class="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
        <input 
          id="register-adresse" 
          v-model="registerForm.adresse" 
          type="text" 
          required 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
          placeholder="Ex: 78700"
        />
      </div>
      
      <div>
        <label for="register-password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe (minimum 6 caractères)</label>
        <div class="relative">
          <input 
            id="register-password" 
            v-model="registerForm.password" 
            :type="showRegisterPassword ? 'text' : 'password'" 
            required 
            minlength="6"
            class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
          />
          <button
            type="button"
            @click="showRegisterPassword = !showRegisterPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg v-if="!showRegisterPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
      </div>
      
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full bg-blue-800 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 font-medium"
      >
        <span v-if="isLoading" class="flex items-center justify-center flex-col gap-1">
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loadingMessage || 'Inscription en cours...' }}</span>
          </div>
        </span>
        <span v-else>S'inscrire</span>
      </button>
    </form>
    
    <!-- Message d'erreur amélioré -->
    <div v-if="authError" class="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start animate-fadeIn">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span class="text-sm font-medium">{{ authError }}</span>
    </div>
  </div>
</template>
