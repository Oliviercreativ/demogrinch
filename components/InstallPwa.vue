<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import isIOS from './utils/isIOS'
import IOSInstallInstructions from './components/IOSInstallInstructions.vue'

const { $pwa } = useNuxtApp()
const deferredPrompt = ref(null)
const showInstallButton = ref(false)
const isIOSDevice = ref(false)
const installed = ref(false)
const iosInstructions = ref(null)
const instructionsVisible = ref(false)
const { $pwaUpdate } = useNuxtApp()

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt.value = event;
    showInstallButton.value = true;
  });
});

onMounted(() => {
  isIOSDevice.value = isIOS()
  if (window.matchMedia('(display-mode: standalone)').matches) {
    installed.value = true
  }
})
const toggleIOSInstructions = () => {
  instructionsVisible.value = !instructionsVisible.value
  if (iosInstructions.value) {
    if (instructionsVisible.value) {
      iosInstructions.value.openInstructions()
    } else {
      iosInstructions.value.closeInstructions()
    }
  }
}
</script>

<template>
  <!--
  <div>
    <div v-show="$pwa?.needRefresh">
      <div class="px-2 py-4 bg-blue-800 text-white max-w-full flex items-center justify-center flex-col gap-1">
        <span>Mise à jour de GRINCH</span>
        <button @click="$pwa.updateServiceWorker()">Valider</button>
      </div>
    </div>
  </div>
  <div v-show="$pwa.needRefresh">
    <span>Mise à jour de GRINCH</span>
    <button @click="$pwa.updateServiceWorker()">
      Installer
    </button>
  </div>
  -->
  <ClientOnly>
    <div v-if="isIOSDevice && !installed">
      <button @click="toggleIOSInstructions" class="install-button text-white bg-blue-800 border text-center border-blue-800 rounded-md py-2 px-10 flex items-center justify-center w-full gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-brand-apple stroke-white" width="36" height="36" viewBox="0 0 24 24" stroke-width="1" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M8.286 7.008c-3.216 0 -4.286 3.23 -4.286 5.92c0 3.229 2.143 8.072 4.286 8.072c1.165 -.05 1.799 -.538 3.214 -.538c1.406 0 1.607 .538 3.214 .538s4.286 -3.229 4.286 -5.381c-.03 -.011 -2.649 -.434 -2.679 -3.23c-.02 -2.335 2.589 -3.179 2.679 -3.228c-1.096 -1.606 -3.162 -2.113 -3.75 -2.153c-1.535 -.12 -3.032 1.077 -3.75 1.077c-.729 0 -2.036 -1.077 -3.214 -1.077z" />
          <path d="M12 4a2 2 0 0 0 2 -2a2 2 0 0 0 -2 2" />
        </svg>
        <p class="text-white text-sm text-balance">{{ instructionsVisible ? 'Fermer les instructions' : 'Installer GRINCH sur son iPhone' }}</p>
      </button>
      <IOSInstallInstructions ref="iosInstructions" v-if="instructionsVisible" />
    </div>
    <div v-if="$pwa?.showInstallPrompt && !$pwa?.offlineReady && !$pwa?.needRefresh" role="alert">
      <div class="fixed p-4 mx-auto max-w-2xl top-0 -left-1 bg-white z-30 p-4 h-[100vh]">
        <div class="flex items-center justify-center w-full flex-col gap-3">
          <NuxtImg src="/logo-mic.svg" width="250"></NuxtImg> 
          <div class="message flex flex-col gap-5">
            <p class="text-blue-800 font-bold font-xl text-center">Votre compte a bien été créé</p>
            <p class="text-blue-800 font-bold text-center">Installer <span class="uppercase ">GRINCH</span> sur votre smartphone en moins d'une minute et sans passer par le Store (PlayStore ou AppStore) et profitez de toutes les fonctionnalités de l'application</p>
            <p class="text-gray-500 text-center">Une fois l'application installé sur votre smartphone, recherchez <span class="uppercase text-blue-800 ">GRINCH</span> dans vos applications.</p>
          </div>
          <button @click="$pwa.install()" class="mb-3 w-full rounded-lg bg-blue-800 px-5 py-3 font-normal text-white">
            Installer
          </button>
          <button @click="$pwa.cancelInstall()" class="mb-3 w-full rounded-lg bg-white border border-blue-800 px-5 py-3 font-normal text-blue-800">
            Annuler
          </button>
          <p class="text-sm text-gray-500 text-center">Vous pouvez également ajouter <span class="uppercase text-blue-800 ">GRINCH</span> dans les options de votre navigateur <span class="font-medium">"Ajouter à l'écran d'accueil"</span>.</p>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>