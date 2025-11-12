<template>
  <div>
    <h1>Liste des utilisateurs</h1>
    <ul>
      <li v-for="user in users" :key="user.id">{{ user.email }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'

const users = ref([])

// Utiliser NuxtApp pour accéder à l'instance Supabase
const { $supabase } = useNuxtApp()

onMounted(async () => {
  if ($supabase) {
    // Récupérer des données depuis Supabase
    const { data, error } = await $supabase.from('users').select('*')
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
    } else {
      users.value = data
    }
  } else {
    console.error('Supabase instance is undefined')
  }
})
</script>
