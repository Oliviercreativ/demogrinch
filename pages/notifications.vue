<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useProfileCheck } from '@/composables/useProfileCheck'
import Loader from '@/components/Loader.vue'

definePageMeta({
showHeader: false,
showNavbar: false,
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()
const { checkProfile } = useProfileCheck()

const isLoading = ref(true)
const error = ref(null)
const rewards = ref([])
const boutiques = ref({})
const userOwnedBoutiques = ref([])
const messages = ref([])
const globalMessages = ref([])
const activeTab = ref('messages') // 'messages' ou 'recompenses'

const processedRewards = computed(() => {
return rewards.value.map(reward => ({
  ...reward,
  boutiqueName: boutiques.value[reward.store_slug]?.name_shop,
  userName: reward.profiles?.full_name || 'Utilisateur inconnu',
  isOwner: userOwnedBoutiques.value.includes(reward.store_slug),
  isAvailable: !reward.is_used,
  lot: boutiques.value[reward.store_slug]?.lot
}))
})

// Fusionner messages personnels et globaux, triés par priorité et date
const allMessages = computed(() => {
  const personal = messages.value.map(msg => ({
    ...msg,
    is_global: false,
    priority: 0,
    type: 'personal'
  }))
  
  const global = globalMessages.value.map(msg => ({
    ...msg,
    type: 'global'
  }))
  
  return [...personal, ...global].sort((a, b) => {
    // Non lus en premier
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1
    }
    // Puis par priorité (messages globaux)
    if (a.priority !== b.priority) {
      return (b.priority || 0) - (a.priority || 0)
    }
    // Puis par date
    const dateA = new Date(a.publish_at || a.created_at)
    const dateB = new Date(b.publish_at || b.created_at)
    return dateB - dateA
  })
})

const fetchRewardsAndBoutiques = async () => {
if (!user.value) return

try {
  const [boutiquesData, ownedBoutiquesData, rewardsData] = await Promise.all([
    supabase.from('boutique').select('*'),
    supabase.from('boutique').select('slug').eq('owner', user.value.id),
    supabase.from('reward')
      .select(`*, profiles:user_uid_reward (id, full_name)`)
      .eq('user_uid_reward', user.value.id)
      .eq('is_read', false)
      .order('hit_date', { ascending: false })
  ])

  if (boutiquesData.error) throw boutiquesData.error
  if (ownedBoutiquesData.error) throw ownedBoutiquesData.error
  if (rewardsData.error) throw rewardsData.error

  boutiques.value = Object.fromEntries(
    boutiquesData.data.map(boutique => [boutique.slug, boutique])
  )
  userOwnedBoutiques.value = ownedBoutiquesData.data.map(b => b.slug)
  rewards.value = rewardsData.data.filter(reward => 
    reward.new_solde >= (boutiques.value[reward.store_slug]?.limite || Infinity)
  )
} catch (e) {
  console.error('Error fetching rewards and boutiques:', e)
  error.value = `Impossible de charger les données: ${e.message}`
} finally {
  isLoading.value = false
}
}

const markAsUsed = async (rewardId) => {
try {
  const { error } = await supabase
    .from('reward')
    .update({ is_used: true })
    .eq('id', rewardId)

  if (error) throw error

  rewards.value = rewards.value.map(r => 
    r.id === rewardId ? { ...r, is_used: true } : r
  )
} catch (e) {
  console.error('Error marking reward as used:', e)
}
}

onMounted(async () => {
await checkProfile()
const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
if (authError || !authUser) {
  router.push('/')
  return
}
await fetchRewardsAndBoutiques()
})

const fetchRewardsAndBoutiquesAndMessages = async () => {
if (!user.value) return

try {
  const [boutiquesData, ownedBoutiquesData, rewardsData, messagesData, globalMessagesData, readGlobalMessages] = await Promise.all([
    supabase.from('boutique').select('*'),
    supabase.from('boutique').select('slug').eq('owner', user.value.id),
    supabase.from('reward')
      .select(`*, profiles:user_uid_reward (id, full_name)`)
      .eq('user_uid_reward', user.value.id)
      .eq('is_read', false)
      .order('hit_date', { ascending: false }),
    supabase.from('user_messages')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false }),
    // Messages globaux publiés
    supabase.from('global_messages')
      .select('*')
      .eq('is_published', true)
      .lte('publish_at', new Date().toISOString())
      .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),
    // Messages globaux déjà lus par cet utilisateur
    supabase.from('global_messages_read')
      .select('global_message_id')
      .eq('user_id', user.value.id)
  ])

  if (boutiquesData.error) throw boutiquesData.error
  if (ownedBoutiquesData.error) throw ownedBoutiquesData.error
  if (rewardsData.error) throw rewardsData.error

  boutiques.value = Object.fromEntries(
    boutiquesData.data.map(boutique => [boutique.slug, boutique])
  )
  userOwnedBoutiques.value = ownedBoutiquesData.data.map(b => b.slug)
  rewards.value = rewardsData.data.filter(reward => 
    reward.new_solde >= (boutiques.value[reward.store_slug]?.limite || Infinity)
  )

  messages.value = messagesData.data || []
  
  // Marquer les messages globaux comme lus ou non
  const readMessageIds = new Set((readGlobalMessages.data || []).map(r => r.global_message_id))
  globalMessages.value = (globalMessagesData.data || []).map(msg => ({
    ...msg,
    is_read: readMessageIds.has(msg.id),
    is_global: true
  }))

} catch (e) {
  console.error('Error fetching data:', e)
  error.value = `Impossible de charger les données: ${e.message}`
} finally {
  isLoading.value = false
}
}

// Modifier onMounted pour utiliser la nouvelle fonction
onMounted(async () => {
await checkProfile()
const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
if (authError || !authUser) {
  router.push('/')
  return
}
await fetchRewardsAndBoutiquesAndMessages()
})

const goToMessage = (message) => {
  const type = message.type || 'personal'
  router.push(`/messages/${message.id}?type=${type}`)
}

// Fonction pour nettoyer le HTML
const stripHtml = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
</script>

<template>
<div class="mx-auto max-w-2xl">
  <div class="pb-24 bg-white">
    <div class="p-4">
      <Loader v-if="isLoading" />
      <template v-else-if="user">
        <p class="text-lg uppercase text-blue-800 font-semibold mb-4">
          Notifications
        </p>

        <!-- Onglets -->
        <div class="flex gap-2 mb-4 border-b border-gray-200">
          <button 
            @click="activeTab = 'messages'"
            :class="[
              'px-4 py-2 font-medium transition-colors relative',
              activeTab === 'messages' 
                ? 'text-blue-800 border-b-2 border-blue-800' 
                : 'text-gray-600 hover:text-blue-800'
            ]"
          >
            📬 Messagerie
            <span v-if="allMessages && allMessages.filter(m => !m.is_read).length > 0" 
                  class="ml-1 bg-blue-800 text-white text-xs px-2 py-0.5 rounded-full">
              {{ allMessages.filter(m => !m.is_read).length }}
            </span>
          </button>
          <button 
            @click="activeTab = 'recompenses'"
            :class="[
              'px-4 py-2 font-medium transition-colors relative',
              activeTab === 'recompenses' 
                ? 'text-blue-800 border-b-2 border-blue-800' 
                : 'text-gray-600 hover:text-blue-800'
            ]"
          >
            🎁 Récompenses
            <span v-if="processedRewards.length > 0" 
                  class="ml-1 bg-blue-800 text-white text-xs px-2 py-0.5 rounded-full">
              {{ processedRewards.length }}
            </span>
          </button>
        </div>

        <!-- Contenu Messages -->
        <div v-if="activeTab === 'messages'">
          <div v-if="allMessages && allMessages.length > 0">
          <p class="text-md font-medium text-gray-600 mb-2">Messages</p>
          <div v-for="message in allMessages" 
                :key="`${message.type}-${message.id}`" 
                @click="goToMessage(message)"
                class="rounded-lg p-4 mb-4 cursor-pointer "
                :class="[
                  !message.is_read ? 'border-2 border-blue-800' : 'bg-white'
                ]">
            <div class="flex justify-start items-center gap-5">
              <!-- Icon selon le type de message -->
              <div v-if="message.type === 'global'" class="text-3xl">
                {{ message.icon || '📢' }}
              </div>
              <svg v-else
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-12 w-12 text-blue-800" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor">
                <path stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="1" 
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              
              <div class="flex flex-col flex-grow">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <!-- Badge type de message -->
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
                  
                  <!-- Badge non lu -->
                  <span v-if="!message.is_read" class="bg-blue-800 text-white text-xs px-2 py-0.5 rounded-full">
                    Non lu
                  </span>
                  
                  <!-- Badge priorité pour messages globaux -->
                  <span v-if="message.type === 'global' && message.priority > 0"
                        :class="[
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          message.priority === 2 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        ]">
                    {{ message.priority === 2 ? '⚠️ Urgent' : '📌 Important' }}
                  </span>
                </div>
                
                <!-- Titre pour messages globaux -->
                <p v-if="message.type === 'global'" class="text-md font-medium text-blue-800 mb-1">
                  {{ message.title }}
                </p>
                
                <!-- Contenu du message -->
                <p class="text-sm text-gray-600 line-clamp-2">
                  {{ stripHtml(message.message) }}
                </p>
                
                <!-- Date -->
                <p class="text-xs text-gray-500 mt-1">
                  {{ message.type === 'global' ? 'Publié' : 'Reçu' }} le {{ new Date(message.publish_at || message.created_at).toLocaleDateString() }}
                </p>
              </div>
            </div>
          </div>
          </div>

          <!-- Message si aucun message -->
          <p v-else class="text-center text-gray-500 py-8">
            Vous n'avez aucun message pour le moment.
          </p>
        </div>

        <!-- Contenu Récompenses -->
        <div v-if="activeTab === 'recompenses'">
          <div v-if="processedRewards.length > 0">
          <p class="text-md font-medium text-gray-600 mb-2">Récompenses disponibles</p>
          <div v-for="reward in processedRewards" :key="reward.id" class="bg-white rounded-lg p-4 mb-4">
            <div class="flex justify-start items-center gap-5">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-check" width="48" height="48" viewBox="0 0 24 24" stroke-width="1" :stroke="reward.is_used ? '#1e40af' : '#F4F4F4'" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M9 12l2 2l4 -4" />
              </svg>
              <div class="flex flex-col">
                <p class="text-md uppercase font-medium text-blue-800">{{ reward.isOwner ? reward.userName : reward.boutiqueName }}</p>
                <p v-if="!reward.isOwner" class="text-sm" :class="reward.is_used ? 'text-blue-800 font-medium' : 'text-red-800'">
                  {{ reward.is_used ? 'Récompense utilisée' : 'Récompense disponible !' }}
                </p>
                <p class="text-sm text-gray-500" :class="reward.isOwner ? 'font-semibold' : 'font-normal'">{{ reward.lot }}</p>
                <p class="text-sm text-gray-500">Obtenue le {{ new Date(reward.hit_date).toLocaleDateString() }}</p>
                <button 
                  v-if="reward.isOwner && !reward.is_used" 
                  @click="markAsUsed(reward.id)"
                  class="mt-2 px-3 py-1 bg-blue-800 text-white rounded text-md"
                >
                  Marquer comme utilisé
                </button>
              </div>
            </div>
          </div>
          </div>

          <!-- Message si aucune récompense -->
          <p v-else class="text-center text-gray-500 py-8">
            Vous n'avez aucune récompense pour le moment.
          </p>
        </div>
      </template>
    </div>
  </div>
</div>
</template>