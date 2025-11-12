<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient, useRequestURL } from '#imports'

definePageMeta({
  middleware: 'admin',
  showHeader: false,
  showNavbar: false,
})

const supabase = useSupabaseClient()
const boutiques = ref([])
const loading = ref(true)
const selectedBoutique = ref(null)

// Obtenir l'URL de base (compatible SSR)
const requestURL = useRequestURL()
const baseUrl = computed(() => requestURL.origin)

// Générer l'URL du QR code via Google Charts API
const qrCodeUrl = computed(() => {
  if (!selectedBoutique.value || !selectedBoutique.value.scan_uid) return ''
  
  const scanUrl = `${baseUrl.value}/boutique/${selectedBoutique.value.scan_uid}`
  
  // API Google Charts pour générer le QR code (200x200)
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(scanUrl)}`
})

// Charger toutes les boutiques
async function loadBoutiques() {
  try {
    const { data, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('statut', true)
      .order('name_shop', { ascending: true })

    if (error) throw error

    boutiques.value = data || []
  } catch (e) {
    console.error('Erreur lors du chargement des boutiques:', e)
    alert('Erreur lors du chargement des boutiques')
  } finally {
    loading.value = false
  }
}

// Sélectionner une boutique
function selectBoutique(boutique) {
  selectedBoutique.value = boutique
}

// Copier l'URL de scan
function copyUrl() {
  const url = `${baseUrl.value}/boutique/${selectedBoutique.value.scan_uid}`
  navigator.clipboard.writeText(url)
  alert('✅ URL copiée dans le presse-papier !')
}

// Télécharger le QR code
async function downloadQR() {
  try {
    const response = await fetch(qrCodeUrl.value)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = `qrcode-${selectedBoutique.value.slug}.png`
    link.href = url
    link.click()
    
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Erreur lors du téléchargement:', e)
    alert('Erreur lors du téléchargement du QR code')
  }
}

onMounted(() => {
  loadBoutiques()
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <NuxtLink to="/admin" class="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Retour admin
          </NuxtLink>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Test Boutiques & QR Codes
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sélectionnez une boutique pour voir ses infos et générer son QR code
          </p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Liste des boutiques -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Boutiques ({{ boutiques.length }})
          </h2>

          <div v-if="loading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>

          <div v-else class="space-y-2 max-h-[70vh] overflow-y-auto">
            <button
              v-for="boutique in boutiques"
              :key="boutique.id"
              @click="selectBoutique(boutique)"
              :class="[
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                selectedBoutique?.id === boutique.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              <div class="flex items-center gap-3">
                <img 
                  v-if="boutique.logo_shop" 
                  :src="boutique.logo_shop" 
                  :alt="boutique.name_shop"
                  class="w-12 h-12 object-contain rounded"
                />
                <div class="flex-1">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ boutique.name_shop }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ boutique.slug }}
                  </p>
                  <p v-if="boutique.scan_uid" class="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    🔗 {{ boutique.scan_uid }}
                  </p>
                  <div class="flex gap-2 mt-1">
                    <span 
                      v-if="boutique.id === 'a16d195c-bb59-4f5f-bec8-83cf85b9efc4'"
                      class="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 rounded"
                    >
                      🎁 Boutique spéciale
                    </span>
                    <span class="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">
                      {{ boutique.limite }} points
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Détails et QR Code -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div v-if="!selectedBoutique" class="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p>Sélectionnez une boutique</p>
          </div>

          <div v-else class="space-y-6">
            <!-- Logo et nom -->
            <div class="text-center">
              <img 
                v-if="selectedBoutique.logo_shop" 
                :src="selectedBoutique.logo_shop" 
                :alt="selectedBoutique.name_shop"
                class="w-24 h-24 object-contain mx-auto mb-4 rounded-lg"
              />
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ selectedBoutique.name_shop }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Slug: {{ selectedBoutique.slug }}
              </p>
              <p v-if="selectedBoutique.scan_uid" class="text-xs text-gray-400 dark:text-gray-500 font-mono">
                Scan UID: {{ selectedBoutique.scan_uid }}
              </p>
            </div>

            <!-- QR Code -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <img 
                v-if="qrCodeUrl" 
                :src="qrCodeUrl" 
                alt="QR Code"
                class="mx-auto mb-4 rounded-lg shadow-md"
              />
              <div class="flex gap-2 justify-center">
                <button
                  @click="copyUrl"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  📋 Copier l'URL
                </button>
                <button
                  @click="downloadQR"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  💾 Télécharger QR
                </button>
              </div>
            </div>

            <!-- Informations -->
            <div class="space-y-3">
              <h3 class="font-semibold text-gray-900 dark:text-white">Informations :</h3>
              
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Limite :</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedBoutique.limite }} points</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Lot :</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedBoutique.lot || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Actif :</span>
                  <span class="ml-2 font-medium" :class="selectedBoutique.actif ? 'text-green-600' : 'text-red-600'">
                    {{ selectedBoutique.actif ? '✅ Oui' : '❌ Non' }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Statut :</span>
                  <span class="ml-2 font-medium" :class="selectedBoutique.statut ? 'text-green-600' : 'text-red-600'">
                    {{ selectedBoutique.statut ? '✅ Public' : '❌ Privé' }}
                  </span>
                </div>
              </div>

              <div v-if="selectedBoutique.id === 'a16d195c-bb59-4f5f-bec8-83cf85b9efc4'" 
                   class="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p class="text-sm text-purple-900 dark:text-purple-200 font-medium">
                  🎁 Boutique spéciale avec messages personnalisés :
                </p>
                <ul class="text-xs text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                  <li>• 1 point = Goodies à récupérer</li>
                  <li>• 2 points = 15% sur les accessoires</li>
                </ul>
              </div>

              <div v-if="selectedBoutique.description_shop" class="pt-3 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-500 dark:text-gray-400 text-sm">Description :</span>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ selectedBoutique.description_shop }}
                </p>
              </div>
            </div>

            <!-- URL de test -->
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">URL de scan :</p>
              <code class="text-xs text-blue-800 dark:text-blue-200 break-all">
                {{ baseUrl }}/boutique/{{ selectedBoutique.scan_uid }}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

