<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import Loader from '@/components/Loader.vue'
import ProximityChecker from '@/components/ProximityChecker.vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const isLoading = ref(true)
const router = useRouter()
</script>

<template>
  <div v-if="user" class="">
    <div class="pb-24 bg-gray-100 -mt-10">
      <div class="p-4 mx-auto max-w-2xl">
        <div v-if="isLoading">
          <Loader />
        </div>
        <div v-else>
        <div class="flex justify-start items-start flex-col gap-1 pb-4 w-full">
          <p class="text-blue-800 text-center text-balance w-full">
            <ProximityChecker />
          </p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>