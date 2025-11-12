<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import imageCompression from 'browser-image-compression'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const fileInput = ref(null)
const urlInput = ref('')
const uploading = ref(false)
const uploadMode = ref('url') // 'url' ou 'file'

// Upload direct de fichier
const openFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  await uploadFile(file)
}

// Télécharger image depuis URL et uploader
const uploadFromUrl = async () => {
  if (!urlInput.value) {
    alert('Veuillez entrer une URL')
    return
  }

  uploading.value = true

  try {
    // Télécharger l'image depuis l'URL
    const response = await fetch(urlInput.value)
    if (!response.ok) throw new Error('Impossible de télécharger l\'image depuis cette URL')
    
    const blob = await response.blob()
    const file = new File([blob], 'cover.jpg', { type: blob.type })

    await uploadFile(file)
    urlInput.value = '' // Réinitialiser le champ URL
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    alert('Erreur: ' + error.message)
  } finally {
    uploading.value = false
  }
}

// Fonction commune d'upload
const uploadFile = async (file) => {
  uploading.value = true

  try {
    // Compression de l'image
    const options = {
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    }
    
    const compressedFile = await imageCompression(file, options)
    const fileName = `blog_cover_${user.value.id}_${Date.now()}.webp`
    
    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('image')
      .upload(`blog/${fileName}`, compressedFile, {
        contentType: 'image/webp',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('image')
      .getPublicUrl(`blog/${fileName}`)

    // Émettre la nouvelle URL
    emit('update:modelValue', publicUrl)
    
    alert('✅ Image uploadée avec succès !')
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    alert('Erreur lors de l\'upload: ' + error.message)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Onglets de sélection -->
    <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      <button
        @click="uploadMode = 'url'"
        :class="[
          'px-4 py-2 font-medium text-sm transition-colors',
          uploadMode === 'url' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        ]"
      >
        📎 URL
      </button>
      <button
        @click="uploadMode = 'file'"
        :class="[
          'px-4 py-2 font-medium text-sm transition-colors',
          uploadMode === 'file' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        ]"
      >
        📁 Upload fichier
      </button>
    </div>

    <!-- Mode URL -->
    <div v-if="uploadMode === 'url'" class="space-y-2">
      <div class="flex gap-2">
        <input
          v-model="urlInput"
          type="url"
          :disabled="uploading"
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          placeholder="https://exemple.com/image.jpg"
        />
        <button
          @click="uploadFromUrl"
          :disabled="uploading || !urlInput"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="uploading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Upload...
          </span>
          <span v-else>📥 Télécharger & Upload</span>
        </button>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        L'image sera téléchargée, compressée en WebP et uploadée automatiquement
      </p>
    </div>

    <!-- Mode Upload fichier -->
    <div v-if="uploadMode === 'file'" class="space-y-2">
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileSelect" 
        accept="image/*" 
        class="hidden"
      />
      <button
        @click="openFileInput"
        :disabled="uploading"
        class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="flex flex-col items-center gap-2">
          <svg v-if="!uploading" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div v-else class="flex items-center">
            <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ uploading ? 'Upload en cours...' : 'Cliquez pour sélectionner une image' }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            JPG, PNG, WebP (max 1920px, compression auto)
          </span>
        </div>
      </button>
    </div>

    <!-- Aperçu actuel -->
    <div v-if="modelValue" class="mt-4">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Image actuelle :</p>
      <img :src="modelValue" alt="Aperçu" class="w-full max-h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
    </div>
  </div>
</template>

