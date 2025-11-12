<template>
  <div>
    <input type="file" @change="uploadLogo" accept="image/*" class="hidden" ref="fileInput">
    <button @click="$refs.fileInput.click()" class="p-2 bg-white rounded-full absolute top-0 right-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil-minus" width="20" height="20" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
        <path d="M13.5 6.5l4 4" />
        <path d="M16 19h6" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const emit = defineEmits(['update:logoUrl'])

const resizeImage = (file, size) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        
        // Calcul pour le recadrage carré
        const minDimension = Math.min(img.width, img.height)
        const startX = (img.width - minDimension) / 2
        const startY = (img.height - minDimension) / 2

        ctx.drawImage(img, startX, startY, minDimension, minDimension, 0, 0, size, size)
        
        canvas.toBlob(resolve, 'image/jpeg', 0.7)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const uploadLogo = async (event) => {
  const file = event.target.files[0]
  const resizedBlob = await resizeImage(file, 100) // Redimensionne à 100x100
  const fileName = `logo_${Date.now()}.jpg`
  
  const { data, error } = await supabase.storage
    .from('image')
    .upload(`avatars/${fileName}`, resizedBlob, {
      contentType: 'image/jpeg'
    })

  if (error) {
    console.error('Erreur lors de l\'upload:', error)
    return
  }

  const { data: { publicUrl } } = supabase.storage
    .from('image')
    .getPublicUrl(`avatars/${fileName}`)

  emit('update:logoUrl', publicUrl)
}
</script>