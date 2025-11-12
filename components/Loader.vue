<template>
  <div class="loader">
    <div v-if="showSpinner" class="spinner"></div>
    <button v-else @click="reloadPage" class="bg-blue-500 text-white font-bold py-2 px-4 rounded">
      Recharger la page
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showSpinner = ref(true)

onMounted(() => {
  const timer = setTimeout(() => {
    showSpinner.value = false
  }, 30000)

  onUnmounted(() => {
    clearTimeout(timer)
  })
})

const reloadPage = () => {
  window.location.reload()
}
</script>

<style scoped>
.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #1e3a8a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>