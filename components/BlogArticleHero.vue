<template>
  <section class="relative py-32 h-96 bg-gray-900 text-white">
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-10"></div>
      <img :src="image" :alt="title" class="w-full h-full object-cover" />
    </div>
    <div class="container relative z-20">
      <div class="max-w-7xl">
        <h1 class="text-3xl md:text-5xl font-bold mb-6">{{ title }}</h1>
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-300">{{ formatDate(date) }}</div>
          </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: String,
  image: String,
  date: String,
  categories: String
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>