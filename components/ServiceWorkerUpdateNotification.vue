<!-- components/ServiceWorkerUpdateNotification.vue -->
<template>
  <div v-if="showUpdateNotification" class="fixed top-0 left-0 w-full bg-blue-800 text-white p-4">
    <div class="flex justify-between items-center">
      <p>Une nouvelle version de l'application est disponible.</p>
      <button @click="reloadPage" class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
        Recharger
      </button>
    </div>
  </div>
</template>

<script setup>
const showUpdateNotification = useState('updateNotification', () => false)

const reloadPage = () => {
  window.location.reload()
}
</script>