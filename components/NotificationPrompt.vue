<template>
  <div class="smart-notification-system">
    <!-- Soft Prompt Contextuel -->
    <Transition name="slide-up">
      <div v-if="showSoftPrompt && currentContext"
        class="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-w-sm mx-auto">
        <div class="p-5">
          <div class="flex items-start gap-3">
            <div class="text-2xl">🔔</div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 text-base">
                Recevoir des notifications
              </h3>
              <p class="text-gray-600 text-sm mt-1 leading-relaxed">
                {{ currentContext.message }}
              </p>

              <div class="flex gap-2 mt-4">
                <button @click="handleAccept" :disabled="isLoading"
                  class="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex-1 transition-colors">
                  <span v-if="isLoading" class="inline-block mr-2">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                  {{ currentContext.cta }}
                </button>
                <button @click="handleDecline"
                  class="text-gray-500 px-3 py-2.5 text-sm hover:bg-gray-100 rounded-lg transition-colors">
                  Plus tard
                </button>
              </div>
            </div>
            <button @click="handleDecline" class="text-gray-400 hover:text-gray-600 p-1 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Bouton Discret -->
    <Transition name="fade">
      <button v-if="showDiscreteButton" @click="handleDiscreteClick"
        class="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full z-40 transition-all hover:scale-110"
        title="Activer les notifications">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
    </Transition>

    <!-- Aide navigateur bloqué -->
    <div v-if="showBrowserHelp" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="showBrowserHelp = false">
      <div class="bg-white rounded-xl p-6 max-w-md" @click.stop>
        <h3 class="font-semibold text-lg mb-3">Notifications bloquées</h3>
        <p class="text-gray-600 mb-4">
          Les notifications sont bloquées dans votre navigateur. Pour les réactiver :
        </p>
        <ol class="text-sm text-gray-600 space-y-2 mb-4">
          <li>1. Cliquez sur l'icône 🔒 dans la barre d'adresse</li>
          <li>2. Activez les "Notifications"</li>
          <li>3. Rechargez cette page</li>
        </ol>
        <button @click="showBrowserHelp = false"
          class="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
          Compris
        </button>
      </div>
    </div>

    <!-- Toast de succès -->
    <Transition name="slide-up">
      <div v-if="showSuccessToast"
        class="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg z-50 max-w-sm mx-auto">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p class="font-medium">Notifications activées !</p>
            <p class="text-sm text-green-100">Vous recevrez nos alertes importantes</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const {
  showSoftPrompt,
  showDiscreteButton,
  showBrowserHelp,
  currentContext,
  startEngagementTracking,
  dismissSoftPrompt,
  handlePermissionResult
} = useSmartNotificationPrompt()

const { requestPermission, saveTokenForUser, sendTestNotification } = useFirebaseMessaging()
const user = useSupabaseUser()

const isLoading = ref(false)
const showSuccessToast = ref(false)

onMounted(() => {
  // Démarrer le tracking seulement côté client
  if (process.client) {
    startEngagementTracking()
  }
})

const handleAccept = async () => {
  isLoading.value = true

  try {
    const token = await requestPermission()

    // Sauvegarder le token pour l'utilisateur connecté
    if (user.value && token) {
      await saveTokenForUser(token, user.value.id)
    }

    // Notifier le succès
    handlePermissionResult(true, token)

    // Afficher le toast de succès
    showSuccessToast.value = true
    setTimeout(() => {
      showSuccessToast.value = false
    }, 4000)

    // Envoyer une notification de test après 2 secondes
    setTimeout(() => {
      sendTestNotification()
    }, 2000)

  } catch (error) {
    console.error('Erreur activation notifications:', error)
    handlePermissionResult(false)
  } finally {
    isLoading.value = false
  }
}

const handleDecline = () => {
  dismissSoftPrompt('dismissed')
}

const handleDiscreteClick = () => {
  showDiscreteButton.value = false
  showSoftPrompt.value = true
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>