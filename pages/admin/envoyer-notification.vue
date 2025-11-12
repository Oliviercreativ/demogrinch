<script setup>
definePageMeta({
  middleware: ['auth', 'admin'],
  showHeader: false,
  showSidebar: false
})

const { sendNotificationToAll, sendNotificationToShopCustomers, sendNotification } = useFCMNotifications()
const supabase = useSupabaseClient()

const title = ref('')
const message = ref('')
const linkUrl = ref('')
const imageUrl = ref('')
const targetType = ref('all') // 'all', 'shop', 'user'
const selectedShop = ref('')
const selectedUserId = ref('')
const sending = ref(false)
const result = ref(null)
const error = ref(null)
const shops = ref([])
const users = ref([])

const stats = ref({
  activeUsers: 0,
  activeTokens: 0
})

// Upload d'image
const uploading = ref(false)
const uploadedImage = ref(null)
const fileInput = ref(null)

// Charger les boutiques
const loadShops = async () => {
  const { data } = await supabase
    .from('boutique')
    .select('slug, name_shop')
    .eq('statut', true)
    .order('name_shop', { ascending: true })
  
  shops.value = data || []
}

// Charger les utilisateurs (pour le ciblage spécifique)
const loadUsers = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name', { ascending: true })
    .limit(100)
  
  users.value = data || []
}

// Charger les statistiques
const loadStats = async () => {
  const { data: tokens } = await supabase
    .from('user_fcm_tokens')
    .select('user_id')
    .eq('active', true)
  
  if (tokens) {
    stats.value.activeTokens = tokens.length
    stats.value.activeUsers = new Set(tokens.map(t => t.user_id)).size
  }
}

// Fonction de redimensionnement côté client
const resizeImage = (file, maxWidth = 512, maxHeight = 512, quality = 0.85) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculer les nouvelles dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convertir en blob
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Fonction d'upload d'image
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Vérifier la taille (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Fichier trop volumineux (max 5MB)'
    return
  }

  // Vérifier le type
  if (!file.type.startsWith('image/')) {
    error.value = 'Veuillez sélectionner une image'
    return
  }

  uploading.value = true
  error.value = null

  try {
    // Redimensionner l'image côté client
    const resizedBlob = await resizeImage(file, 512, 512, 0.85)
    
    // Créer un nouveau fichier avec l'image redimensionnée
    const resizedFile = new File([resizedBlob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
    
    const formData = new FormData()
    formData.append('file', resizedFile)

    const response = await $fetch('/api/upload/notification-image', {
      method: 'POST',
      body: formData
    })

    uploadedImage.value = {
      ...response,
      dimensions: '512x512px'
    }
    imageUrl.value = response.url // Remplir automatiquement l'URL
    
    console.log('✅ Image uploadée et redimensionnée:', response)
  } catch (e) {
    error.value = e.message || 'Erreur lors de l\'upload'
    console.error('❌ Erreur upload:', e)
  } finally {
    uploading.value = false
  }
}

// Fonction pour formater la taille de fichier
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(() => {
  loadShops()
  loadUsers()
  loadStats()
})

const sendNotificationHandler = async () => {
  if (!title.value || !message.value) {
    error.value = 'Le titre et le message sont requis'
    return
  }

  sending.value = true
  error.value = null
  result.value = null

  try {
    const options = {
      link_url: linkUrl.value || undefined,
      image_url: imageUrl.value || undefined
    }

    let response

    if (targetType.value === 'all') {
      console.log('📤 Envoi à tous les utilisateurs')
      response = await sendNotificationToAll(title.value, message.value, options)
    } else if (targetType.value === 'shop') {
      if (!selectedShop.value) {
        throw new Error('Veuillez sélectionner une boutique')
      }
      console.log('📤 Envoi aux clients de:', selectedShop.value)
      response = await sendNotificationToShopCustomers(selectedShop.value, title.value, message.value, options)
    } else if (targetType.value === 'user') {
      if (!selectedUserId.value) {
        throw new Error('Veuillez sélectionner un utilisateur')
      }
      console.log('📤 Envoi à l\'utilisateur:', selectedUserId.value)
      response = await sendNotification(selectedUserId.value, title.value, message.value, options)
    }

    result.value = response
    
    // Réinitialiser le formulaire
    title.value = ''
    message.value = ''
    linkUrl.value = ''
    imageUrl.value = ''

  } catch (e) {
    error.value = e.message
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="p-4 max-w-4xl mx-auto pb-24">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h1 class="text-2xl font-bold text-blue-800 dark:text-white mb-6">
        📤 Envoyer une notification push (FCM)
      </h1>

      <form @submit.prevent="sendNotificationHandler" class="space-y-6">
        <!-- Ciblage -->
        <div>
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            🎯 Ciblage
          </label>
          <select 
            v-model="targetType"
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
          >
            <option value="all">📢 Tous les utilisateurs</option>
            <option value="shop">🏪 Clients d'une boutique</option>
            <option value="user">👤 Utilisateur spécifique</option>
          </select>
        </div>

        <!-- Sélection boutique -->
        <div v-if="targetType === 'shop'">
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            Boutique
          </label>
          <select 
            v-model="selectedShop"
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
            required
          >
            <option value="">Sélectionnez une boutique</option>
            <option v-for="shop in shops" :key="shop.slug" :value="shop.slug">
              {{ shop.name_shop }}
            </option>
          </select>
        </div>

        <!-- Sélection utilisateur -->
        <div v-if="targetType === 'user'">
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            Utilisateur
          </label>
          <select 
            v-model="selectedUserId"
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
            required
          >
            <option value="">Sélectionnez un utilisateur</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.full_name }} ({{ user.email }})
            </option>
          </select>
        </div>

        <!-- Titre -->
        <div>
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            📝 Titre *
          </label>
          <input 
            v-model="title"
            type="text"
            placeholder="Ex: Nouvelle offre disponible !"
            required
            maxlength="65"
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
          >
          <p class="text-xs text-gray-500 mt-1">{{ title.length }}/65 caractères</p>
        </div>

        <!-- Message -->
        <div>
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            💬 Message *
          </label>
          <textarea 
            v-model="message"
            placeholder="Ex: Profitez de -20% sur tous nos produits ce weekend !"
            required
            maxlength="240"
            rows="4"
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">{{ message.length }}/240 caractères</p>
        </div>

        <!-- Lien (optionnel) -->
        <div>
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            🔗 Lien (optionnel)
          </label>
          <input 
            v-model="linkUrl"
            type="text"
            placeholder="Ex: /bons-plans ou https://example.com"
            class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
          >
          <p class="text-xs text-gray-500 mt-1">La page qui s'ouvrira au clic sur la notification</p>
        </div>

        <!-- Image (optionnel) -->
        <div>
          <label class="block text-sm font-semibold text-blue-800 dark:text-white mb-2">
            🖼️ Image (optionnel)
          </label>
          
          <!-- Upload d'image -->
          <div class="space-y-3">
            <div class="flex items-center space-x-3">
              <input 
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileUpload"
                class="hidden"
              >
              <button 
                type="button"
                @click="$refs.fileInput.click()"
                :disabled="uploading"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ uploading ? '📤 Upload...' : '📁 Choisir une image' }}
              </button>
              
              <span v-if="uploadedImage" class="text-green-600 text-sm">
                ✅ {{ uploadedImage.filename }}
              </span>
            </div>
            
            <!-- Aperçu de l'image -->
            <div v-if="uploadedImage" class="mt-3">
              <img 
                :src="uploadedImage.url" 
                alt="Aperçu"
                class="w-32 h-32 object-cover rounded-lg border border-gray-300"
              >
              <p class="text-xs text-gray-500 mt-1">
                {{ uploadedImage.dimensions }} • {{ formatFileSize(uploadedImage.size) }}
              </p>
            </div>
            
            <!-- Ou URL manuelle -->
            <div class="mt-3">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Ou saisissez une URL :</p>
              <input 
                v-model="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="w-full rounded-lg border border-blue-800 bg-zinc-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3"
              >
            </div>
          </div>
        </div>

        <!-- Bouton d'envoi -->
        <button 
          type="submit"
          :disabled="sending"
          class="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {{ sending ? '📤 Envoi en cours...' : '📤 Envoyer la notification' }}
        </button>
      </form>

      <!-- Message de succès -->
      <div v-if="result" class="mt-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
        <p class="text-green-800 dark:text-green-100 font-semibold mb-2">
          ✅ Notification envoyée avec succès !
        </p>
        <div class="text-sm text-green-700 dark:text-green-200 space-y-1">
          <p>📨 Envoyées : {{ result.sentCount }}</p>
          <p v-if="result.failureCount > 0">❌ Échecs : {{ result.failureCount }}</p>
          <p v-if="result.invalidTokensCleaned > 0">🧹 Tokens nettoyés : {{ result.invalidTokensCleaned }}</p>
        </div>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="mt-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
        <p class="text-red-800 dark:text-red-100 font-semibold">
          ❌ {{ error }}
        </p>
      </div>

      <!-- Guide d'utilisation -->
      <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h3 class="font-semibold text-blue-800 dark:text-blue-100 mb-2">💡 Guide</h3>
        <ul class="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li><strong>Tous les utilisateurs</strong> : Envoie à tous ceux qui ont activé les notifications</li>
          <li><strong>Boutique</strong> : Envoie uniquement aux clients qui ont scanné la boutique</li>
          <li><strong>Utilisateur</strong> : Envoie à un utilisateur spécifique</li>
          <li><strong>Image</strong> : URL absolue uniquement (https://...)</li>
          <li><strong>Lien</strong> : Peut être relatif (/page) ou absolu (https://...)</li>
        </ul>
      </div>

      <!-- Statistiques -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-300">Utilisateurs avec notifications</p>
          <p class="text-2xl font-bold text-blue-800 dark:text-white">{{ stats.activeUsers }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-300">Tokens actifs</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.activeTokens }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p class="text-sm text-gray-600 dark:text-gray-300">Appareils connectés</p>
          <p class="text-2xl font-bold text-purple-600">{{ stats.activeTokens }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

