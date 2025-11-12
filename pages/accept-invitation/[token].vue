<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useRouter } from '#imports'

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref(null)
const invitation = ref(null)

const acceptInvitation = async () => {
  try {
    loading.value = true

    // Vérifier si l'invitation existe et est valide
    const { data: inviteData, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', route.params.token)
      .single()

    if (inviteError || !inviteData) {
      throw new Error('Invitation invalide ou expirée')
    }

    if (inviteData.status === 'accepted') {
      throw new Error('Cette invitation a déjà été utilisée')
    }

    // Créer le compte utilisateur
    const { error: signUpError } = await supabase.auth.signUp({
      email: inviteData.email,
      password: document.getElementById('password').value,
    })

    if (signUpError) throw signUpError

    // Mettre à jour le statut de l'invitation
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', route.params.token)

    if (updateError) throw updateError

    // Rediriger vers la page de succès
    router.push('/registration-success')

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Vérifier l'invitation au chargement
onMounted(async () => {
  try {
    const { data, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', route.params.token)
      .single()

    if (inviteError || !data) {
      throw new Error('Invitation invalide ou expirée')
    }

    invitation.value = data

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl">
      <!-- Loading state -->
      <div v-if="loading" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center">
        <div class="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {{ error }}
        </div>
        <NuxtLink to="/" class="text-blue-600 hover:underline">
          Retour à l'accueil
        </NuxtLink>
      </div>

      <!-- Form -->
      <div v-else>
        <div class="text-center">
          <h2 class="text-3xl font-bold text-blue-800 mb-2">
            Bienvenue !
          </h2>
          <p class="text-gray-600 mb-8">
            Vous avez été invité à rejoindre l'application.
          </p>
        </div>

        <form @submit.prevent="acceptInvitation" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              :value="invitation.email"
              disabled
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Choisissez un mot de passe"
            >
          </div>

          <button
            type="submit"
            class="w-full bg-blue-800 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer mon compte
          </button>
        </form>

        <p class="mt-4 text-sm text-gray-600 text-center">
          Déjà un compte ? 
          <NuxtLink to="/login" class="text-blue-600 hover:underline">
            Connectez-vous
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>