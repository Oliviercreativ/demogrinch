<template>
  <div>
    <button @click="showConfirmation = true" class="text-red-600 hover:text-red-800">
      Désactiver mon compte
    </button>

    <!-- Modal de confirmation -->
    <div v-if="showConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-medium mb-4">Confirmer la désactivation du compte</h2>
        <p class="mb-4">Êtes-vous sûr de vouloir désactiver votre compte ? Vous ne pourrez plus vous connecter après cette action.</p>
        <div class="flex justify-end">
          <button @click="showConfirmation = false" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">
            Annuler
          </button>
          <button @click="deactivateAccount" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Confirmer la désactivation
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRouter } from 'vue-router'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const showConfirmation = ref(false)
const error = ref(null)

const deactivateAccount = async () => {
  if (!user.value) return

  try {
    error.value = null

    // Appel à la fonction serverless pour désactiver le compte
    const { data, error: deactivateError } = await useFetch('/api/deactivate-account', {
      method: 'POST',
      body: JSON.stringify({ userId: user.value.id })
    })

    if (deactivateError) throw deactivateError

    // Déconnexion de l'utilisateur
    await supabase.auth.signOut()

    // Redirection vers la page d'accueil
    router.push('/')
  } catch (err) {
    console.error('Erreur lors de la désactivation du compte:', err)
    error.value = err.message
  } finally {
    showConfirmation.value = false
  }
}
</script>