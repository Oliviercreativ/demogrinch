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
    <NuxtLink to="#" class="flex items-center justify-center text-center text-balance p-1 gap-3 text-xs font-semibold bg-blue-800 text-white uppercase dark:text-white">
      Accès à mon tableau de bord →
    </NuxtLink>
</template>