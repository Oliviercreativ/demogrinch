<template>
 <div v-if="user">
  <div class="relative z-20">
    <div class="fixed bottom-0 left-0 w-full bg-white dark:bg-blue-800 border border-gray-400 p-4 text-center"> 
      <div class="grid grid-cols-4 items-stretch">
        <NuxtLink to="/" :class="linkClasses('/')" class="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-home-heart text-center" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#9ca3af" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M21 12l-9 -9l-9 9h2v7a2 2 0 0 0 2 2h6" />
            <path d="M9 21v-6a2 2 0 0 1 2 -2h2c.39 0 .754 .112 1.061 .304" />
            <path d="M19 21.5l2.518 -2.58a1.74 1.74 0 0 0 0 -2.413a1.627 1.627 0 0 0 -2.346 0l-.168 .172l-.168 -.172a1.627 1.627 0 0 0 -2.346 0a1.74 1.74 0 0 0 0 2.412l2.51 2.59z" />
          </svg>
          <span class="text-sm text-gray-400 text-center">Accueil</span>
        </NuxtLink>        
        <NuxtLink to="/boutiques" :class="linkClasses('/boutiques')" class="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-building-store" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#9ca3af" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 21l18 0" />
            <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4" />
            <path d="M5 21l0 -10.15" />
            <path d="M19 21l0 -10.15" />
            <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
          </svg>
          <span class="text-sm text-gray-400 text-center">Boutiques</span>
        </NuxtLink>
          <NuxtLink to="/cartes-de-fidelite" :class="linkClasses('/cartes-de-fidelite')" class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-heart" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#9ca3af" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
            </svg>
            <span class="text-sm text-gray-400 text-center">Fidélité</span>
        </NuxtLink>
        <NuxtLink v-if="user" to="/profil" :class="linkClasses('/profil')" class="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-hexagon" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#9ca3af" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 13a3 3 0 1 0 0 -6a3 3 0 0 0 0 6z" />
            <path d="M6.201 18.744a4 4 0 0 1 3.799 -2.744h4a4 4 0 0 1 3.798 2.741" />
            <path d="M19.875 6.27c.7 .398 1.13 1.143 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z" />
          </svg>
          <span class="text-sm text-gray-400 text-center">Profil</span>
        </NuxtLink>
        <NuxtLink v-else to="/login" :class="linkClasses('/login')" class="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-power" width="26" height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#9ca3af" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M7 6a7.75 7.75 0 1 0 10 0" />
            <path d="M12 4l0 8" />
          </svg>
          <span class="text-sm text-gray-400 text-center">Connexion</span>
        </NuxtLink>
      </div>
    </div>
  </div>  
</div>
</template>

<script setup>
  import { useRoute } from 'vue-router'
  import { useSupabaseUser } from '#imports'

  const route = useRoute()
  const user = useSupabaseUser()

  const isActivePage = (path) => route.path === path
  const linkClasses = (path) => {
  const isActive = route.path === path
  return {
    'text-blue-800': isActive,
    'text-gray-500': !isActive,
    'flex flex-col items-center': true
  }
}
</script>

<style>
.router-link-active svg {
  stroke: rgb(30 64 175 / var(--tw-text-opacity));
}
.router-link-active span {
  color: rgb(30 64 175 / var(--tw-text-opacity)) !important;
}
</style>