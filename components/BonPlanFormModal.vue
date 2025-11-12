<script setup>
import { ref, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import imageCompression from 'browser-image-compression'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  bonPlan: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const supabase = useSupabaseClient()
const isUploading = ref(false)

const form = ref({
  id: null,
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  start_date: '',
  end_date: '',
  code_promo: '',
  active: true,
  featured: false,
  type: 'bonplan'
})

// Watcher pour remplir le formulaire quand on édite
watch(() => props.bonPlan, (newBonPlan) => {
  if (newBonPlan) {
    form.value = {
      id: newBonPlan.id,
      title: newBonPlan.title,
      description: newBonPlan.description,
      image_url: newBonPlan.image_url,
      link_url: newBonPlan.link_url,
      start_date: newBonPlan.start_date,
      end_date: newBonPlan.end_date,
      code_promo: newBonPlan.code_promo || '',
      active: newBonPlan.active,
      featured: newBonPlan.featured,
      type: newBonPlan.position || 'bonplan'
    }
  }
}, { immediate: true })

// Upload d'image
const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  isUploading.value = true
  
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/webp'
    }
    
    const compressedFile = await imageCompression(file, options)
    const fileName = `bonplan-${Date.now()}.webp`
    
    const { data, error } = await supabase.storage
      .from('image')
      .upload(`bonplan/${fileName}`, compressedFile, {
        contentType: 'image/webp',
        upsert: false
      })
    
    if (error) throw error
    
    const { data: urlData } = supabase.storage
      .from('image')
      .getPublicUrl(`bonplan/${fileName}`)
    
    form.value.image_url = urlData.publicUrl
  } catch (error) {
    console.error('Erreur upload:', error)
    alert('Erreur lors de l\'upload de l\'image')
  } finally {
    isUploading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  form.value = {
    id: null,
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    code_promo: '',
    active: true,
    featured: false,
    type: 'bonplan'
  }
}

const submitForm = () => {
  emit('saved', form.value)
  closeModal()
}
</script>

<template>
  <div 
    v-if="modelValue" 
    class="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50"
    @click.self="closeModal"
  >
    <div class="bg-white w-full h-full overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
        <h2 class="text-2xl font-bold text-gray-800">
          {{ isEditing ? 'Modifier le bon plan' : 'Créer un bon plan' }}
        </h2>
        <button 
          @click="closeModal"
          class="text-gray-500 hover:text-gray-700 text-3xl"
        >
          ×
        </button>
      </div>

      <form @submit.prevent="submitForm" class="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select 
            v-model="form.type" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="bonplan">🏷️ Bon plan</option>
            <option value="pub">📢 Publicité</option>
            <option value="evenement">🎉 Événement</option>
            <option value="atelier">🎨 Atelier</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input 
            v-model="form.title" 
            type="text" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea 
            v-model="form.description" 
            required
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- Upload d'image -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Image *</label>
          
          <div v-if="form.image_url" class="mb-4">
            <img 
              :src="form.image_url" 
              alt="Preview" 
              class="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
            />
          </div>

          <div class="flex gap-3 items-center">
            <label class="bg-blue-600 text-white px-4 py-2 rounded-lg transition cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                @change="handleImageUpload"
                class="hidden"
              />
              {{ isUploading ? 'Upload en cours...' : form.image_url ? 'Changer l\'image' : 'Choisir une image' }}
            </label>
            
            <span v-if="isUploading" class="text-blue-600">⏳ Upload...</span>
          </div>
          
          <p class="text-xs text-gray-500 mt-2">Format: JPG, PNG, WEBP. Taille max: 1 MB</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Lien de la promotion</label>
          <input 
            v-model="form.link_url" 
            type="url"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Code promo</label>
          <input 
            v-model="form.code_promo" 
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input 
              v-model="form.start_date" 
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input 
              v-model="form.end_date" 
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="flex items-center gap-6">
          <label class="flex items-center cursor-pointer">
            <input v-model="form.active" type="checkbox" class="mr-2 w-5 h-5" />
            <span class="text-sm text-gray-700">Actif</span>
          </label>

          <label class="flex items-center cursor-pointer">
            <input v-model="form.featured" type="checkbox" class="mr-2 w-5 h-5" />
            <span class="text-sm text-gray-700">Mis en avant</span>
          </label>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button 
            type="submit"
            class="bg-blue-800 text-white px-8 py-3 rounded-lg transition font-medium"
          >
            {{ isEditing ? 'Mettre à jour' : 'Créer' }}
          </button>
          <button 
            type="button"
            @click="closeModal"
            class="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

