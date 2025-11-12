<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  middleware: 'owner',
  showHeader: false,
  showNavbar: false,
  showSidebar: false,
  showFooter: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const messages = ref([])
const isLoading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const userBoutique = ref(null)
const clientsCount = ref(0)

const form = ref({
  id: null,
  title: '',
  message: '',
  image_url: '',
  cta_text: '',
  cta_link: '',
  icon: '📢',
  category: 'info',
  priority: 0,
  publish_at: new Date().toISOString().slice(0, 16),
  expiry_date: '',
  is_published: true
})

// Récupérer la boutique de l'utilisateur
const fetchUserBoutique = async () => {
  const { data, error } = await supabase
    .from('boutique')
    .select('*')
    .eq('owner', user.value.id)
    .single()
  
  if (error) {
    console.error('Erreur boutique:', error)
    return
  }
  
  userBoutique.value = data
  
  // Compter le nombre de clients uniques
  const { count, error: countError } = await supabase
    .from('reward')
    .select('user_uid_reward', { count: 'exact', head: true })
    .eq('store_slug', data.slug)
  
  if (!countError) {
    clientsCount.value = count || 0
  }
}

// Récupérer les messages
const fetchMessages = async () => {
  if (!userBoutique.value) return
  
  isLoading.value = true
  
  const { data, error } = await supabase
    .from('global_messages')
    .select('*')
    .eq('boutique_slug', userBoutique.value.slug)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erreur messages:', error)
  } else {
    messages.value = data || []
  }
  
  isLoading.value = false
}

// Sauvegarder
const saveMessage = async () => {
  if (!userBoutique.value) return
  
  const messageData = {
    title: form.value.title,
    message: form.value.message,
    image_url: form.value.image_url || null,
    link_url: form.value.cta_link || null,
    link_label: form.value.cta_text || null,
    icon: form.value.icon,
    category: form.value.category,
    priority: form.value.priority,
    publish_at: form.value.publish_at,
    expiry_date: form.value.expiry_date || null,
    is_published: form.value.is_published,
    boutique_slug: userBoutique.value.slug,
    target_audience: 'all',
    author_id: user.value.id
  }
  
  if (isEditing.value && form.value.id) {
    const { error } = await supabase
      .from('global_messages')
      .update(messageData)
      .eq('id', form.value.id)
    
    if (error) {
      alert('❌ Erreur lors de la mise à jour')
      console.error(error)
    } else {
      alert('✅ Message mis à jour !')
      closeModal()
      await fetchMessages()
    }
  } else {
    const { error } = await supabase
      .from('global_messages')
      .insert(messageData)
    
    if (error) {
      alert('❌ Erreur lors de la création')
      console.error(error)
    } else {
      alert('✅ Message envoyé à vos clients !')
      closeModal()
      await fetchMessages()
    }
  }
}

// Éditer
const editMessage = (message) => {
  form.value = {
    id: message.id,
    title: message.title,
    message: message.message,
    image_url: message.image_url || '',
    cta_text: message.link_label || '',
    cta_link: message.link_url || '',
    icon: message.icon || '📢',
    category: message.category,
    priority: message.priority,
    publish_at: message.publish_at?.slice(0, 16) || new Date().toISOString().slice(0, 16),
    expiry_date: message.expiry_date?.slice(0, 16) || '',
    is_published: message.is_published
  }
  isEditing.value = true
  showModal.value = true
}

// Supprimer
const deleteMessage = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return
  
  const { error } = await supabase
    .from('global_messages')
    .delete()
    .eq('id', id)
  
  if (error) {
    alert('❌ Erreur lors de la suppression')
  } else {
    alert('✅ Message supprimé')
    await fetchMessages()
  }
}

// Fermer modal
const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  form.value = {
    id: null,
    title: '',
    message: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    icon: '📢',
    category: 'info',
    priority: 0,
    publish_at: new Date().toISOString().slice(0, 16),
    expiry_date: '',
    is_published: true
  }
}

const icons = [
  { emoji: '📢', label: 'Mégaphone' },
  { emoji: '🎁', label: 'Cadeau' },
  { emoji: '🏷️', label: 'Étiquette' },
  { emoji: '⭐', label: 'Étoile' },
  { emoji: '🔥', label: 'Feu' },
  { emoji: '🔔', label: 'Cloche' },
  { emoji: '✨', label: 'Étincelles' },
  { emoji: 'ℹ️', label: 'Info' }
]

onMounted(async () => {
  await fetchUserBoutique()
  await fetchMessages()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/admin" class="text-blue-800 hover:text-blue-600 mb-4 inline-block">
        ← Retour
      </NuxtLink>
      
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Messages à mes clients</h1>
      <p class="text-gray-600">
        Envoyez des messages à tous vos clients
        <span v-if="clientsCount > 0" class="text-blue-800 font-semibold">({{ clientsCount }} clients)</span>
      </p>
    </div>

    <!-- Bouton créer -->
    <button
      @click="showModal = true"
      class="bg-blue-800 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-6"
    >
      + Nouveau message
    </button>

    <!-- Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 overflow-y-auto"
      @click.self="closeModal"
    >
      <div class="bg-white w-full max-w-4xl m-8 rounded-lg">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 class="text-2xl font-bold text-gray-800">
            {{ isEditing ? 'Modifier le message' : 'Nouveau message' }}
          </h2>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700 text-3xl">×</button>
        </div>

        <form @submit.prevent="saveMessage" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input 
                v-model="form.title" 
                type="text" 
                required
                placeholder="Ex: Nouvelle collection !"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Icône</label>
              <select 
                v-model="form.icon"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="icon in icons" :key="icon.emoji" :value="icon.emoji">{{ icon.emoji }} {{ icon.label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <TiptapEditor v-model="form.message" placeholder="Écrivez votre message..." />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Image (URL)</label>
            <input 
              v-model="form.image_url" 
              type="url"
              placeholder="https://..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <img v-if="form.image_url" :src="form.image_url" alt="Preview" class="mt-2 w-full max-w-md h-48 object-cover rounded-lg" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
              <input 
                v-model="form.cta_text" 
                type="text"
                placeholder="Ex: Voir la collection"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Lien du bouton</label>
              <input 
                v-model="form.cta_link" 
                type="url"
                placeholder="https://..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select 
                v-model="form.category"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Information</option>
                <option value="promo">Promotion</option>
                <option value="update">Nouveauté</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select 
                v-model="form.priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option :value="0">Normale</option>
                <option :value="1">Importante</option>
                <option :value="2">Urgente</option>
              </select>
            </div>

            <div class="flex items-end">
              <label class="flex items-center cursor-pointer">
                <input v-model="form.is_published" type="checkbox" class="mr-2" />
                <span class="text-sm text-gray-700">Publier</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date de publication</label>
              <input 
                v-model="form.publish_at" 
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
              <input 
                v-model="form.expiry_date" 
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <button 
              type="submit"
              class="bg-blue-800 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {{ isEditing ? 'Mettre à jour' : 'Envoyer' }}
            </button>
            <button 
              type="button"
              @click="closeModal"
              class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Liste des messages -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Messages envoyés</h2>

      <div v-if="isLoading" class="text-center py-8">
        <p class="text-gray-500">Chargement...</p>
      </div>

      <div v-else-if="messages.length === 0" class="text-center py-8">
        <p class="text-gray-500">Aucun message envoyé</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="message in messages"
          :key="message.id"
          class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ message.icon }}</span>
              <div>
                <h3 class="font-semibold text-gray-800">{{ message.title }}</h3>
                <div class="flex gap-2 mt-1">
                  <span 
                    :class="{
                      'bg-blue-100 text-blue-800': message.category === 'info',
                      'bg-orange-100 text-orange-800': message.category === 'promo',
                      'bg-green-100 text-green-800': message.category === 'update',
                      'bg-red-100 text-red-800': message.category === 'urgent'
                    }"
                    class="px-2 py-1 rounded text-xs"
                  >
                    {{ message.category }}
                  </span>
                  <span 
                    :class="message.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                    class="px-2 py-1 rounded text-xs"
                  >
                    {{ message.is_published ? 'Publié' : 'Brouillon' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button @click="editMessage(message)" class="text-blue-600 hover:text-blue-800 text-sm">
                ✏️ Modifier
              </button>
              <button @click="deleteMessage(message.id)" class="text-red-600 hover:text-red-800 text-sm">
                🗑️ Supprimer
              </button>
            </div>
          </div>

          <div class="text-sm text-gray-600 mb-2" v-html="message.message?.substring(0, 150) + '...'"></div>

          <div class="flex gap-4 text-xs text-gray-500">
            <span>👁️ {{ message.views_count || 0 }} vues</span>
            <span>📅 {{ new Date(message.publish_at).toLocaleDateString('fr-FR') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
