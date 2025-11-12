<!-- pages/admin/messages.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const supabase = useSupabaseClient()
const users = ref([])
const selectedUser = ref(null)
const message = ref('')
const expiryDate = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref(null)

// Charger la liste des utilisateurs
const fetchUsers = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')

    if (fetchError) throw fetchError
    users.value = data
  } catch (e) {
    error.value = "Erreur lors du chargement des utilisateurs"
  }
}

// Envoyer le message
const sendMessage = async () => {
  if (!selectedUser.value || !message.value) {
    error.value = "Veuillez remplir tous les champs obligatoires"
    return
  }

  isLoading.value = true
  error.value = null
  success.value = false

  try {
    const { error: insertError } = await supabase
      .from('user_messages')
      .insert({
        user_id: selectedUser.value,
        message: message.value,
        expiry_date: expiryDate.value || null
      })

    if (insertError) throw insertError

    success.value = true
    message.value = ''
    selectedUser.value = null
    expiryDate.value = ''

    setTimeout(() => {
      success.value = false
    }, 3000)

  } catch (e) {
    error.value = "Erreur lors de l'envoi du message"
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <p class="text-lg uppercase font-semibold text-blue-800 text-center pb-10">Envoyer une message</p>

    <form @submit.prevent="sendMessage" class="space-y-6 bg-white rounded-lg shadow p-6">
      <!-- Sélection de l'utilisateur -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Utilisateur *
        </label>
        <select v-model="selectedUser" required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          <option value="">Sélectionner un utilisateur</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.full_name }}
          </option>
        </select>
      </div>

      <!-- Message -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea v-model="message" required rows="4"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Votre message..."></textarea>
      </div>

      <!-- Date d'expiration -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Date d'expiration (optionnel)
        </label>
        <input type="datetime-local" v-model="expiryDate"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
      </div>

      <!-- Bouton d'envoi -->
      <div class="flex justify-end">
        <button type="submit" :disabled="isLoading"
          class="bg-blue-800 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors">
          {{ isLoading ? 'Envoi en cours...' : 'Envoyer le message' }}
        </button>
      </div>

      <!-- Messages de succès/erreur -->
      <div v-if="success" class="p-4 bg-green-100 text-green-700 rounded-lg">
        Message envoyé avec succès !
      </div>

      <div v-if="error" class="p-4 bg-red-100 text-red-700 rounded-lg">
        {{ error }}
      </div>
    </form>
  </div>
</template>