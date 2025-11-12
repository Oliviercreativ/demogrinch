<template>
  <div>
    <!-- Hero de l'article -->
    <BlogArticleHero
      :title="article?.title"
      :image="article?.image_url"
      :date="article?.date"
      :categories="article?.categories"
    />

    <main class="container mx-auto px-4 pt-12 pb-24">
      <div class="max-w-4xl mx-auto">
        <article class="prose prose-lg max-w-none">
          <div v-if="article?.codepodcast" class="mb-8" v-html="article.codepodcast"></div>
          <p v-html="article?.content" class="whitespace-pre-line"></p>
        </article>

        <!-- Tags -->
        <div class="mt-12 flex flex-wrap gap-2">
          <span
            v-for="tag in (article?.etiquettes || '').split(',')"
            :key="tag"
            class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
          >
            {{ tag.trim() }}
          </span>
        </div>
        <div class="w-full rounded-lg">
          <NewsletterSignup />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  showHeader: false
})

const route = useRoute()
const supabase = useSupabaseClient()

const article = ref(null)
const author = ref(null)
const allPosts = ref(null)
const error = ref(null)

// Charger l'article et les informations de l'auteur
const fetchArticle = async () => {
  try {
    // Récupérer l'article
    const { data: articleData, error: articleError } = await supabase
      .from('blog')
      .select('*')
      .eq('slug', route.params.slug)
      .single()

    if (articleError) throw articleError
    article.value = articleData

    // Récupérer tous les articles actifs pour le maillage interne
    const { data: postsData, error: postsError } = await supabase
      .from('blog')
      .select('id, title, slug, date, categories, etiquettes, image_url')
      .eq('actif', true)
      .eq('public', true)
      .order('date', { ascending: false })

    if (postsError) throw postsError
    allPosts.value = postsData

  } catch (err) {
    console.error('Erreur lors du chargement de l\'article:', err)
    error.value = 'Impossible de charger l\'article'
  }
}

// Charger l'article au montage
onMounted(fetchArticle)

// Mettre à jour le titre de la page
useHead(() => ({
  title: article.value?.title ? `${article.value.title} | GRINCH` : 'Article | GRINCH',
  meta: [
    {
      name: 'description',
      content: article.value?.meta_description || 'Article du blog GRINCH'
    }
  ]
}))
</script>
<style>
iframe {
  margin-bottom: 20px;
}
</style>