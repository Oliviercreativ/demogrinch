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
    <div>
      <div v-if="isOwner">
          <div class="rounded-lg p-3 bg-white dark:bg-white">
            <div class="flex flex-col">
            <button class="bg-white border border-blue-800 px-6 py-3 rounded">
              <NuxtLink to="/admin/" class="text-xs font-semibold text-blue-800 uppercase dark:text-white hover:underline">Votre tableau de bord</NuxtLink>
            </button>
            </div>
        </div>
      </div>
  </div>
</template>