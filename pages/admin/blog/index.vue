<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Articles de Blog
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gérer les articles du blog GRINCH
          </p>
        </div>
        
        <button
          @click="createArticle"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Nouvel article
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Articles List -->
      <div v-else class="grid gap-4">
        <div
          v-for="article in articles"
          :key="article.id"
          class="bg-white dark:bg-gray-800 rounded-lg p-6 "
        >
          <div class="flex gap-6">
            <!-- Image de couverture -->
            <div v-if="article.image_url" class="flex-shrink-0">
              <img :src="article.image_url" :alt="article.title" class="w-48 h-32 object-cover rounded-lg" />
            </div>
            
            <!-- Contenu -->
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {{ article.title }}
                  </h2>
                  
                  <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>{{ formatDate(article.date) }}</span>
                    <span v-if="article.categories" class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded">
                      {{ article.categories }}
                    </span>
                    <span v-if="article.featured" class="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded text-xs font-medium">
                      ⭐ À la une
                    </span>
                    <span :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      article.actif ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    ]">
                      {{ article.actif ? 'Actif' : 'Inactif' }}
                    </span>
                    <span :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      article.public ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    ]">
                      {{ article.public ? 'Public' : 'Privé' }}
                    </span>
                  </div>
                  
                  <p v-if="article.meta_description" class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {{ article.meta_description }}
                  </p>
                  
                  <div v-if="article.etiquettes" class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in article.etiquettes.split(',')"
                      :key="tag"
                      class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      #{{ tag.trim() }}
                    </span>
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="flex flex-col gap-2 ml-4">
                  <div class="flex gap-2">
                    <!-- Liens vers les articles publiés -->
                    <a
                      :href="`https://madeinconflans.fr/blog/${article.slug}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                      title="Voir sur madeinconflans.fr"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                    
                    <a
                      :href="`https://madeinconflans.grinch.fr/blog/${article.slug}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                      title="Voir sur grinch.fr"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                    
                    <button
                      @click="editArticle(article)"
                      class="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      title="Modifier"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    
                    <button
                      @click="deleteArticle(article.id)"
                      class="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Labels des liens -->
                  <div class="flex gap-1 text-xs">
                    <span class="text-gray-500">🌐</span>
                    <a
                      :href="`https://madeinconflans.fr/blog/${article.slug}`"
                      target="_blank"
                      class="text-green-600 hover:underline"
                    >
                      .fr
                    </a>
                    <span class="text-gray-400">|</span>
                    <a
                      :href="`https://madeinconflans.grinch.fr/blog/${article.slug}`"
                      target="_blank"
                      class="text-purple-600 hover:underline"
                    >
                      grinch
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'

definePageMeta({
  middleware: 'admin',
  showHeader: false,
  showNavbar: false,
})

const router = useRouter()
const supabase = useSupabaseClient()

const loading = ref(true)
const articles = ref([])

// Load articles
async function loadArticles() {
  try {
    loading.value = true
    
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    
    articles.value = data || []
  } catch (e) {
    console.error('Error loading articles:', e)
    alert('Erreur lors du chargement des articles')
  } finally {
    loading.value = false
  }
}

// Create article
function createArticle() {
  router.push('/admin/blog/nouveau')
}

// Edit article
function editArticle(article) {
  router.push(`/admin/blog/${article.id}`)
}

// Delete article
async function deleteArticle(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return
  
  try {
    const { error } = await supabase
      .from('blog')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await loadArticles()
  } catch (e) {
    console.error('Error deleting article:', e)
    alert('Erreur lors de la suppression')
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

onMounted(loadArticles)
</script>

