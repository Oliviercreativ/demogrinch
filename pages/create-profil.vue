<script setup>
definePageMeta({
  showHeader: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const full_name = ref('')
const email = ref('')
const tel = ref('')
const adresse = ref('')
const error = ref(null)
const isSubmitting = ref(false)
const shops = ref([])
const shop_favorite = ref('')

// États de validation
const nameStatus = ref(null) // null | 'checking' | 'available' | 'taken'
const emailStatus = ref(null)
const telStatus = ref(null)
const isCheckingName = ref(false)
const isCheckingEmail = ref(false)
const isCheckingTel = ref(false)

const userId = computed(() => route.query.userId)

// Validation du code postal français
const isValidPostalCode = (code) => {
  return /^[0-9]{5}$/.test(code)
}

// Validation format email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Normaliser le numéro de téléphone
const normalizePhone = (phone) => {
  if (!phone) return ''
  
  // Supprimer tous les espaces, tirets, points, parenthèses
  let cleaned = phone.replace(/[\s.\-()]/g, '')
  
  // Remplacer +33 par 0
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.substring(3)
  }
  
  return cleaned
}

// Validation format téléphone français (uniquement mobiles 06 et 07)
const isValidPhone = (phone) => {
  if (!phone) return true // Optionnel, donc vide = valide
  
  const cleaned = normalizePhone(phone)
  
  // Doit commencer par 06 ou 07 et avoir 10 chiffres au total
  return /^0[67]\d{8}$/.test(cleaned)
}

// Charger les boutiques au montage
const fetchShops = async () => {
  const { data } = await supabase
    .from('boutique')
    .select('slug, name_shop')
    .eq('statut', true)
    .order('name_shop', { ascending: true })

  shops.value = data
}

onMounted(() => {
  fetchShops()
})

const generateSlug = (str) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim()
}

// Vérifier si le nom (slug) existe déjà
let nameCheckTimeout = null
const checkNameAvailability = async () => {
  if (!full_name.value.trim() || full_name.value.trim().length < 2) {
    nameStatus.value = null
    return
  }

  clearTimeout(nameCheckTimeout)
  nameCheckTimeout = setTimeout(async () => {
    isCheckingName.value = true
    nameStatus.value = 'checking'

    try {
      const slug = generateSlug(full_name.value)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('slug')
        .eq('slug', slug)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        nameStatus.value = 'taken'
      } else {
        nameStatus.value = 'available'
      }
    } catch (err) {
      console.error('Erreur vérification nom:', err)
      nameStatus.value = null
    } finally {
      isCheckingName.value = false
    }
  }, 500) // Debounce de 500ms
}

// Vérifier si l'email existe déjà
let emailCheckTimeout = null
const checkEmailAvailability = async () => {
  if (!email.value.trim() || !isValidEmail(email.value)) {
    emailStatus.value = null
    return
  }

  clearTimeout(emailCheckTimeout)
  emailCheckTimeout = setTimeout(async () => {
    isCheckingEmail.value = true
    emailStatus.value = 'checking'

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.value.trim().toLowerCase())
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        emailStatus.value = 'taken'
      } else {
        emailStatus.value = 'available'
      }
    } catch (err) {
      console.error('Erreur vérification email:', err)
      emailStatus.value = null
    } finally {
      isCheckingEmail.value = false
    }
  }, 500)
}

// Vérifier si le téléphone existe déjà
let telCheckTimeout = null
const checkTelAvailability = async () => {
  if (!tel.value.trim()) {
    telStatus.value = null
    return
  }

  if (!isValidPhone(tel.value)) {
    telStatus.value = null
    return
  }

  clearTimeout(telCheckTimeout)
  telCheckTimeout = setTimeout(async () => {
    isCheckingTel.value = true
    telStatus.value = 'checking'

    try {
      const cleanedPhone = normalizePhone(tel.value)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('tel')
        .eq('tel', cleanedPhone)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        telStatus.value = 'taken'
      } else {
        telStatus.value = 'available'
      }
    } catch (err) {
      console.error('Erreur vérification téléphone:', err)
      telStatus.value = null
    } finally {
      isCheckingTel.value = false
    }
  }, 500)
}

// Watchers pour vérification en temps réel
watch(full_name, checkNameAvailability)
watch(email, checkEmailAvailability)
watch(tel, checkTelAvailability)

// Classes CSS pour les bordures
const getInputClass = (status) => {
  const baseClass = 'mb-3 w-full rounded-lg border px-5 py-3 outline-blue-400 transition-colors duration-200'
  
  if (status === 'checking') {
    return `${baseClass} border-yellow-400 bg-yellow-50`
  } else if (status === 'available') {
    return `${baseClass} border-green-500 bg-green-50`
  } else if (status === 'taken') {
    return `${baseClass} border-red-500 bg-red-50`
  }
  
  return `${baseClass} border-blue-800 bg-zinc-100`
}

// Vérifier si le formulaire est valide
const isFormValid = computed(() => {
  return nameStatus.value === 'available' &&
         emailStatus.value === 'available' &&
         (telStatus.value === 'available' || !tel.value.trim()) &&
         full_name.value.trim() &&
         email.value.trim() &&
         isValidPostalCode(adresse.value) &&
         shop_favorite.value
})

const createProfile = async () => {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true
    error.value = null

    // Validation des champs
    if (!userId.value) {
      throw new Error("Erreur : ID utilisateur manquant")
    }

    if (!full_name.value.trim()) {
      throw new Error("Le nom complet est requis")
    }

    if (nameStatus.value === 'taken') {
      throw new Error("Ce nom est déjà utilisé. Veuillez en choisir un autre.")
    }

    if (nameStatus.value !== 'available') {
      throw new Error("Veuillez attendre la vérification du nom")
    }

    if (!email.value.trim()) {
      throw new Error("L'email est requis")
    }

    if (!isValidEmail(email.value)) {
      throw new Error("Veuillez entrer un email valide")
    }

    if (emailStatus.value === 'taken') {
      throw new Error("Cet email est déjà utilisé")
    }

    if (emailStatus.value !== 'available') {
      throw new Error("Veuillez attendre la vérification de l'email")
    }

    if (tel.value.trim() && !isValidPhone(tel.value)) {
      throw new Error("Veuillez entrer un numéro de téléphone valide")
    }

    if (tel.value.trim() && telStatus.value === 'taken') {
      throw new Error("Ce numéro de téléphone est déjà utilisé")
    }

    if (!isValidPostalCode(adresse.value)) {
      throw new Error("Veuillez entrer un code postal valide (5 chiffres)")
    }

    if (!shop_favorite.value) {
      throw new Error("Veuillez sélectionner une boutique")
    }

    const slug = generateSlug(full_name.value)
    const cleanedPhone = normalizePhone(tel.value)

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId.value,
        created_at: new Date().toISOString(),
        avatar_url: 'https://www.madeinconflans.fr/wp-content/uploads/2020/04/logo.svg',
        full_name: full_name.value.trim(),
        email: email.value.trim().toLowerCase(),
        tel: cleanedPhone,
        adresse: adresse.value.trim(),
        Actif: '1',
        slug: slug,
        newsletter: false,
        notification: false,
        cover_photo_url: './bg-header-hp-madeinconflans.jpg',
        shop_favorite: shop_favorite.value,
      })

    if (profileError) {
      // Gérer les erreurs spécifiques de Supabase
      if (profileError.code === '23505') {
        // Code PostgreSQL pour violation de contrainte unique
        if (profileError.message.includes('slug')) {
          throw new Error("Ce nom est déjà pris. Veuillez en choisir un autre.")
        } else if (profileError.message.includes('email')) {
          throw new Error("Cet email est déjà utilisé")
        } else if (profileError.message.includes('tel')) {
          throw new Error("Ce numéro de téléphone est déjà utilisé")
        }
      }
      throw profileError
    }

    await router.push('/')

    nextTick(() => {
      window.location.reload()
    })

  } catch (e) {
    error.value = e.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="p-4 pb-24 min-h-[100vh] flex flex-col items-stretch justify-center">
      <form @submit.prevent="createProfile" class="w-full">
        <div class="flex flex-col items-center justify-center gap-5 py-10">
          <h1 class="text-lg uppercase font-semibold text-blue-800 dark:text-white text-center">
            Créer votre profil
          </h1>

          <!-- Nom complet -->
          <div class="w-full">
            <label class="text-xs font-semibold text-blue-800 dark:text-white uppercase block mb-2">
              Prénom et nom *
            </label>
            <div class="relative">
              <input 
                v-model="full_name" 
                type="text" 
                placeholder="Prénom et nom" 
                required
                :class="getInputClass(nameStatus)"
              >
              <div v-if="isCheckingName" class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <p v-if="nameStatus === 'taken'" class="text-xs text-red-600 mt-1">
              ❌ Ce nom est déjà pris
            </p>
            <p v-else-if="nameStatus === 'available'" class="text-xs text-green-600 mt-1">
              ✅ Ce nom est disponible
            </p>
            <p v-else-if="nameStatus === 'checking'" class="text-xs text-yellow-600 mt-1">
              ⏳ Vérification en cours...
            </p>
          </div>

          <!-- Email -->
          <div class="w-full">
            <label class="text-xs font-semibold text-blue-800 dark:text-white uppercase block mb-2">
              Email *
            </label>
            <div class="relative">
              <input 
                v-model="email" 
                type="email" 
                placeholder="votre@email.com" 
                required
                :class="getInputClass(emailStatus)"
              >
              <div v-if="isCheckingEmail" class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <p v-if="emailStatus === 'taken'" class="text-xs text-red-600 mt-1">
              ❌ Cet email est déjà utilisé
            </p>
            <p v-else-if="emailStatus === 'available'" class="text-xs text-green-600 mt-1">
              ✅ Cet email est disponible
            </p>
            <p v-else-if="emailStatus === 'checking'" class="text-xs text-yellow-600 mt-1">
              ⏳ Vérification en cours...
            </p>
            <p v-else-if="email && !isValidEmail(email)" class="text-xs text-orange-600 mt-1">
              ⚠️ Format email invalide
            </p>
          </div>

          <!-- Téléphone -->
          <div class="w-full">
            <label class="text-xs font-semibold text-blue-800 dark:text-white uppercase block mb-2">
              Téléphone portable (optionnel)
            </label>
            <div class="relative">
              <input 
                v-model="tel" 
                type="tel" 
                placeholder="06 12 34 56 78"
                :class="getInputClass(telStatus)"
              >
              <div v-if="isCheckingTel" class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <p v-if="telStatus === 'taken'" class="text-xs text-red-600 mt-1">
              ❌ Ce numéro est déjà utilisé
            </p>
            <p v-else-if="telStatus === 'available'" class="text-xs text-green-600 mt-1">
              ✅ Ce numéro est disponible
            </p>
            <p v-else-if="telStatus === 'checking'" class="text-xs text-yellow-600 mt-1">
              ⏳ Vérification en cours...
            </p>
            <p v-else-if="tel && !isValidPhone(tel)" class="text-xs text-orange-600 mt-1">
              ⚠️ Numéro invalide (doit commencer par 06 ou 07)
            </p>
          </div>

          <!-- Code postal -->
          <div class="w-full">
            <label class="text-xs font-semibold text-blue-800 dark:text-white uppercase block mb-2">
              Code postal *
            </label>
            <input 
              v-model="adresse" 
              type="text" 
              placeholder="Code postal" 
              required 
              pattern="[0-9]{5}"
              maxlength="5"
              title="Veuillez entrer un code postal valide (5 chiffres)"
              class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
            >
            <p v-if="adresse && !isValidPostalCode(adresse)" class="text-xs text-orange-600 -mt-2 mb-3">
              ⚠️ Le code postal doit contenir 5 chiffres
            </p>
          </div>

          <!-- Sélection de la boutique -->
          <div class="w-full">
            <label class="text-xs font-semibold text-blue-800 dark:text-white uppercase block mb-2">
              Comment avez-vous connu GRINCH ? *
            </label>
            <select 
              v-model="shop_favorite" 
              required
              class="mb-3 w-full rounded-lg border border-blue-800 bg-zinc-100 outline-blue-400 px-5 py-3"
            >
              <option value="" disabled selected>Sélectionnez une boutique</option>
              <option v-for="shop in shops" :key="shop.slug" :value="shop.slug">
                {{ shop.name_shop }}
              </option>
            </select>
          </div>

          <!-- Bouton de soumission -->
          <button 
            type="submit" 
            :disabled="isSubmitting || !isFormValid"
            class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {{ isSubmitting ? 'Création en cours...' : 'Finaliser mon profil' }}
          </button>

          <p v-if="!isFormValid && (full_name || email)" class="text-xs text-gray-600 text-center -mt-3">
            Veuillez remplir tous les champs requis et vérifier leur disponibilité
          </p>
        </div>
      </form>

      <!-- Message d'erreur -->
      <div v-if="error" class="text-red-500 text-center p-4 bg-red-50 rounded-lg mt-4">
        {{ error }}
      </div>
    </div>
  </div>
</template>