<template>
  <button
    @click="goBack"
    aria-label="Retour">
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-narrow-left stroke-blue-800" width="44" height="44" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M5 12l14 0" />
      <path d="M5 12l4 4" />
      <path d="M5 12l4 -4" />
    </svg>
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
