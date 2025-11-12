<script setup>
import { ref } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import imageCompression from 'browser-image-compression'

const props = defineProps({
  currentCoverUrl: String,
  defaultCoverUrl: {
    type: String,
    default: './bg-header-hp-madeinconflans.jpg'
  }
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const fileInput = ref(null)
const previewUrl = ref('')
const showModal = ref(false)
const selectedFile = ref(null)
const emit = defineEmits(['cover-updated'])

const openFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  showModal.value = true
}

const resizeAndCompressImage = async (file) => {
  const options = {
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
  }
  
  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error("Erreur lors de la compression de l'image:", error)
    throw error
  }
}

const confirmUpload = async () => {
  try {
    const compressedFile = await resizeAndCompressImage(selectedFile.value)
    const fileName = `cover_${user.value.id}_${Date.now()}.webp`
    
    const { data, error: uploadError } = await supabase.storage
      .from('image')
      .upload(`covers/${fileName}`, compressedFile, {
        contentType: 'image/webp'
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('image')
      .getPublicUrl(`covers/${fileName}`)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cover_photo_url: publicUrl })
      .eq('id', user.value.id)

    if (updateError) throw updateError

    emit('cover-updated', publicUrl)
    showModal.value = false
  } catch (e) {
    console.error("Erreur lors de la mise à jour de la photo de couverture :", e.message)
  }
}

const cancelUpload = () => {
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  selectedFile.value = null
  showModal.value = false
}
</script>

<template>
  <div>
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileSelect" 
      accept="image/*" 
      class="hidden relative"
    />
    <button 
      @click="openFileInput" 
      class="p-2 bg-white rounded-full absolute -bottom-10 right-0 z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil-minus" width="20" height="20" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
        <path d="M13.5 6.5l4 4" />
        <path d="M16 19h6" />
      </svg>
    </button>

    <!-- Modal de confirmation -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-medium mb-4">Confirmer la nouvelle photo de couverture</h2>
        <img :src="previewUrl" alt="Nouvelle photo de couverture" class="w-full h-48 object-cover rounded-md mb-4" />
        <div class="flex justify-end">
          <button @click="cancelUpload" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">
            Annuler
          </button>
          <button @click="confirmUpload" class="px-4 py-2 bg-blue-500 text-white rounded-md">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>