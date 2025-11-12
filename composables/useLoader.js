import {inject, ref} from 'vue'

export function useLoader(timeout = 30000) {
  // 30 secondes par défaut
  const isLoading = inject('isLoading', ref(false))
  let timeoutId = null

  const showLoader = () => {
    isLoading.value = true
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      hideLoader()
      console.warn('Le chargement a été annulé après un timeout')
    }, timeout)
  }

  const hideLoader = () => {
    isLoading.value = false
    clearTimeout(timeoutId)
  }

  return {
    isLoading,
    showLoader,
    hideLoader
  }
}
