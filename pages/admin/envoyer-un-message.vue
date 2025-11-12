<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const users = ref([])
const selectedUser = ref(null)
const message = ref('')
const expiryDate = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref(null)
const userBoutique = ref(null)

// Charger la boutique de l'owner
const fetchOwnerBoutique = async () => {
  if (!currentUser.value) return
  
  try {
    const { data, error: boutiqueError } = await supabase
      .from('boutique')
      .select('id, name_shop, slug')
      .eq('owner', currentUser.value.id)
      .single()

    if (boutiqueError) throw boutiqueError
    userBoutique.value = data
  } catch (e) {
    error.value = "Erreur lors du chargement de la boutique"
    return null
  }
}

// Charger la liste des clients qui ont scanné
const fetchClients = async () => {
  if (!userBoutique.value) return
  
  try {
    const { data, error: fetchError } = await supabase
      .from('reward')
      .select(`
        user_uid_reward,
        profiles:user_uid_reward (
          id,
          full_name
        )
      `)
      .eq('store_slug', userBoutique.value.slug)
      .order('hit_date', { ascending: false })

    if (fetchError) throw fetchError

    // Filtrer les doublons et transformer les données
    const uniqueUsers = [...new Map(data.map(item => [
      item.profiles.id,
      {
        id: item.profiles.id,
        full_name: item.profiles.full_name
      }
    ])).values()]

    users.value = uniqueUsers
  } catch (e) {
    error.value = "Erreur lors du chargement des clients"
  }
}

const sendMessage = async () => {
  if (!selectedUser.value || !message.value || !userBoutique.value) {
    error.value = "Veuillez remplir tous les champs obligatoires"
    return
  }

  isLoading.value = true
  error.value = null
  success.value = false

  try {
    const messageData = {
      user_id: selectedUser.value,
      message: message.value,
      is_read: false,
      boutique_slug: userBoutique.value.slug, // Ajout du slug de la boutique
      expiry_date: expiryDate.value || null
    }

    const { error: insertError } = await supabase
      .from('user_messages')
      .insert(messageData)

    if (insertError) throw insertError

    success.value = true
    message.value = ''
    selectedUser.value = null
    expiryDate.value = ''

    setTimeout(() => {
      success.value = false
    }, 3000)

  } catch (e) {
    console.error('Erreur lors de l\'envoi du message:', e)
    error.value = "Erreur lors de l'envoi du message"
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchOwnerBoutique()
  if (userBoutique.value) {
    await fetchClients()
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <p class="text-lg uppercase font-medium text-blue-800 text-center pb-10">
      {{ userBoutique ? `Envoyer un message aux clients de ${userBoutique.name_shop}` : 'Chargement...' }}
    </p>

    <div v-if="!userBoutique" class="text-center text-red-600">
      Vous devez être propriétaire d'une boutique pour accéder à cette page.
    </div>

    <form v-else @submit.prevent="sendMessage" class="space-y-6 bg-white rounded-lg shadow p-6">
      <!-- Sélection du client -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Client *
        </label>
        <select v-model="selectedUser" required
          class="mt-1 block w-full rounded-md border-gray-800 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500">
          <option value="">Sélectionner un client</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.full_name }}
          </option>
        </select>
        <p class="mt-1 text-sm text-gray-500">
          Seuls les clients ayant déjà scanné chez vous sont disponibles
        </p>
      </div>

      <!-- Message -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea v-model="message" required rows="4"
          class="mt-1 block w-full rounded-md border-gray-800 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Votre message..."></textarea>
      </div>

      <!-- Date d'expiration -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Date d'expiration (optionnel)
        </label>
        <input type="datetime-local" v-model="expiryDate"
          class="mt-1 block w-full rounded-md border-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500">
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