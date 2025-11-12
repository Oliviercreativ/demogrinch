<script setup>
import NotificationHandler from '@/components/NotificationHandler.vue';
useHead({
  title: 'Notification',
});
definePageMeta({
  showHeader: false,
  showNavbar: false,
  showAdminbar: false,
  showSidebar: false,
  middleware: ['auth']
})
</script>
<template>
  <div class="p-4 space-y-6">
    <h1 class="text-2xl mb-4 font-bold text-blue-800 dark:text-white">Test des notifications</h1>
    
    <!-- ⭐ NOUVEAU : Toggle simple sur une ligne -->
    <div>
      <h2 class="text-lg font-semibold mb-2 text-blue-800 dark:text-white">Toggle Simple</h2>
      <NotificationToggle />
    </div>

    <hr class="border-gray-300">

    <!-- Autres composants de test -->
    <div>
      <h2 class="text-lg font-semibold mb-2 text-blue-800 dark:text-white">Autres composants</h2>
      <div class="space-y-4">
        <NotificationSubscribe />
        <NotificationButton />
      </div>
    </div>
  </div>
</template> 