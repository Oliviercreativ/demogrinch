<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Annuaire vers Boutique
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Convertir les entrées de l'annuaire en boutiques avec programme de fidélité
        </p>
      </div>

      <!-- Search & Stats -->
      <div class="mb-6 space-y-4">
        <!-- Search Bar -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par nom, email, téléphone, secteur..."
            class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Stats -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span class="font-medium">
              {{ filteredEntries.length }} entrée{{ filteredEntries.length > 1 ? 's' : '' }}
              <span v-if="searchQuery" class="text-gray-500 dark:text-gray-500">
                sur {{ annuaireEntries.length }} au total
              </span>
              <span v-else class="text-gray-500 dark:text-gray-500">
                dans l'annuaire
              </span>
            </span>
          </div>
          
          <div v-if="searchQuery" class="text-sm text-blue-600 dark:text-blue-400">
            Recherche active
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Chargement des données...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Grid Cards -->
      <div v-else>
        <!-- Empty state -->
        <div v-if="filteredEntries.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {{ searchQuery ? 'Aucun résultat trouvé' : 'Aucune entrée dans l\'annuaire' }}
          </p>
          <p v-if="searchQuery" class="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Essayez avec d'autres mots-clés
          </p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            <!-- Card Header with Image -->
            <div class="relative h-32 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600">
              <img
                v-if="entry.cover"
                :src="entry.cover"
                :alt="entry.nom"
                class="w-full h-full object-cover"
              />
              <div class="absolute top-3 right-3">
                <span
                  v-if="entry.statut"
                  class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  Actif
                </span>
                <span
                  v-else
                  class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                >
                  Inactif
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-4">
              <!-- Logo & Name -->
              <div class="flex items-start gap-3 mb-3">
                <div class="flex-shrink-0">
                  <img
                    v-if="entry.logo"
                    :src="entry.logo"
                    :alt="entry.nom"
                    class="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                  <div
                    v-else
                    class="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600"
                  >
                    <span class="text-gray-500 dark:text-gray-400 font-medium text-lg">
                      {{ entry.nom?.charAt(0) }}
                    </span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {{ entry.nom }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ entry.slug }}
                  </p>
                </div>
              </div>

              <!-- Info -->
              <div class="space-y-2 mb-4">
                <div v-if="entry.secteur || entry.types" class="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-300 truncate">{{ entry.secteur || entry.types }}</span>
                </div>

                <div v-if="entry.email" class="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-300 truncate">{{ entry.email }}</span>
                </div>

                <div v-if="entry.tel" class="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-300 truncate">{{ entry.tel }}</span>
                </div>

                <div v-if="entry.adresse" class="flex items-start gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">{{ entry.adresse }}</span>
                </div>
              </div>

              <!-- Action Button -->
              <button
                @click="selectEntry(entry)"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Convertir en Boutique
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de conversion -->
    <div v-if="selectedEntry" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50" @click.self="closeModal">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Convertir "{{ selectedEntry.nom }}" en Boutique
          </h3>
        </div>

        <form @submit.prevent="convertToBoutique" class="px-6 py-4 space-y-4">
          <!-- Informations de base -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de la boutique *
              </label>
              <input
                v-model="boutiqueForm.name_shop"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                v-model="boutiqueForm.email_shop"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone *
              </label>
              <input
                v-model="boutiqueForm.tel_shop"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse *
              </label>
              <input
                v-model="boutiqueForm.address_shop"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de points pour récompense *
              </label>
              <input
                v-model="boutiqueForm.limite"
                type="text"
                required
                placeholder="ex: 10"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Formule
              </label>
              <select
                v-model="boutiqueForm.formule_shop"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="gratuit">Gratuit</option>
                <option value="premium">Premium</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              v-model="boutiqueForm.description_shop"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>

          <!-- Récompense -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Récompense
            </label>
            <input
              v-model="boutiqueForm.lot"
              type="text"
              placeholder="ex: Une boisson offerte"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <!-- Options -->
          <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center">
              <input
                v-model="boutiqueForm.check_location"
                type="checkbox"
                id="check_location"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="check_location" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Activer la vérification de géolocalisation
              </label>
            </div>

            <div class="flex items-center">
              <input
                v-model="boutiqueForm.scan_24h"
                type="checkbox"
                id="scan_24h"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="scan_24h" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Limiter à 1 scan par 24h
              </label>
            </div>

            <div class="flex items-center">
              <input
                v-model="boutiqueForm.validation_point"
                type="checkbox"
                id="validation_point"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="validation_point" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Validation manuelle des points
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="closeModal"
              :disabled="converting"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="converting"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              <span v-if="converting" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              {{ converting ? 'Conversion en cours...' : 'Convertir en Boutique' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  showHeader: false,
  showNavbar: false,
  showSidebar: false,
  showFooter: false,
  showAdminbar: false,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const error = ref(null)
const annuaireEntries = ref([])
const selectedEntry = ref(null)
const converting = ref(false)
const searchQuery = ref('')

const boutiqueForm = ref({
  name_shop: '',
  address_shop: '',
  tel_shop: '',
  email_shop: '',
  formule_shop: 'gratuit',
  limite: '10',
  lot: '',
  description_shop: '',
  siteweb_store: '',
  facebook_shop: '',
  instagram_shop: '',
  tiktok_shop: '',
  youtube_shop: '',
  google_maps_shop: '',
  horaire_shop: '',
  logo_shop: '',
  photo_url: '',
  tag_shop: '',
  categories_shop: '',
  madeinconflans: '',
  check_location: false,
  scan_24h: true,
  validation_point: false
})

// Filtered entries based on search query
const filteredEntries = computed(() => {
  if (!searchQuery.value) {
    return annuaireEntries.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  return annuaireEntries.value.filter(entry => {
    return (
      entry.nom?.toLowerCase().includes(query) ||
      entry.email?.toLowerCase().includes(query) ||
      entry.tel?.toLowerCase().includes(query) ||
      entry.secteur?.toLowerCase().includes(query) ||
      entry.types?.toLowerCase().includes(query) ||
      entry.adresse?.toLowerCase().includes(query) ||
      entry.slug?.toLowerCase().includes(query) ||
      entry.tags?.toLowerCase().includes(query)
    )
  })
})

// Charger les entrées de l'annuaire
async function loadAnnuaireEntries() {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('annuaire')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    annuaireEntries.value = data || []
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Sélectionner une entrée pour la conversion
function selectEntry(entry) {
  selectedEntry.value = entry
  
  // Pré-remplir le formulaire avec les données de l'annuaire
  boutiqueForm.value = {
    name_shop: entry.nom || '',
    address_shop: entry.adresse || '',
    tel_shop: entry.tel || '',
    email_shop: entry.email || '',
    formule_shop: 'gratuit',
    limite: '10',
    lot: '',
    description_shop: entry.description || entry.minidescription || entry.content || '',
    siteweb_store: entry.siteweb || '',
    facebook_shop: entry.facebook || '',
    instagram_shop: entry.instagram || '',
    tiktok_shop: entry.tiktok || '',
    youtube_shop: entry.youtube || '',
    madeinconflans: entry.slug ? `https://madeinconflans.fr/pageweb/${entry.slug}` : '',
    horaire_shop: entry.horaire || 'A renseigner',
    logo_shop: entry.logo || '',
    photo_url: entry.image_url || entry.cover || '',
    tag_shop: entry.tags || '',
    categories_shop: entry.types || entry.secteur || '',
    google_maps_shop: entry.lien_google || '',
    check_location: false,
    scan_24h: true,
    validation_point: false,
    actif: entry.statut ? '1' : '0',
    statut: entry.statut || false,
    active_adresse: entry.active_adresse ?? true
  }
}

// Fermer le modal
function closeModal() {
  selectedEntry.value = null
}

// Convertir en boutique
async function convertToBoutique() {
  if (!selectedEntry.value) return

  try {
    converting.value = true

    // Préparer les données de la boutique
    const boutiqueData = {
      name_shop: boutiqueForm.value.name_shop,
      address_shop: boutiqueForm.value.address_shop,
      tel_shop: boutiqueForm.value.tel_shop,
      email_shop: boutiqueForm.value.email_shop,
      formule_shop: boutiqueForm.value.formule_shop,
      limite: boutiqueForm.value.limite,
      lot: boutiqueForm.value.lot || null,
      description_shop: boutiqueForm.value.description_shop || null,
      siteweb_store: boutiqueForm.value.siteweb_store || null,
      facebook_shop: boutiqueForm.value.facebook_shop || null,
      instagram_shop: boutiqueForm.value.instagram_shop || null,
      tiktok_shop: boutiqueForm.value.tiktok_shop || null,
      youtube_shop: boutiqueForm.value.youtube_shop || null,
      google_maps_shop: boutiqueForm.value.google_maps_shop || null,
      madeinconflans: boutiqueForm.value.madeinconflans || null,
      horaire_shop: boutiqueForm.value.horaire_shop || 'A renseigner',
      logo_shop: boutiqueForm.value.logo_shop || null,
      photo_url: boutiqueForm.value.photo_url || null,
      tag_shop: boutiqueForm.value.tag_shop || null,
      categories_shop: boutiqueForm.value.categories_shop || null,
      slug: selectedEntry.value.slug,
      check_location: boutiqueForm.value.check_location,
      scan_24h: boutiqueForm.value.scan_24h,
      validation_point: boutiqueForm.value.validation_point,
      actif: boutiqueForm.value.actif || '1',
      statut: boutiqueForm.value.statut ?? true,
      active_adresse: boutiqueForm.value.active_adresse ?? true,
      owner: selectedEntry.value.owner || user.value.id,
      subscription: false,
      pub: false,
      vip: null,
      avis_google: false,
      lien_avis_google: boutiqueForm.value.google_maps_shop || null
    }

    // Insérer dans la table boutique
    const { data: newBoutique, error: insertError } = await supabase
      .from('boutique')
      .insert([boutiqueData])
      .select()
      .single()

    if (insertError) throw insertError

    // Créer une relation dans la table relation si nécessaire
    if (newBoutique && newBoutique.uid) {
      const { error: relationError } = await supabase
        .from('relation')
        .insert([{
          owner: selectedEntry.value.owner || user.value.id,
          boutique_uid: newBoutique.uid,
          annuaire_uid: selectedEntry.value.id
        }])

      if (relationError) {
        console.warn('Erreur lors de la création de la relation:', relationError)
      }
    }

    alert(`✅ "${boutiqueForm.value.name_shop}" a été converti en boutique avec succès !`)
    
    closeModal()
    await loadAnnuaireEntries()

  } catch (err) {
    console.error('Erreur lors de la conversion:', err)
    alert('❌ Erreur lors de la conversion: ' + err.message)
  } finally {
    converting.value = false
  }
}

// Charger les données au montage
onMounted(() => {
  loadAnnuaireEntries()
})
</script>

