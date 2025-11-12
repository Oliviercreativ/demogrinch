<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 py-24">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin/blog" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ isNew ? 'Nouvel article' : 'Modifier l\'article' }}
          </h1>
        </div>
        
        <div class="flex gap-3">
          <button
            @click="saveArticle(false)"
            :disabled="saving"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Enregistrer brouillon
          </button>
          <button
            @click="saveArticle(true)"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Enregistrement...' : 'Publier' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="saveArticle(true)" class="space-y-6">
        <!-- Titre -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Titre *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full px-4 py-2 text-2xl font-bold border-0 border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-0 bg-transparent dark:text-white"
            placeholder="Titre de l'article..."
          />
        </div>

        <!-- Slug & Date -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug (URL) *
              </label>
              <input
                v-model="form.slug"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="mon-article-blog"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL : /blog/{{ form.slug || 'mon-article' }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de publication
              </label>
              <input
                v-model="form.date"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Extrait -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Extrait (Excerpt)
          </label>
          <textarea
            v-model="form.excerpt"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Court résumé de l'article pour les listes..."
          ></textarea>
        </div>

        <!-- SEO -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO & Permalien</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Title (Titre SEO)
              </label>
              <input
                v-model="form.meta_title"
                type="text"
                maxlength="60"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Titre optimisé pour les moteurs de recherche"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ form.meta_title?.length || 0 }}/60 caractères
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Description
              </label>
              <textarea
                v-model="form.meta_description"
                rows="3"
                maxlength="160"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Description courte pour les moteurs de recherche (max 160 caractères)"
              ></textarea>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ form.meta_description?.length || 0 }}/160 caractères
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permalien (optionnel)
              </label>
              <input
                v-model="form.permalink"
                type="url"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://exemple.com/lien-permanent"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lien permanent externe (si différent du slug)
              </p>
            </div>
          </div>
        </div>

        <!-- Catégories & Tags -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catégories
              </label>
              <input
                v-model="form.categories"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Actualités, Événements"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Étiquettes (tags)
              </label>
              <input
                v-model="form.etiquettes"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="tag1, tag2, tag3"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Séparer par des virgules
              </p>
            </div>
          </div>
        </div>

        <!-- Image de couverture -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Image de couverture
          </label>
          <BlogCoverUpload v-model="form.image_url" />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Format recommandé : 1200x630px (l'image sera automatiquement compressée en WebP)
          </p>
        </div>

        <!-- Contenu avec Tiptap -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contenu de l'article *
          </label>
          <TiptapEditor
            v-model="form.content"
            placeholder="Écrivez votre article ici... Utilisez la barre d'outils pour formater le texte et insérer des images."
          />
        </div>

        <!-- Podcasts (optionnel) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Podcasts (optionnel)</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </span>
              </label>
              <input
                v-model="form.youtube"
                type="url"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Spotify
                </span>
              </label>
              <input
                v-model="form.spotify"
                type="url"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://open.spotify.com/episode/..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.298c-.218.363-.678.478-1.042.26-2.855-1.748-6.45-2.144-10.686-1.174-.409.094-.818-.163-.911-.571-.094-.409.163-.818.571-.911 4.644-1.062 8.658-.603 11.951 1.355.363.218.478.678.26 1.041zM17.77 14.02c-.274.446-.857.589-1.303.315-3.27-2.01-8.252-2.591-12.124-1.418-.502.153-1.032-.125-1.185-.627-.153-.502.125-1.032.627-1.185 4.428-1.341 9.949-.692 13.67 1.612.446.274.589.857.315 1.303zm.127-3.133C14.355 8.732 8.343 8.52 4.862 9.699c-.601.204-1.247-.119-1.451-.721-.204-.601.119-1.247.721-1.451 3.972-1.349 10.658-1.088 14.854 1.64.548.319.729 1.019.41 1.566-.319.548-1.019.729-1.566.41z"/>
                  </svg>
                  Apple Podcasts
                </span>
              </label>
              <input
                v-model="form.applepodcast"
                type="url"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://podcasts.apple.com/..."
              />
            </div>
          </div>
        </div>

        <!-- Statuts -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statuts & Visibilité</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.actif"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                ✅ Article actif
              </span>
            </label>
            
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.public"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                🌍 Article public
              </span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.private"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                🔒 Article privé
              </span>
            </label>
            
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.featured"
                type="checkbox"
                class="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                ⭐ Article à la une
              </span>
            </label>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'

definePageMeta({
  middleware: 'admin',
  showHeader: false,
  showNavbar: false,
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const isNew = computed(() => route.params.id === 'nouveau')
const saving = ref(false)

const form = ref({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  meta_description: '',
  meta_title: '',
  permalink: '',
  date: new Date().toISOString().split('T')[0],
  categories: '',
  etiquettes: '',
  image_url: '',
  youtube: '',
  spotify: '',
  applepodcast: '',
  featured: false,
  actif: true,
  public: true,
  private: false
})

// Load article
async function loadArticle() {
  if (isNew.value) return
  
  try {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .eq('id', route.params.id)
      .single()
    
    if (error) throw error
    
    if (data) {
      form.value = {
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        meta_description: data.meta_description || '',
        meta_title: data.meta_title || '',
        permalink: data.permalink || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        categories: data.categories || '',
        etiquettes: data.etiquettes || '',
        image_url: data.image_url || '',
        youtube: data.youtube || '',
        spotify: data.spotify || '',
        applepodcast: data.applepodcast || '',
        featured: data.featured ?? false,
        actif: data.actif ?? true,
        public: data.public ?? true,
        private: data.private ?? false
      }
    }
  } catch (e) {
    console.error('Error loading article:', e)
    alert('Erreur lors du chargement de l\'article')
  }
}

// Save article
async function saveArticle(publish = false) {
  if (!form.value.title || !form.value.slug || !form.value.content) {
    alert('Veuillez remplir tous les champs obligatoires (titre, slug, contenu)')
    return
  }
  
  try {
    saving.value = true
    
    const user = useSupabaseUser()
    
    const articleData = {
      title: form.value.title,
      slug: form.value.slug,
      content: form.value.content,
      excerpt: form.value.excerpt || null,
      meta_description: form.value.meta_description || null,
      meta_title: form.value.meta_title || null,
      permalink: form.value.permalink || null,
      date: form.value.date || new Date().toISOString(),
      categories: form.value.categories || null,
      etiquettes: form.value.etiquettes || null,
      image_url: form.value.image_url || null,
      youtube: form.value.youtube || null,
      spotify: form.value.spotify || null,
      applepodcast: form.value.applepodcast || null,
      featured: form.value.featured,
      actif: publish ? true : form.value.actif,
      public: publish ? true : form.value.public,
      private: form.value.private,
      user_id: user.value?.id
    }
    
    if (isNew.value) {
      // Create
      const { error } = await supabase
        .from('blog')
        .insert(articleData)
      
      if (error) throw error
      
      alert('Article créé avec succès !')
      router.push('/admin/blog')
    } else {
      // Update
      const { error } = await supabase
        .from('blog')
        .update(articleData)
        .eq('id', route.params.id)
      
      if (error) throw error
      
      alert('Article mis à jour avec succès !')
    }
  } catch (e) {
    console.error('Error saving article:', e)
    alert('Erreur lors de l\'enregistrement: ' + e.message)
  } finally {
    saving.value = false
  }
}

onMounted(loadArticle)
</script>

