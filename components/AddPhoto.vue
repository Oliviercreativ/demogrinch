<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const error = ref(null)
const success = ref(null)
const currentAvatarUrl = ref('')
const newAvatarUrl = ref('')
const isDialogOpen = ref(false)

const emit = defineEmits(['avatar-updated'])

onMounted(async () => {
  await fetchCurrentAvatar()
})

const fetchCurrentAvatar = async () => {
  if (!user.value) return

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.value.id)
      .single()

    if (error) throw error

    currentAvatarUrl.value = data.avatar_url
  } catch (e) {
    error.value = "Erreur lors de la récupération de l'avatar actuel : " + e.message
  }
}

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;

        // Calculer les dimensions pour le recadrage carré
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        ctx.drawImage(img, x, y, size, size, 0, 0, 100, 100);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const resizedBlob = await resizeImage(file);
    const fileName = `profile_${user.value.id}_${Date.now()}.jpg`;

    const { data, error: uploadError } = await supabase.storage
      .from('image')
      .upload(`avatars/${fileName}`, resizedBlob, {
        contentType: 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('image')
      .getPublicUrl(`avatars/${fileName}`);

    newAvatarUrl.value = publicUrl;
    error.value = null;
    success.value = "Image redimensionnée et téléchargée avec succès. Cliquez sur 'Mettre à jour' pour confirmer.";
  } catch (e) {
    error.value = "Erreur lors du redimensionnement ou du téléchargement : " + e.message;
    success.value = null;
  }
};

const updateAvatar = async () => {
  if (!newAvatarUrl.value || !user.value) return

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl.value })
      .eq('id', user.value.id)

    if (updateError) throw updateError

    currentAvatarUrl.value = newAvatarUrl.value
    emit('avatar-updated', newAvatarUrl.value)  // Émettre un événement avec la nouvelle URL
    success.value = "Avatar mis à jour avec succès"
    error.value = null
    closeDialog()
  } catch (e) {
    error.value = "Erreur lors de la mise à jour de l'avatar : " + e.message
    success.value = null
  }
}

const openDialog = () => {
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
  newAvatarUrl.value = ''
  error.value = null
  success.value = null
}
</script>

<template>
  <div>
    <button @click="openDialog" class="p-2 bg-white rounded-full absolute top-50 left-90">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil-minus" width="20" height="20" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
        <path d="M13.5 6.5l4 4" />
        <path d="M16 19h6" />
      </svg>
    </button>

    <Transition name="fade">
      <div v-if="isDialogOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg p-6 w-full max-w-md" @click.stop>
          <h2 class="text-lg font-medium leading-6 text-gray-900 mb-4">Mettre à jour votre avatar</h2>
          
          <div class="mt-4">
            <input type="file" @change="handleFileUpload" accept="image/*" class="w-full" />
            <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
            <p v-if="success" class="text-blue-500 mt-2">{{ success }}</p>
          </div>

          <!-- Afficher l'avatar actuel et le nouvel avatar -->
          <div class="mt-4 flex justify-between">
            <div>
              <p class="text-sm text-gray-500 mb-1">Avatar actuel</p>
              <img :src="currentAvatarUrl" alt="Avatar actuel" class="w-24 h-24 object-cover rounded-md" />
            </div>
            <div v-if="newAvatarUrl">
              <p class="text-sm text-gray-500 mb-1">Nouvel avatar</p>
              <img :src="newAvatarUrl" alt="Nouvel avatar" class="w-24 h-24 object-cover rounded-md" />
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button @click="closeDialog" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">
              Annuler
            </button>
            <button @click="updateAvatar" class="px-4 py-2 bg-blue-500 text-white rounded-md" :disabled="!newAvatarUrl">
              Mettre à jour
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>