<template>
  <div v-if="user">
    <qrcode-vue :value="qrValue" :size="size" level="H" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useSupabaseUser } from '#imports'

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 200
  }
})

const user = useSupabaseUser()

const qrValue = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/${props.value}`
})
</script>