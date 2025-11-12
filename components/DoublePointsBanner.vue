<!-- components/DoublePointsBanner.vue -->
<template>
  <div v-if="campaignInfo"
    class="bg-gradient-to-r from-yellow-400 to-cyan-500 text-white p-4 rounded-lg mb-6 animate-pulse">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="bg-white bg-opacity-20 rounded-full p-2">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-lg">{{ campaignInfo.name }}</h3>
          <p class="text-sm opacity-90">
            Points x2 sur tous vos achats !
          </p>
        </div>
      </div>
      <div class="text-right">
        <div class="bg-white bg-opacity-20 rounded-full px-3 py-1">
          <span class="text-xs font-bold">
            ACTIF
          </span>
        </div>
      </div>
    </div>

    <!-- Compte à rebours si dates définies -->
    <div v-if="campaignInfo.endDate" class="mt-3 pt-3 border-t border-white border-opacity-20">
      <div class="flex items-center justify-between text-sm">
        <span class="opacity-90">Se termine le :</span>
        <span class="font-bold">{{ formatEndDate(campaignInfo.endDate) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const { getActiveCampaignInfo } = useAdminSettings()

const campaignInfo = ref(null)

const fetchCampaignInfo = async () => {
  try {
    const info = await getActiveCampaignInfo()
    campaignInfo.value = info
  } catch (error) {
    console.error('Erreur lors du chargement des infos de campagne:', error)
  }
}

const formatEndDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchCampaignInfo()
})
</script>