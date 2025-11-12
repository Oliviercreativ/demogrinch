<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({
  middleware: 'owner',
  showHeader: false,
  showNavbar: false,
  showSidebar: false,
  showFooter: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const bonsPlans = ref([])
const isLoading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const currentBonPlan = ref(null)

// Récupérer les bons plans de la boutique de l'utilisateur
const fetchBonsPlans = async () => {
  isLoading.value = true
  
  // D'abord récupérer la boutique de l'utilisateur
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutique')
    .select('id')
    .eq('owner', user.value.id)
    .single()
  
  if (boutiqueError || !boutique) {
    console.error('Erreur: Aucune boutique trouvée pour cet utilisateur')
    isLoading.value = false
    return
  }
  
  // Récupérer les bons plans de cette boutique
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erreur lors du chargement des bons plans:', error)
  } else {
    bonsPlans.value = data || []
  }
  
  isLoading.value = false
}

// Éditer un bon plan
const editBonPlan = (bonPlan) => {
  currentBonPlan.value = bonPlan
  isEditing.value = true
  showModal.value = true
}

// Créer ou modifier un bon plan
const saveBonPlan = async (formData) => {
  const bonPlan = {
    title: formData.title,
    description: formData.description,
    image_url: formData.image_url,
    link_url: formData.link_url,
    start_date: formData.start_date,
    end_date: formData.end_date,
    code_promo: formData.code_promo,
    active: formData.active,
    featured: formData.featured,
    user_id: user.value.id,
    position: formData.type,
    size: 'medium',
    public: true
  }
  
  if (isEditing.value && formData.id) {
    // Mise à jour
    const { error } = await supabase
      .from('banners')
      .update(bonPlan)
      .eq('id', formData.id)
    
    if (error) {
      console.error('Erreur mise à jour:', error)
      alert('❌ Erreur lors de la mise à jour')
    } else {
      alert('✅ Bon plan mis à jour avec succès !')
      await fetchBonsPlans()
      resetForm()
    }
  } else {
    // Création
    const { error } = await supabase
      .from('banners')
      .insert(bonPlan)
    
    if (error) {
      console.error('Erreur création:', error)
      alert('❌ Erreur lors de la création')
    } else {
      alert('✅ Bon plan créé avec succès !')
      await fetchBonsPlans()
      resetForm()
    }
  }
}

// Supprimer un bon plan
const deleteBonPlan = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce bon plan ?')) return
  
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Erreur suppression:', error)
    alert('Erreur lors de la suppression')
  } else {
    alert('Bon plan supprimé !')
    await fetchBonsPlans()
  }
}

// Basculer le statut actif/inactif
const toggleActive = async (bonPlan) => {
  const { error } = await supabase
    .from('banners')
    .update({ active: !bonPlan.active })
    .eq('id', bonPlan.id)
  
  if (error) {
    console.error('Erreur:', error)
  } else {
    await fetchBonsPlans()
  }
}

// Réinitialiser le formulaire
const resetForm = () => {
  currentBonPlan.value = null
  isEditing.value = false
  showModal.value = false
}

// Nouveau bon plan
const createNewBonPlan = () => {
  currentBonPlan.value = null
  isEditing.value = false
  showModal.value = true
}

onMounted(() => {
  fetchBonsPlans()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Mes Bons Plans</h1>
        <p class="text-gray-600 text-sm mt-1">Gérez les promotions de votre boutique</p>
      </div>
      <button 
        @click="createNewBonPlan"
        class="bg-blue-800 text-white px-6 py-2 rounded-lg transition"
      >
        + Nouveau bon plan
      </button>
    </div>

    <!-- Modal -->
    <BonPlanFormModal 
      v-model="showModal"
      :bon-plan="currentBonPlan"
      :is-editing="isEditing"
      @saved="saveBonPlan"
    />

    <!-- Liste des bons plans -->
    <div v-if="isLoading" class="text-center py-8">
      <p class="text-gray-500">Chargement...</p>
    </div>

    <div v-else-if="bonsPlans.length === 0" class="text-center py-8 bg-white rounded-lg shadow p-12">
      <div class="text-6xl mb-4">🏷️</div>
      <p class="text-gray-500 text-lg mb-4">Aucun bon plan pour le moment</p>
      <p class="text-gray-400 text-sm mb-6">Créez votre premier bon plan pour attirer vos clients !</p>
      <button 
        @click="createNewBonPlan"
        class="bg-blue-800 text-white px-6 py-2 rounded-lg transition"
      >
        Créer mon premier bon plan
      </button>
    </div>

    <div v-else class="grid gap-4">
      <BonPlanCard
        v-for="bonPlan in bonsPlans"
        :key="bonPlan.id"
        :bon-plan="bonPlan"
        @edit="editBonPlan"
        @delete="deleteBonPlan"
        @toggle-active="toggleActive"
      />
    </div>
  </div>
</template>
