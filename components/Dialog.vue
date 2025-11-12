<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['update:isOpen'])

const dialogContent = ref(null)
const closeButton = ref(null)

const closeDialog = () => {
  emit('update:isOpen', false)
}

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    closeDialog()
  }
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      closeButton.value?.focus()
    })
  }
})

</script>
<template>
  <Transition name="fade">
    <div v-if="isOpen" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-content relative" ref="dialogContent" @click.stop>
        <button @click="closeDialog" ref="closeButton" class="absolute top-2 right-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-square-x stroke-blue-800" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#166534" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
            <path d="M9 9l6 6m0 -6l-6 6" />
          </svg>
        </button>
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>


<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>