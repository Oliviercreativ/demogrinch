<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userName = ref('')
const greeting = ref('')
const visitCount = ref(0)
const isLoading = ref(true)

// Liste des messages pour les visiteurs réguliers (2+ visites)
const regularGreetings = [
  "ravi de vous revoir",
  "content de vous retrouver",
  "heureux de vous accueillir",
  "c'est un plaisir de vous retrouver",
  "bon retour parmi nous"
]

// Choisir un message selon le nombre de visites
const getGreeting = (visits) => {
  if (visits === 0) return "Bienvenue"
  if (visits === 1) return "Bonjour"
  
  const randomIndex = Math.floor(Math.random() * regularGreetings.length)
  return regularGreetings[randomIndex]
}

const fetchUserInfo = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, visit_count')
      .eq('id', user.value.id)
      .single()

    if (error) throw error

    userName.value = data.full_name
    visitCount.value = data.visit_count || 0
    greeting.value = getGreeting(visitCount.value)

  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (user.value) {
    await fetchUserInfo()
  }
})
</script>

<template>
  <div class="">
    <div v-if="!isLoading" class="max-w-2xl mx-auto text-left pr-14">
      <p class="text-md md:text-md font-normal text-blue-800">
        Bonjour, {{ greeting }}
        <span v-if="userName" class="block text-blue-800 font-medium">
          {{ userName }}
        </span>
      </p>
    </div>
  </div>
</template>