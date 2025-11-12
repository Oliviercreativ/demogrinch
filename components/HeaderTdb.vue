<script setup>
import { useSupabaseUser, useSupabaseClient } from '#imports'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const users = ref([])
const isOwner = ref(false)


onMounted(async () => {
  if (user.value) {
    const { data, error } = await supabase
      .from('boutique')
      .select('id')
      .eq('owner', user.value.id)
      .limit(1)

    if (data && data.length > 0) {
      isOwner.value = true
    }
  }
})
</script>

<template>
    <div v-if="isOwner">
      <NuxtLink to="/admin/" class="flex items-center justify-center p-1 gap-3 text-xs font-semibold bg-blue-800 text-white uppercase dark:text-white hover:underline">
        tableau de bord
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-right stroke-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 12l14 0" />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </svg>
      </NuxtLink>
    </div>
    <div v-else>
      <NuxtLink to="#" class="flex items-center justify-center text-center text-balance p-1 gap-3 text-xs font-semibold bg-blue-800 text-white uppercase dark:text-white">
        Les données de ce site sont issue de la plateforme MadeinConflans
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-right stroke-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 12l14 0" />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </svg>
      </NuxtLink>
    </div>
</template>