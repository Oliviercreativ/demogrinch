<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRouter } from 'vue-router'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const messages = ref([])
const isLoading = ref(true)

// Récupérer tous les messages de l'utilisateur
const fetchMessages = async () => {
  if (!user.value) return
  
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('user_messages')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    messages.value = data || []
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
  } finally {
    isLoading.value = false
  }
}

// Messages non lus et lus séparés
const unreadMessages = computed(() => 
  messages.value.filter(msg => !msg.is_read)
)

const readMessages = computed(() => 
  messages.value.filter(msg => msg.is_read)
)

// Formater la date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Aller vers le détail du message
const goToMessage = (messageId) => {
  router.push(`/messages/${messageId}?type=personal`)
}

onMounted(() => {
  if (user.value) {
    fetchMessages()
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Loader -->
    <div v-if="isLoading" class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Aucun message -->
    <div v-else-if="messages.length === 0" class="bg-white rounded-lg shadow-md p-6 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-600 font-medium">Aucun message pour le moment</p>
      <p class="text-gray-500 text-sm mt-1">Vos messages apparaîtront ici</p>
    </div>

    <!-- Messages non lus -->
    <div v-if="unreadMessages.length > 0" class="space-y-3">
      <h3 class="text-lg font-semibold text-gray-800 px-2">
        📬 Messages non lus ({{ unreadMessages.length }})
      </h3>
      
      <div 
        v-for="message in unreadMessages" 
        :key="message.id"
        @click="goToMessage(message.id)"
        class="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-500"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Badge non lu -->
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ● Non lu
              </span>
              <span v-if="message.boutique_slug" class="text-xs text-gray-500">
                {{ message.boutique_slug }}
              </span>
            </div>
            
            <!-- Message -->
            <p class="text-gray-800 text-sm leading-relaxed mb-2">
              {{ message.message }}
            </p>
            
            <!-- Date -->
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatDate(message.created_at) }}
            </div>
            
            <!-- Date d'expiration -->
            <div v-if="message.expiry_date" class="flex items-center gap-2 text-xs text-orange-600 mt-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Expire le {{ new Date(message.expiry_date).toLocaleDateString('fr-FR') }}
            </div>
          </div>
          
          <!-- Flèche -->
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" 
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                  clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Messages lus -->
    <div v-if="readMessages.length > 0" class="space-y-3">
      <h3 class="text-lg font-semibold text-gray-800 px-2">
        ✅ Messages lus ({{ readMessages.length }})
      </h3>
      
      <div 
        v-for="message in readMessages" 
        :key="message.id"
        @click="goToMessage(message.id)"
        class="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow opacity-75"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Badge lu -->
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                ✓ Lu
              </span>
              <span v-if="message.boutique_slug" class="text-xs text-gray-500">
                {{ message.boutique_slug }}
              </span>
            </div>
            
            <!-- Message -->
            <p class="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-2">
              {{ message.message }}
            </p>
            
            <!-- Date -->
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatDate(message.created_at) }}
            </div>
          </div>
          
          <!-- Flèche -->
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" 
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                  clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

