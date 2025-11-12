<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <BackButton />
          <h1 class="text-2xl font-bold text-gray-900">Mes messages</h1>
        </div>
        <p class="text-gray-600">Consultez tous vos messages de fidélité et récompenses</p>
      </div>

      <!-- Liste des messages -->
      <MessagesList />
    </div>
  </div>
</template>

