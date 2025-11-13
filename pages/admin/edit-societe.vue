<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

definePageMeta({
  showHeader: false,
  showNavbar: false,
  showAdminbar: false
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()
const isOwner = ref(false)
const ownedBoutiques = ref([])

const boutique = ref({
  address_shop: '',
  tel_shop: '',
  email_shop: '',
  formule_shop: '',
  limite: '',
  lot: '',
  description_shop: '',
  siteweb_store: '',
  horaire_shop: '',
  tag_shop: '',
  google_maps_shop: '',
  avis_google: '',
  lien_avis_google: '',
  latitude: null,
  longitude: null,
  enable_auto_messages: false,
  message_1_point: '',
  message_recompense: '',
}) 

const fetchBoutique = async () => {
  try {
    const { data, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)
      .single()

    if (error) throw error

    if (data) {
      boutique.value = data
    } else {
      console.log("Aucune boutique trouvée pour cet utilisateur")
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la boutique 3:", error.message)
  }
}

const updateCoordinates = async () => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(boutique.value.address_shop)}`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      boutique.value.latitude = parseFloat(data[0].lat);
      boutique.value.longitude = parseFloat(data[0].lon);
    } else {
      throw new Error('Aucun résultat trouvé pour cette adresse');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des coordonnées:', error);
    alert('Impossible de trouver les coordonnées pour cette adresse. Veuillez vérifier l\'adresse et réessayer.');
  }
}

const tags = ref([])
const newTag = ref('')

const updateTags = () => {
  tags.value = boutique.value.tag_shop.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
}

const addTag = () => {
  const trimmedTag = newTag.value.trim().replace(/,/g, '') // Supprime toutes les virgules
  if (trimmedTag !== '' && !tags.value.includes(trimmedTag)) {
    tags.value.push(trimmedTag)
    updateBoutiqueTagShop()
  }
  newTag.value = ''
}

const removeTag = (tag) => {
  const index = tags.value.indexOf(tag)
  if (index !== -1) {
    tags.value.splice(index, 1)
    updateBoutiqueTagShop()
  }
}

const updateBoutiqueTagShop = () => {
  boutique.value.tag_shop = tags.value.join(', ')
}

const handleKeydown = (event) => {
  if (event.key === ',' || event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}

watch(() => boutique.value.tag_shop, updateTags, { immediate: true })

const updateBoutique = async () => {
  try {
    await updateCoordinates();  // Mettre à jour les coordonnées avant de sauvegarder

    const { error } = await supabase
      .from('boutique')
      .update(boutique.value)
      .eq('owner', user.value.id)

    if (error) throw error

    router.push('/admin/ma-boutique')
  } catch (error) {
  }
}

onMounted(() => {
  if (!user.value) {
    router.push('/')
  }
  if (user.value) {
    fetchBoutique()
  } else {
    router.push('/')
  }
  if (boutique.value.tag_shop) {
    updateTags()
  }
})
onMounted(async () => {
  if (user.value) {
    const { data: boutiques, error } = await supabase
      .from('boutique')
      .select('*')
      .eq('owner', user.value.id)

    if (boutiques && boutiques.length > 0) {
      isOwner.value = true
      ownedBoutiques.value = boutiques

      await Promise.all(ownedBoutiques.value.map(fetchBoutiqueData))
    }
  }
})
</script>

<template>
  <div v-if="!isOwner" class="py-24">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</div>
  <div v-else>
    <div class="container mx-auto p-4 py-24">
      <p class="text-lg uppercase font-semibold text-blue-800 dark:text-white text-center pb-10">Modifier le profil</p>
      <form @submit.prevent="updateBoutique" class="space-y-10">
        <div class="relative space-y-2">
          <label for="address_shop"
            class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Adresse</label>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1"
            width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5" />
            <path d="M9 4v13" />
            <path d="M15 7v5.5" />
            <path
              d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z" />
            <path d="M19 18v.01" />
          </svg>
          <input type="text" id="address_shop" v-model="boutique.address_shop" @blur="updateCoordinates"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200">
        </div>


        <div class="relative space-y-2">
          <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Coordonnées</label>
          <p class="text-sm text-gray-600">Latitude: {{ boutique.latitude }}<br>Longitude: {{ boutique.longitude }}</p>
          <p class="text-sm text-gray-400">La longitude et la latitude sert pour sécuriser le scan du QRCODE.</p>
        </div>

        <div class="relative space-y-2 hidden">
          <label for="username"
            class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Latitude</label>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1"
            width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M4.6 7l14.8 0" />
            <path d="M3 12l18 0" />
            <path d="M4.6 17l14.8 0" />
          </svg>
          <input type="number" id="latitude" v-model="boutique.latitude"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200" readonly>
        </div>
        <div class="relative space-y-2 hidden">
          <label for="username"
            class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Longitude</label>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1"
            width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M11.5 3a11.2 11.2 0 0 0 0 18" />
            <path d="M12.5 3a11.2 11.2 0 0 1 0 18" />
            <path d="M12 3l0 18" />
          </svg>
          <input type="number" id="longitude" v-model="boutique.longitude"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200" readonly>
        </div>
        <div class="relative space-y-2">
          <label for="username" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Itinéraire
            de google Maps</label>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-user-circle absolute top-8 left-1"
            width="24" height="24" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M11.5 3a11.2 11.2 0 0 0 0 18" />
            <path d="M12.5 3a11.2 11.2 0 0 1 0 18" />
            <path d="M12 3l0 18" />
          </svg>
          <input type="url" id="google_maps_shop" v-model="boutique.google_maps_shop"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200">
        </div>

        <div class="relative space-y-2">
          <label for="tel" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Téléphone</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="stroke-blue-800 icon icon-tabler icon-tabler-device-remote absolute top-8 left-1" width="26"
            height="26" viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M7 3m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" />
            <path d="M12 3v2" />
            <path d="M10 15v.01" />
            <path d="M10 18v.01" />
            <path d="M14 18v.01" />
            <path d="M14 15v.01" />
          </svg>
          <input type="tel" id="tel_shop" v-model="boutique.tel_shop"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200">
        </div>

        <div class="relative space-y-2">
          <label for="adresse" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Email</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24"
            viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
            <path d="M3 7l9 6l9 -6" />
          </svg>
          <input type="email" id="email_shop" v-model="boutique.email_shop"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200"></input>
        </div>

        <div class="relative space-y-2">
          <label for="adresse" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Site
            web</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24"
            viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M19.5 7a9 9 0 0 0 -7.5 -4a8.991 8.991 0 0 0 -7.484 4" />
            <path d="M11.5 3a16.989 16.989 0 0 0 -1.826 4" />
            <path d="M12.5 3a16.989 16.989 0 0 1 1.828 4" />
            <path d="M19.5 17a9 9 0 0 1 -7.5 4a8.991 8.991 0 0 1 -7.484 -4" />
            <path d="M11.5 21a16.989 16.989 0 0 1 -1.826 -4" />
            <path d="M12.5 21a16.989 16.989 0 0 0 1.828 -4" />
            <path d="M2 10l1 4l1.5 -4l1.5 4l1 -4" />
            <path d="M17 10l1 4l1.5 -4l1.5 4l1 -4" />
            <path d="M9.5 10l1 4l1.5 -4l1.5 4l1 -4" />
          </svg>
          <input type="text" id="siteweb_store" v-model="boutique.siteweb_store"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200"></input>
        </div>

        <div class="relative space-y-2">
          <label for="adresse" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">A
            propos</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24"
            viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            <path d="M9 17h6" />
            <path d="M9 13h6" />
          </svg>
          <textarea type="text" id="description_shop" v-model="boutique.description_shop"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200" rows="7"></textarea>
          <p class="text-sm text-gray-400">Description de votre boutique</p>
        </div>
        <div class="relative space-y-2">
          <p class="text-sm text-gray-900"> Vos horaires sont à ajouter dans votre tableau de bord > Horaires.</p>
        </div>

        <div class="relative space-y-2">
          <label for="adresse"
            class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Cadeau</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24"
            viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
            <path d="M12 8l0 13" />
            <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />
          </svg>
          <textarea type="text" id="formule_shop" v-model="boutique.formule_shop"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200"></textarea>
          <p class="text-sm text-gray-400">Mettre le cadeau en avant</p>
        </div>
        <div class="relative space-y-2">
          <label for="adresse" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Cadeau en 1
            mot</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24"
            viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
            <path d="M12 8l0 13" />
            <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />
          </svg>
          <input type="text" id="lot" v-model="boutique.lot"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200"></input>
          <p class="text-sm text-gray-400">Ajoutez juste votre cadeau en 1 mot</p>
        </div>
        <div class="relative space-y-2">
          <label for="adresse" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Limite des
            points de fidélité</label>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-map-pin-check absolute top-8 left-1" width="24" height="24"
            viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
            <path d="M4 16v2a2 2 0 0 0 2 2h2" />
            <path d="M16 4h2a2 2 0 0 1 2 2v2" />
            <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
            <path d="M8 11m0 1a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1z" />
            <path d="M10 11v-2a2 2 0 1 1 4 0v2" />
          </svg>
          <input type="text" id="limite" v-model="boutique.limite"
            class="w-full bg-white px-8 py-4 rounded-lg text-gray-700  border border-gray-200"></input>
          <p class="text-sm text-gray-400">Choisissez le nombre de points de fidélité pour faire gagner votre cadeau.
          </p>
        </div>

        <div class="relative space-y-2">
          <label for="tag_shop"
            class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Mots-clés</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span v-for="tag in tags" :key="tag"
              class="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
              {{ tag }}
              <button @click.prevent="removeTag(tag)" class="ml-1 text-blue-800 hover:text-blue-800">&times;</button>
            </span>
          </div>
          <div class="flex">
            <input type="text" v-model="newTag" @keydown="handleKeydown" placeholder="Ajouter des tags"
              class="flex-grow bg-white px-4 py-2 rounded-l-lg text-gray-700 border border-gray-200">
            <button @click.prevent="addTag" class="bg-blue-800 text-white px-4 py-2 rounded-r-lg">
              Ajouter
            </button>
          </div>
          <p class="text-sm text-gray-400">Appuyez sur Entrée ou virgule pour ajouter un tag, ou cliquez sur le bouton
            Ajouter</p>
        </div>

        <div class="relative space-y-2">
          <label class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Avis Google</label>
          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="boutique.avis_google = !boutique.avis_google"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                boutique.avis_google ? 'bg-blue-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  boutique.avis_google ? 'translate-x-5' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="ml-2 text-sm text-gray-700">Activer l'avis Google</span>
          </div>
          <div v-if="boutique.avis_google" class="mt-2">
            <label for="lien_avis_google" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">Lien vers les avis Google</label>
            <input type="url" id="lien_avis_google" v-model="boutique.lien_avis_google"
              class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
              placeholder="https://g.page/r/xxxxxxx" />
            <p class="text-sm text-gray-400">Collez ici le lien direct vers la page d'avis Google de votre boutique.</p>
          </div>
        </div>

        <!-- Messages automatiques -->
        <div class="relative space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 class="text-base font-semibold text-blue-800 uppercase">📬 Messages automatiques</h3>
          <p class="text-sm text-gray-600">
            Personnalisez les messages envoyés automatiquement à vos clients lorsqu'ils gagnent des points ou des récompenses.
          </p>

          <!-- Toggle Activer/Désactiver -->
          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="boutique.enable_auto_messages = !boutique.enable_auto_messages"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                boutique.enable_auto_messages ? 'bg-blue-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  boutique.enable_auto_messages ? 'translate-x-5' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="ml-2 text-sm font-medium text-gray-700">
              {{ boutique.enable_auto_messages ? 'Messages personnalisés activés' : 'Utiliser les messages par défaut' }}
            </span>
          </div>

          <!-- Formulaire si activé -->
          <div v-if="boutique.enable_auto_messages" class="space-y-4 mt-4">
            <!-- Message 1er point -->
            <div class="relative space-y-2">
              <label for="message_1_point" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
                📬 Message 1er point (Goodies)
              </label>
              <svg xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-gift absolute top-8 left-1" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
                <path d="M12 8l0 13" />
                <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />
              </svg>
              <textarea 
                id="message_1_point" 
                v-model="boutique.message_1_point"
                class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
                rows="3"
                placeholder="Ex: Félicitations ! Vous avez gagné un café gratuit. Présentez ce message à l'accueil pour récupérer votre cadeau !"
              ></textarea>
              <p class="text-sm text-gray-400">
                Ce message sera envoyé automatiquement quand un client atteint 1 point (premier scan).
              </p>
            </div>

            <!-- Message récompense -->
            <div class="relative space-y-2">
              <label for="message_recompense" class="block text-xs font-semibold text-blue-800 uppercase dark:text-white">
                🎁 Message récompense finale
              </label>
              <svg xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-trophy absolute top-8 left-1" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="1" stroke="#1e40af" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M8 21l8 0" />
                <path d="M12 17l0 4" />
                <path d="M7 4l10 0" />
                <path d="M17 4v8a5 5 0 0 1 -10 0v-8" />
                <path d="M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                <path d="M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              </svg>
              <textarea 
                id="message_recompense" 
                v-model="boutique.message_recompense"
                class="w-full bg-white px-8 py-4 rounded-lg text-gray-700 border border-gray-200"
                rows="3"
                placeholder="Ex: Bravo ! Vous avez atteint la limite et gagné 15% de réduction. Présentez ce message en boutique pour bénéficier de votre réduction !"
              ></textarea>
              <p class="text-sm text-gray-400">
                Ce message sera envoyé quand le client atteint la limite de points ({{ boutique.limite || '?' }} points).
              </p>
            </div>
          </div>

          <div v-else class="bg-yellow-50 border border-gray-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
              💡 <strong>Messages par défaut activés</strong><br>
              Les clients recevront des messages génériques. Activez les messages personnalisés pour créer votre propre contenu.
            </p>
          </div>
        </div>

        <div>
          <button type="submit"
            class="inline-flex justify-center py-2 px-4 border border-white shadow-sm text-sm font-medium rounded-md text-white bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Mettre à jour
          </button>
        </div>
      </form>
    </div>
  </div>
</template>