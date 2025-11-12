<script setup>
import Loader from './Loader.vue'
</script>

<template>
  <div class="overflow-hidden sm:rounded-lg shadow-lg w-full">
    <div v-if="isLoading" class="text-center">
      <p class="text-gray-500">
        <Loader />
      </p>
    </div>
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    <div v-else ref="statsContainer" class="flex gap-6 flex-col justify-center align-top shadow-lg">
      <div class="mt-3 w-full mx-auto p-4 bg-white rounded-lg shadow-md">
        <NuxtLink to="/scanner" class="flex flex-wrap justify-start items-center gap-5">
          <div class="bg-blue-800 rounded-full p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
              class="lucide lucide-qr-code stroke-white">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
          </div>
          <div>
            <p class="text-blue-800 text-left text-lg font-semibold">Scanner le QRCODE</p>
            <p class="text-blue-800 text-left">après votre achat.</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>