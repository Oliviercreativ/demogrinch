import { ref, provide, inject } from 'vue'

const TOAST_SYMBOL = Symbol('toast')

export function provideToast() {
  const toast = ref(null)

  const showToast = (message, type = 'info', duration = 3000) => {
    toast.value = { message, type }
    setTimeout(() => {
      toast.value = null
    }, duration)
  }

  const clearToast = () => {
    toast.value = null
  }

  provide(TOAST_SYMBOL, {
    toast,
    showToast,
    clearToast,
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    info: (message) => showToast(message, 'info'),
  })
}

export function useToast() {
  const toast = inject(TOAST_SYMBOL)
  if (!toast) {
    throw new Error('Toast not provided')
  }
  return toast
}