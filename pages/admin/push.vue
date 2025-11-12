<template>

</template>
<script setup>
import { useSupabaseClient, useSupabaseUser } from '#imports'
const supabase = useSupabaseClient()
const user = useSupabaseUser()

definePageMeta({
  middleware: 'admin',
  showHeader: false,
  showFooter: false,
  showNavbar: false,
  showSidebar: false
})
</script>