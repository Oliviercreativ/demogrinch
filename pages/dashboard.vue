<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import Loader from '@/components/Loader.vue'

//const user = useSupabaseUser()
const supabase = useSupabaseClient()
const isLoading = ref(true)
const router = useRouter()

</script>
<template>
  <div class="mx-auto max-w-2xl">
    <div class="pb-24 bg-gray-100 -mt-10">
      <div class="p-4">
        <div v-if="isLoading">
          <Loader />
        </div>
        
      </div>
    </div>
  </div>
</template>
