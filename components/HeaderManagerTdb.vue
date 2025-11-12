<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const isManager = ref(false)

onMounted(async () => {
  await checkIfManager()
})

const checkIfManager = async () => {
  const { data, error } = await supabase
    .from('boutique')
    .select()
    .eq('manager_id', user.value?.id)
    .single()

  if (!error && data) {
    isManager.value = true
  }
}
</script>

<template>
    <div v-if="isManager">
      <NuxtLink to="/manager" class="flex items-center justify-center p-1 gap-3 text-xs font-semibold bg-blue-800 text-white uppercase dark:text-white hover:underline">
        tableau de bord
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-right stroke-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 12l14 0" />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </svg>
      </NuxtLink>
    </div>
</template>