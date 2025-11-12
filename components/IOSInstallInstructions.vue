<template>
  <div v-if="isVisible" class="ios-install-instructions p-4">
    <p class="text-sm uppercase text-blue-800 font-semibold mb-4">Installer sur votre iPhone</p>
    <ol class="flex gap-2 flex-col pb-5">
      <li class="text-sm text-blue-800 flex justify-start items-center">
        1 - Appuyez sur le bouton de partage 
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-share-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1" />
            <path d="M12 14v-11" />
            <path d="M9 6l3 -3l3 3" />
          </svg>
        </span> 
        en bas de votre navigateur</li>
      <li class="text-sm text-blue-800">2 - Faites défiler et appuyez sur "Ajouter à l'écran d'accueil" <span class="icon">&#x2795;</span></li>
      <li class="text-sm text-blue-800">3 - Appuyez sur "Ajouter" en haut à droite</li>
    </ol>
    <button @click="closeInstructions" class="p-2 border border-blue-800 text-sm w-full text-blue-800 rounded-lg">J'ai compris</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isVisible = ref(true)

const closeInstructions = () => {
  isVisible.value = false
}
const openInstructions = () => {
  isVisible.value = true
}

defineExpose({ isVisible, openInstructions, closeInstructions })
</script>

<style>

</style>