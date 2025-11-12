<script setup>
import { ref, onMounted } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { v4 as uuidv4 } from 'uuid'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const loading = ref(false)
const error = ref(null)

const shop = ref({
  name_shop: '',
  address_shop: '',
  tel_shop: '',
  email_shop: '',
  formule_shop: '',
  description_shop: '',
  siteweb_store: '',
  horaire_shop: '',
  tag_shop: '',
  google_maps_shop: '',
  latitude: null,
  longitude: null,
  lot: '',
  limite: 10,
  photo_url: '',
  logo_shop: ''
})

// Gestion des tags
const tags = ref([])
const newTag = ref('')

const updateTags = () => {
  tags.value = shop.value.tag_shop.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
}

const addTag = () => {
  const trimmedTag = newTag.value.trim().replace(/,/g, '')
  if (trimmedTag !== '' && !tags.value.includes(trimmedTag)) {
    tags.value.push(trimmedTag)
    shop.value.tag_shop = tags.value.join(', ')
  }
  newTag.value = ''
}

const removeTag = (tag) => {
  const index = tags.value.indexOf(tag)
  if (index !== -1) {
    tags.value.splice(index, 1)
    shop.value.tag_shop = tags.value.join(', ')
  }
}

const handleKeydown = (event) => {
  if (event.key === ',' || event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}

// Géolocalisation via OpenStreetMap
const updateCoordinates = async () => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shop.value.address_shop)}`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      shop.value.latitude = parseFloat(data[0].lat);
      shop.value.longitude = parseFloat(data[0].lon);
    } else {
      throw new Error('Aucun résultat trouvé pour cette adresse');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des coordonnées:', error);
  }
}

// Upload des images
const logoFile = ref(null)
const coverFile = ref(null)

async function uploadImage(file, path) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${path}/${fileName}`

  const { data, error } = await supabase.storage
    .from('image')
    .upload(filePath, file)

  if (error) throw error

  return supabase.storage.from('image').getPublicUrl(filePath).data.publicUrl
}

async function handleSubmit() {
  try {
    loading.value = true
    error.value = null

    await updateCoordinates()

    // Générer les IDs uniques
    const uid = uuidv4()
    const scan_uid = uuidv4()

    // Upload des images
    let logo_url = ''
    let photo_url = ''

    if (logoFile.value) {
      logo_url = await uploadImage(logoFile.value, 'covers')
    }
    if (coverFile.value) {
      photo_url = await uploadImage(coverFile.value, 'covers')
    }

    const { data, error: err } = await supabase
      .from('boutique')
      .insert({
        ...shop.value,
        uid,
        scan_uid,
        check_location: false,
        statut: false,
        slug: shop.value.name_shop.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
        owner: user.value.id,
        actif: 'pending',
        photo_url,
        logo_shop: logo_url
      })

    if (err) throw err

    navigateTo('/result-boutique')
  } catch (err) {
    error.value = "Erreur lors de l'enregistrement"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 pb-24">
    <p class="text-sm text-blue-800 pb-8 italic font-semibold">* Tous les champs sont obligatoires</p>
    <form @submit.prevent="handleSubmit" class="space-y-10">
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
          Nom de votre entreprise
        </label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21l18 0"></path>
          <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4"></path>
          <path d="M5 21l0 -10.15"></path>
          <path d="M19 21l0 -10.15"></path>
          <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"></path>
        </svg>
        <input 
          type="text" 
          v-model="shop.name_shop"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
        >
      </div>

      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
          Description de votre activité
        </label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
          <path d="M9 17h6"></path>
          <path d="M9 13h6"></path>
        </svg>
        <textarea
            v-model="shop.description_shop"
            required
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
            rows="3"
          ></textarea>
      </div>

      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
          Secteur d'activité
        </label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 8v4.172a2 2 0 0 0 .586 1.414l5.71 5.71a2.41 2.41 0 0 0 3.408 0l3.592 -3.592a2.41 2.41 0 0 0 0 -3.408l-5.71 -5.71a2 2 0 0 0 -1.414 -.586h-4.172a2 2 0 0 0 -2 2z"></path>
          <path d="M18 19l1.592 -1.592a4.82 4.82 0 0 0 0 -6.816l-4.592 -4.592"></path>
          <path d="M7 10h-.01"></path>
        </svg>
        <input
          type="text"
          v-model="shop.categories_shop"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
          placeholder="Ex: café, reduction, dessert..."
        >
      </div>
      
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
          Tel
        </label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z"></path>
          <path d="M11 4h2"></path>
          <path d="M12 17v.01"></path>
        </svg>
        <input
          type="text"
          v-model="shop.tel_shop"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
          placeholder="Ajouter votre secteur d'activité..."
        >
      </div>
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
          Email
        </label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"></path>
          <path d="M3 7l9 6l9 -6"></path>
        </svg>
        <input
          type="email"
          v-model="shop.email_shop"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
          placeholder="Ajouter votre secteur d'activité..."
        >
      </div>
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
          Site web
        </label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 15l6 -6"></path>
          <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"></path>
          <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"></path>
        </svg>
        <input
          type="url"
          v-model="shop.siteweb_store"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
          placeholder="Ajouter votre secteur d'activité..."
        >
      </div>

      <!-- Adresse avec géolocalisation -->
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Adresse</label>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5"></path>
          <path d="M9 4v13"></path>
          <path d="M15 7v5.5"></path>
          <path d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z"></path>
          <path d="M19 18v.01"></path>
        </svg>
        <input 
          type="text"
          v-model="shop.address_shop"
          @blur="updateCoordinates"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
        >
        <div v-if="shop.latitude && shop.longitude" class="text-sm text-gray-600">
          Coordonnées : {{ shop.latitude }}, {{ shop.longitude }}
        </div>
      </div>

      <!-- Autres champs similaires... -->
      
      <!-- Upload des images -->
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase relative dark:text-white">Logo</label>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" class="absolute top-8 left-1 stroke-blue-800 w-6">
          <path d="M15 8h.01"></path>
          <path d="M11.5 21h-5.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v7"></path>
          <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4"></path>
          <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l.5 .5"></path>
          <path d="M15 19l2 2l4 -4"></path>
        </svg>
        <input 
          type="file"
          @change="e => logoFile = e.target.files[0]"
          accept="image/*"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
        >
      </div>
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Photo de couverture</label>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" class="absolute top-8 left-1 stroke-blue-800 w-6">
          <path d="M15 8h.01"></path>
          <path d="M11.5 21h-5.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v7"></path>
          <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4"></path>
          <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l.5 .5"></path>
          <path d="M15 19l2 2l4 -4"></path>
        </svg>
        <input 
          type="file"
          @change="e => coverFile = e.target.files[0]"
          accept="image/*"
          required
          class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
        >
      </div>

        <div class="space-y-10">
          <div class="relative space-y-2">
            <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
              Formule de fidélité *
            </label>
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gift absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
              <path d="M12 8l0 13" />
              <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
              <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />
            </svg>
            <textarea
              v-model="shop.formule_shop"
              required
              class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
              rows="3"
              placeholder="Décrivez votre récompense..."
            ></textarea>
          </div>

          <div class="relative space-y-2">
            <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
              Récompense (en un mot) *
            </label>
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-award absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" />
              <path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" />
              <path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" />
            </svg>
            <input
              type="text"
              v-model="shop.lot"
              required
              class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
              placeholder="Ex: café, reduction, dessert..."
            >
          </div>

          <div class="relative space-y-2">
            <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
              Nombre de passages requis *
            </label>
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-counter absolute top-8 left-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 4l3 3l-3 3" />
              <path d="M12 7h-7a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-9a2 2 0 0 0 -2 -2h-7" />
            </svg>
            <input
              type="number"
              v-model="shop.limite"
              required
              min="1"
              class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
              placeholder="Ex: 10"
            >
            <p class="text-sm text-gray-400">Nombre de passages en caisse nécessaires pour obtenir la récompense</p>
          </div>
        </div>

      <!-- Tags -->
      <div class="relative space-y-2">
        <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Mots-clés</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <span 
            v-for="tag in tags" 
            :key="tag" 
            class="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800"
          >
            {{ tag }}
            <button @click.prevent="removeTag(tag)" class="ml-1 text-blue-800 hover:text-blue-800">&times;</button>
          </span>
        </div>
        <div class="flex">
          <input
            type="text"
            v-model="newTag"
            @keydown="handleKeydown"
            placeholder="Ajouter des tags"
            class="flex-grow bg-white px-4 py-2 rounded-l-lg text-gray-700 border border-gray-200"
          >
          <button 
            @click.prevent="addTag"
            class="bg-blue-800 text-white px-4 py-2 rounded-r-lg"
          >
            Ajouter
          </button>
        </div>
      </div>

      <!-- Bouton de soumission -->
      <div>
        <button 
          type="submit"
          :disabled="loading"
          class="inline-flex justify-center py-2 px-4 border border-white shadow-sm text-sm font-medium rounded-md text-white bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>