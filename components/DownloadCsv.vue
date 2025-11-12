<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

const isLoading = ref(false)
const error = ref(null)
const supabase = useSupabaseClient()

const downloadClientsList = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('full_name, adresse, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) throw profilesError

    const formattedData = profilesData.map(profile => ({
      full_name: profile.full_name || '',
      adresse: profile.adresse || '',
      created_at: profile.created_at || ''
    }))

    downloadCSV(formattedData)
  } catch (err) {
    error.value = "Erreur lors du téléchargement : " + err.message
    console.error('Erreur lors du téléchargement de la liste des clients :', err)
  } finally {
    isLoading.value = false
  }
}

const downloadCSV = (data) => {
  if (data.length === 0) {
    error.value = "Aucune donnée à exporter"
    return
  }

  try {
    const headers = ['Nom complet', 'Adresse', 'Date d\'inscription']
    const csvRows = [headers.join(',')]
    
    for (const item of data) {
      const row = [
        (item.full_name || '').replace(/,/g, ' '),
        (item.adresse || '').replace(/,/g, ' '),
        item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      ]
      csvRows.push(row.join(','))
    }

    const csvData = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `liste-clients-${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = "Erreur lors de la génération du CSV : " + err.message
  }
}
</script>

<template>
  <div>
    <button
      @click="downloadClientsList"
      :disabled="isLoading"
      class="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 disabled:bg-gray-400 flex items-center gap-2"
    >
      <span v-if="isLoading">Téléchargement en cours...</span>
      <span v-else>Télécharger la liste des clients</span>
    </button>
    
    <p v-if="error" class="mt-2 text-red-600 text-sm">
      {{ error }}
    </p>
  </div>
</template>