<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  scanUid: {
    type: String,
    required: true
  },
  shopName: {
    type: String,
    default: ''
  }
})

const qrCodeUrl = computed(() => {
  if (!props.scanUid) return ''
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/boutique/${props.scanUid}`
})

const handleButtonClick = () => {
  if (props.scanUid) {
    navigateTo(`/boutique/${props.scanUid}`)
  }
}
</script>

<template>
  <div v-if="scanUid" class="bg-white w-full flex flex-col items-center justify-center gap-4 rounded-lg p-6">
    <p class="text-lg uppercase font-semibold text-blue-800 text-center">
      Scanner pour ajouter un point de fidélité
    </p>

    <div class="flex justify-center items-center p-4 bg-white rounded-lg">
      <qrcode-vue :value="qrCodeUrl" :size="200" level="H" />
    </div>

    <p class="text-sm text-gray-600 text-center max-w-sm">
      Scannez ce QR code avec votre téléphone ou cliquez sur le bouton ci-dessous pour ajouter un point de fidélité à {{
        shopName || 'cette boutique' }}
    </p>

    <button @click="handleButtonClick"
      class="w-full max-w-xs bg-blue-800 text-white py-2 px-4 text-sm font-normal rounded-lg flex items-center justify-center gap-2">
      <span>Ajouter un point</span>
    </button>
  </div>
</template>

