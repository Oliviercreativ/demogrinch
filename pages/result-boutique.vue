// pages/thank-you.vue
<script setup>
definePageMeta({
  showHeader: false
}) 
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-6">
      <div class="text-center">
        <!-- Icône de succès -->
        <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8">
          <svg class="h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 class="text-3xl font-bold text-blue-800 mb-4">
          Merci pour votre inscription !
        </h2>

        <p class="text-gray-600 mb-8">
          Votre boutique a été enregistrée avec succès. Notre équipe va examiner votre demande et vous contactera très prochainement.
        </p>

        <div class="mt-6">
          <p class="text-sm text-gray-500 mb-4">
            Vous recevrez un email de confirmation avec les prochaines étapes à suivre.
          </p>
        </div>

        <div class="space-y-4">
          <NuxtLink to="/" 
            class="w-full flex justify-center py-3 px-4 rounded-md text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retour à l'accueil
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>