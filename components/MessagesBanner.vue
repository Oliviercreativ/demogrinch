<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useRouter } from 'vue-router'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const hasMessages = ref(false)
const messageCount = ref(0)

const checkMessages = async () => {
  if (!user.value) return

  try {
    const { count } = await supabase
      .from('user_messages')
      .select('*', { count: 'exact' })
      .eq('user_id', user.value.id)
      .eq('is_read', false)

    messageCount.value = count || 0
    hasMessages.value = count > 0
  } catch (e) {
    console.error('Erreur lors de la vérification des messages:', e)
  }
}

onMounted(() => {
  if (user.value) {
    checkMessages()
  }
})

const goToMessages = () => {
  router.push('/messagerie')
}
</script>

<template>
  <div v-if="hasMessages" 
       @click="goToMessages"
       class="bg-blue-800 text-white p-4 rounded-lg cursor-pointer transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <!-- Icône de message -->
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" 
               class="h-6 w-6" 
               fill="none" 
               viewBox="0 0 24 24" 
               stroke="currentColor">
            <path stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <!-- Badge de notification -->
          <span v-if="messageCount > 1"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {{ messageCount }}
          </span>
        </div>
        
        <div>
          <p class="font-medium">
            {{ messageCount > 1 ? `${messageCount} nouveaux messages` : 'Nouveau message' }}
          </p>
          <p class="text-sm text-blue-200">
            Cliquez pour voir {{ messageCount > 1 ? 'vos messages' : 'votre message' }}
          </p>
        </div>
      </div>

      <!-- Flèche -->
      <svg xmlns="http://www.w3.org/2000/svg" 
           class="h-5 w-5" 
           viewBox="0 0 20 20" 
           fill="currentColor">
        <path fill-rule="evenodd" 
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
              clip-rule="evenodd" />
      </svg>
    </div>
  </div>
</template>

