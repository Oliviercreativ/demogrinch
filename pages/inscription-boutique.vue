<script setup>
const user = useSupabaseUser()
const router = useRouter()

definePageMeta({
  showHeader: false,
  showNavbar: false
})

onMounted(async () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }

  // Vérifier si l'utilisateur est déjà owner d'une boutique
  try {
    const { data: boutique, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)
      .single()

    if (boutique) {
      navigateTo('/admin/')
      return
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut owner:', error)
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="max-w-lg w-full space-y-8 p-6 text-center">
      <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-8">
        <svg 
          class="mx-auto h-16 w-16 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <p class="text-lg font-semibold text-blue-800 uppercase">
        Félicitation votre paiement est réussi
      </p>
      <p>Vous pouvez ajouter vos informations pour finaliser votre inscription en remplissant le formulaire ci-dessous.</p>
      <p>Préparez votre logo et une photo de couverture pour votre boutique.</p>
    </div>
    <ShopRegistrationForm />
  </div>
</template>