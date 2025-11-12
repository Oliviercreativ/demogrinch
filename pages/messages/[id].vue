<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const message = ref(null)
const isLoading = ref(true)
const messageType = ref('personal')

const fetchMessage = async () => {
  if (!user.value) {
    router.push('/login')
    return
  }

  try {
    messageType.value = route.query.type || 'personal'
    
    if (messageType.value === 'global') {
      // Message global
      const { data } = await supabase
        .from('global_messages')
        .select('*')
        .eq('id', route.params.id)
        .single()

      if (!data) {
        router.push('/notifications')
        return
      }

      message.value = { ...data, type: 'global' }

      // Marquer comme lu dans global_messages_read
      const { data: existingRead } = await supabase
        .from('global_messages_read')
        .select('id')
        .eq('user_id', user.value.id)
        .eq('global_message_id', data.id)
        .single()

      if (!existingRead) {
        await supabase
          .from('global_messages_read')
          .insert({
            user_id: user.value.id,
            global_message_id: data.id
          })
        
        // Incrémenter le compteur de vues
        await supabase.rpc('increment_message_views', { message_id: data.id })
      }

    } else {
      // Message personnel
      const { data } = await supabase
        .from('user_messages')
        .select('*')
        .eq('id', route.params.id)
        .eq('user_id', user.value.id)
        .single()

      if (!data) {
        router.push('/notifications')
        return
      }

      message.value = { ...data, type: 'personal' }

      // Marquer comme lu
      if (!data.is_read) {
        await supabase
          .from('user_messages')
          .update({ is_read: true })
          .eq('id', data.id)
      }
    }

  } catch (e) {
    console.error('Erreur:', e)
    router.push('/notifications')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchMessage)
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <div v-if="isLoading" class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
    </div>

    <div v-else-if="message" class="bg-white rounded-lg overflow-hidden">
      <!-- En-tête -->
      <div class="bg-white text-white p-4 border-b border-gray-200">
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-3">
            <!-- Icon pour messages globaux -->
            <div v-if="message.type === 'global'" class="text-3xl">
              {{ message.icon || '📢' }}
            </div>
            <h1 class="text-blue-800 text-lg font-semibold">
              {{ message.type === 'global' ? message.title : 'Message' }}
            </h1>
          </div>
          <button @click="router.push('/notifications')" class="text-blue-800 hover:text-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Badges -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Badge type -->
          <span v-if="message.type === 'global'" 
                :class="[
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  message.category === 'urgent' ? 'bg-red-100 text-red-800' :
                  message.category === 'promo' ? 'bg-green-100 text-green-800' :
                  message.category === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                  message.category === 'update' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                ]">
            {{ message.category === 'urgent' ? '🔴 Urgent' :
               message.category === 'promo' ? '🟢 Promo' :
               message.category === 'maintenance' ? '🟠 Maintenance' :
               message.category === 'update' ? '🟡 Mise à jour' :
               '📢 Annonce' }}
          </span>
          <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
            ✉️ Message personnel
          </span>
          
          <!-- Badge priorité -->
          <span v-if="message.type === 'global' && message.priority > 0"
                :class="[
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  message.priority === 2 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                ]">
            {{ message.priority === 2 ? '⚠️ Urgent' : '📌 Important' }}
          </span>
        </div>
        
        <!-- Date -->
        <p class="text-sm text-gray-600 mt-3">
          {{ message.type === 'global' ? 'Publié' : 'Reçu' }} le {{ new Date(message.publish_at || message.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) }}
        </p>
      </div>

      <!-- Image (si message global) -->
      <div v-if="message.type === 'global' && message.image_url" class="px-6 pt-6">
        <img :src="message.image_url" :alt="message.title" class="w-full max-h-80 object-cover rounded-lg" />
      </div>

      <!-- Contenu du message -->
      <div class="p-6">
        <!-- HTML riche pour messages globaux -->
        <div v-if="message.type === 'global'" 
             class="prose prose-sm max-w-none dark:prose-invert"
             v-html="message.message">
        </div>
        
        <!-- Texte simple pour messages personnels -->
        <p v-else class="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">{{ message.message }}</p>
        
        <!-- Lien CTA pour messages globaux -->
        <a v-if="message.type === 'global' && message.link_url"
           :href="message.link_url"
           target="_blank"
           class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          {{ message.link_label || 'Voir plus' }}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div>

      <!-- Pied de page -->
      <div class="bg-gray-50 px-6 py-4">
        <div class="flex justify-between items-center">
          <p v-if="message.expiry_date" class="text-sm text-red-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            Expire le {{ new Date(message.expiry_date).toLocaleDateString('fr-FR') }}
          </p>
          <button @click="router.push('/notifications')" class="text-blue-800 hover:text-blue-600 font-medium transition-colors">
            ← Retour aux notifications
          </button>
        </div>
      </div>
    </div>
  </div>
</template>