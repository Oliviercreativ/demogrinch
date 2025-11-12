<template>
  <div class="bg-white shadow-sm h-[250px] rounded-lg">
    <div class="relative rounded-lg">
      <NuxtLink 
        :to="halloweenLink" 
        target="_blank" 
        class="flex mt-2 text-sm font-medium rounded-lg hover:underline w-full"
      >
        <img 
          src="https://uqhcrdxcnkxghdmvxoxv.supabase.co/storage/v1/object/public/image/bonplan/bonplan-1760752880784.webp" 
          alt="Fêtons Halloween avec un photobooth" 
          class="w-full h-full object-cover object-center rounded-lg"
        >
        
        <div class="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center rounded-lg">
          <div class="p-6 text-orange-500 flex flex-col justify-start items-start gap-2 relative">
            <p class="font-bold text-lg">
              Fêtons Halloween avec le photobooth
            </p>
            <p class="text-sm text-gray-200">
              Prenez-vous en photo avec l'ambiance d'Halloween parmis 20 effets du 18 octobre au 2 novembre
            </p>
            <p class="text-sm text-gray-200">
              En savoir plus
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { useSupabaseClient, useSupabaseUser } from '#imports'
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const halloweenLink = ref('https://halloween.grinch.fr')

onMounted(async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        halloweenLink.value = `https://halloween.grinch.fr/auth?token=${session.access_token}&refresh_token=${session.refresh_token}`
    }
})
</script>

