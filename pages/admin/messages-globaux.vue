<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Messages Globaux
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Envoyer des messages à tous les utilisateurs ou à des groupes spécifiques
        </p>
      </div>

      <!-- Actions -->
      <div class="mb-6 flex justify-between items-center">
        <button
          @click="showModal = true; resetForm()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Créer un message
        </button>

        <!-- Stats -->
        <div class="flex gap-4 text-sm">
          <div class="text-gray-600 dark:text-gray-400">
            <span class="font-semibold text-gray-900 dark:text-white">{{ messages.length }}</span> messages
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Messages List -->
      <div v-else class="space-y-4">
        <!-- Empty state -->
        <div v-if="messages.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p class="text-gray-500 dark:text-gray-400">Aucun message créé</p>
        </div>

        <!-- Messages Grid -->
        <div v-else class="grid gap-4">
          <div
            v-for="message in sortedMessages"
            :key="message.id"
            class="bg-white dark:bg-gray-800 rounded-lg p-6 "
          >
            <div class="flex items-start justify-between">
              <!-- Content -->
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <!-- Icon -->
                  <span class="text-2xl">{{ message.icon || '📢' }}</span>
                  
                  <!-- Title -->
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ message.title }}
                  </h3>

                  <!-- Priority Badge -->
                  <span
                    v-if="message.priority > 0"
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      message.priority === 2 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                      message.priority === 1 ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    ]"
                  >
                    {{ message.priority === 2 ? 'Urgent' : 'Important' }}
                  </span>

                  <!-- Status Badge -->
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      message.is_published ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    ]"
                  >
                    {{ message.is_published ? 'Publié' : 'Brouillon' }}
                  </span>

                  <!-- Category Badge -->
                  <span
                    :class="getCategoryClass(message.category)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getCategoryLabel(message.category) }}
                  </span>
                </div>

                <!-- Message -->
                <p class="text-gray-600 dark:text-gray-300 mb-3">{{ message.message }}</p>

                <!-- Meta info -->
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ getAudienceLabel(message.target_audience) }}</span>
                    <span v-if="message.boutique_slug" class="text-blue-600 dark:text-blue-400">
                      ({{ message.boutique_slug }})
                    </span>
                  </div>

                  <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ formatDate(message.publish_at) }}</span>
                  </div>

                  <div v-if="message.expiry_date" class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    <span>Expire le {{ formatDate(message.expiry_date) }}</span>
                  </div>

                  <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ message.views_count || 0 }} vues</span>
                  </div>

                  <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{{ message.read_count || 0 }} lectures</span>
                  </div>
                </div>

                <!-- Link -->
                <div v-if="message.link_url" class="mt-3">
                  <a
                    :href="message.link_url"
                    target="_blank"
                    class="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                  >
                    {{ message.link_label || 'Voir plus' }}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 ml-4">
                <button
                  @click="editMessage(message)"
                  class="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  title="Modifier"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>

                <button
                  @click="duplicateMessage(message)"
                  class="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                  title="Dupliquer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                  </svg>
                </button>

                <button
                  @click="deleteMessage(message.id)"
                  class="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Création/Édition -->
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ editingMessage ? 'Modifier le message' : 'Créer un message' }}
            </h2>
            <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveMessage" class="p-6 space-y-6">
            <!-- Titre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre *
              </label>
              <input
                v-model="form.title"
                type="text"
                required
                maxlength="200"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Nouvelle fonctionnalité !"
              />
            </div>

            <!-- Message avec Tiptap -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message * (Éditeur enrichi)
              </label>
              <TiptapEditor
                v-model="form.message"
                placeholder="Écrivez votre message avec mise en forme..."
              />
            </div>

            <!-- Icon & Category Row -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Icon -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icône / Emoji
                </label>
                <input
                  v-model="form.icon"
                  type="text"
                  maxlength="50"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="📢 🎉 ⚠️ ✨"
                />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie *
                </label>
                <select
                  v-model="form.category"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="info">🔵 Info</option>
                  <option value="promo">🟢 Promo</option>
                  <option value="update">🟡 Mise à jour</option>
                  <option value="maintenance">🟠 Maintenance</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
            </div>

            <!-- Priority & Status Row -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Priority -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priorité
                </label>
                <select
                  v-model.number="form.priority"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option :value="0">Normal</option>
                  <option :value="1">Important</option>
                  <option :value="2">Urgent</option>
                </select>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  v-model="form.is_published"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option :value="true">Publié</option>
                  <option :value="false">Brouillon</option>
                </select>
              </div>
            </div>

            <!-- Ciblage -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ciblage *
              </label>
              <select
                v-model="form.target_audience"
                required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tous les utilisateurs</option>
                <option value="clients">Clients (ayant scanné)</option>
                <option value="owners">Propriétaires de boutiques</option>
                <option value="boutique_specific">Boutique spécifique</option>
              </select>
            </div>

            <!-- Boutique Slug (si boutique_specific) -->
            <div v-if="form.target_audience === 'boutique_specific'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug de la boutique *
              </label>
              <input
                v-model="form.boutique_slug"
                type="text"
                :required="form.target_audience === 'boutique_specific'"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: boulangerie-paul"
              />
            </div>

            <!-- Dates Row -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Publish At -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de publication
                </label>
                <input
                  v-model="form.publish_at"
                  type="datetime-local"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Expiry Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date d'expiration
                </label>
                <input
                  v-model="form.expiry_date"
                  type="datetime-local"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <!-- Image URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image illustrative (optionnel)
              </label>
              <input
                v-model="form.image_url"
                type="url"
                maxlength="500"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://exemple.com/image.jpg"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL d'une image hébergée (JPG, PNG, WebP)
              </p>
              <!-- Aperçu de l'image -->
              <div v-if="form.image_url" class="mt-3">
                <img :src="form.image_url" alt="Aperçu" class="max-h-40 rounded-lg border border-gray-200 dark:border-gray-600" />
              </div>
            </div>

            <!-- Link URL & Label -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Link URL -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lien (optionnel)
                </label>
                <input
                  v-model="form.link_url"
                  type="url"
                  maxlength="500"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <!-- Link Label -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Texte du bouton
                </label>
                <input
                  v-model="form.link_label"
                  type="text"
                  maxlength="100"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Voir plus"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                @click="showModal = false"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {{ saving ? 'Enregistrement...' : (editingMessage ? 'Mettre à jour' : 'Créer') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  middleware: 'admin',
  showHeader: false,
  showNavbar: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const error = ref(null)
const messages = ref([])
const showModal = ref(false)
const editingMessage = ref(null)
const saving = ref(false)

const form = ref({
  title: '',
  message: '',
  target_audience: 'all',
  boutique_slug: '',
  category: 'info',
  priority: 0,
  publish_at: '',
  expiry_date: '',
  is_published: true,
  image_url: '',
  link_url: '',
  link_label: '',
  icon: '📢'
})

// Sorted messages (priority then date)
const sortedMessages = computed(() => {
  return [...messages.value].sort((a, b) => {
    // Priority first (urgent > important > normal)
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    // Then by date (newest first)
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

// Load messages with read stats
async function loadMessages() {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('global_messages_with_stats')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    messages.value = data || []
  } catch (e) {
    console.error('Error loading messages:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Reset form
function resetForm() {
  editingMessage.value = null
  form.value = {
    title: '',
    message: '',
    target_audience: 'all',
    boutique_slug: '',
    category: 'info',
    priority: 0,
    publish_at: '',
    expiry_date: '',
    is_published: true,
    image_url: '',
    link_url: '',
    link_label: '',
    icon: '📢'
  }
}

// Edit message
function editMessage(message) {
  editingMessage.value = message
  form.value = {
    title: message.title,
    message: message.message,
    target_audience: message.target_audience,
    boutique_slug: message.boutique_slug || '',
    category: message.category,
    priority: message.priority,
    publish_at: message.publish_at ? new Date(message.publish_at).toISOString().slice(0, 16) : '',
    expiry_date: message.expiry_date ? new Date(message.expiry_date).toISOString().slice(0, 16) : '',
    is_published: message.is_published,
    image_url: message.image_url || '',
    link_url: message.link_url || '',
    link_label: message.link_label || '',
    icon: message.icon || '📢'
  }
  showModal.value = true
}

// Duplicate message
function duplicateMessage(message) {
  resetForm()
  form.value = {
    title: `${message.title} (Copie)`,
    message: message.message,
    target_audience: message.target_audience,
    boutique_slug: message.boutique_slug || '',
    category: message.category,
    priority: message.priority,
    publish_at: '',
    expiry_date: message.expiry_date ? new Date(message.expiry_date).toISOString().slice(0, 16) : '',
    is_published: false,
    image_url: message.image_url || '',
    link_url: message.link_url || '',
    link_label: message.link_label || '',
    icon: message.icon || '📢'
  }
  showModal.value = true
}

// Save message
async function saveMessage() {
  try {
    saving.value = true

    const messageData = {
      title: form.value.title,
      message: form.value.message,
      target_audience: form.value.target_audience,
      boutique_slug: form.value.target_audience === 'boutique_specific' ? form.value.boutique_slug : null,
      category: form.value.category,
      priority: form.value.priority,
      publish_at: form.value.publish_at || new Date().toISOString(),
      expiry_date: form.value.expiry_date || null,
      is_published: form.value.is_published,
      image_url: form.value.image_url || null,
      link_url: form.value.link_url || null,
      link_label: form.value.link_label || null,
      icon: form.value.icon || null,
      author_id: user.value.id
    }

    if (editingMessage.value) {
      // Update
      const { error: updateError } = await supabase
        .from('global_messages')
        .update(messageData)
        .eq('id', editingMessage.value.id)

      if (updateError) throw updateError
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('global_messages')
        .insert(messageData)

      if (insertError) throw insertError
    }

    showModal.value = false
    resetForm()
    await loadMessages()
  } catch (e) {
    console.error('Error saving message:', e)
    alert('Erreur lors de l\'enregistrement: ' + e.message)
  } finally {
    saving.value = false
  }
}

// Delete message
async function deleteMessage(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

  try {
    const { error: deleteError } = await supabase
      .from('global_messages')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    await loadMessages()
  } catch (e) {
    console.error('Error deleting message:', e)
    alert('Erreur lors de la suppression: ' + e.message)
  }
}

// Helpers
function getCategoryLabel(category) {
  const labels = {
    info: 'Info',
    promo: 'Promo',
    update: 'Mise à jour',
    maintenance: 'Maintenance',
    urgent: 'Urgent'
  }
  return labels[category] || category
}

function getCategoryClass(category) {
  const classes = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    promo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    update: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    maintenance: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
  }
  return classes[category] || 'bg-gray-100 text-gray-800'
}

function getAudienceLabel(audience) {
  const labels = {
    all: 'Tous les utilisateurs',
    clients: 'Clients',
    owners: 'Propriétaires',
    boutique_specific: 'Boutique spécifique'
  }
  return labels[audience] || audience
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(loadMessages)
</script>

