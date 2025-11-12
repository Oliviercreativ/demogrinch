<template>
  <div>
    <input type="file" @change="uploadCover" accept="image/*" class="hidden" ref="fileInput">
    <button @click="$refs.fileInput.click()" class="p-2 bg-white rounded-full absolute -bottom-5 right-5">
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
const emit = defineEmits(['update:coverUrl'])

const resizeImage = (file, maxWidth, maxHeight) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(resolve, 'image/jpeg', 0.7)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const uploadCover = async (event) => {
  const file = event.target.files[0]
  const resizedBlob = await resizeImage(file, 1000);
  const fileName = `cover_${Date.now()}.jpg`
  
  const { data, error } = await supabase.storage
    .from('image')
    .upload(`covers/${fileName}`, resizedBlob, {
      contentType: 'image/jpeg'
    })

  if (error) {
    console.error('Erreur lors de l\'upload:', error)
    return
  }

  const { data: { publicUrl } } = supabase.storage
    .from('image')
    .getPublicUrl(`covers/${fileName}`)

  emit('update:coverUrl', publicUrl)
}
</script>