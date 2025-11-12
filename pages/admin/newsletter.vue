<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import Loader from '@/components/Loader.vue';

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isOwner = ref(false)
const isLoading = ref(true)
const ownedBoutiques = ref([])
const newsletters = ref([])

definePageMeta({
  showHeader: false,
  showNavbar: false
})

const fetchnewsletters = async () => {
 isLoading.value = true
 try {
   const { data } = await supabase
     .from('newsletters')
     .select('*')
     .order('created_at', { ascending: false })
   
   newsletters.value = data
 } finally {
   isLoading.value = false
 }
}
onMounted(fetchnewsletters)
onMounted(async () => {
  if (user.value) {
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)

    if (boutiques && boutiques.length > 0) {
      isOwner.value = true
      ownedBoutiques.value = boutiques

      await Promise.all(ownedBoutiques.value.map(fetchBoutiqueData))
    }
  }
  isLoading.value = false
})
</script>

<template>
 <div class="p-4 pb-24">
   <div v-if="isLoading"><Loader /></div>
   <div v-else-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</div>
   <div v-else class="grid gap-4">
     <div v-for="newsletter in newsletters" :key="newsletter.id" class="p-4 border rounded">
      <NuxtLink :to="`/profile/${newsletter.user_id}`">
        <div class="flex flex-wrap justify-start items-center gap-2">
          <p class="font-medium text-blue-800">{{ newsletter.full_name_nl }}</p>
          <span :class="newsletter.share_email ? 'text-blue-800' : 'text-red-600'">
            <svg v-if="newsletter.share_email" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </span>
        </div>
        <p class="text-sm text-zinc-500 font-semibold">{{ newsletter.email }}</p>
        <p class="text-sm text-zinc-500">le  
          {{ new Date(newsletter.created_at).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          }) }}
        </p>
      </NuxtLink>
     </div>
   </div>
 </div>
</template>