<template>
  <div class="container mx-auto px-4 py-24">
    <h1 class="text-3xl font-bold text-center mb-8">Gestion des Lots - Jeu Concours</h1>

    <div class="max-w-2xl mx-auto">
      <!-- Statistiques du jeu -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Statistiques du jeu</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg">Lots en jeu</h3>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-3xl font-bold text-blue-600">{{ nombreTotalLots }}</p>
              <p class="text-sm text-gray-600">Total des lots disponibles</p>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg">Lots gagnés</h3>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-3xl font-bold text-green-600">{{ nombreLotsGagnes }}</p>
              <p class="text-sm text-gray-600">Total des lots gagnés</p>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg">Participants</h3>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <p class="text-3xl font-bold text-purple-600">{{ nombreParticipants }}</p>
              <p class="text-sm text-gray-600">Joueurs uniques</p>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg">Gagnants</h3>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <p class="text-3xl font-bold text-yellow-600">{{ nombreGagnants }}</p>
              <p class="text-sm text-gray-600">Gagnants totaux</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="font-bold text-lg mb-2">Gagnants</h3>
            <p class="text-3xl font-bold text-blue-600">{{ nombreGagnants }}/50</p>
            <p class="text-sm text-gray-600">Lots distribués</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="font-bold text-lg mb-2">Participations</h3>
            <p class="text-3xl font-bold text-green-600">{{ nombreParticipants }}</p>
            <p class="text-sm text-gray-600">Joueurs uniques</p>
          </div>
        </div>

        <!-- Configuration du nombre de participations -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-bold text-lg mb-4">Configuration du jeu</h3>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="maxParticipations">
              Nombre de participations autorisées par personne
            </label>
            <div class="flex items-center gap-4">
              <input
                type="number"
                id="maxParticipations"
                v-model="maxParticipations"
                min="1"
                class="shadow appearance-none border rounded w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
              <button
                @click="sauvegarderMaxParticipations"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Sauvegarder
              </button>
            </div>
            <p class="text-sm text-gray-600 mt-2">
              Actuellement : {{ maxParticipations }} participation{{ maxParticipations > 1 ? 's' : '' }} par personne
            </p>
          </div>
        </div>

        <div class="mt-4">
          <button
            @click="reinitialiserJeu"
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Réinitialiser le jeu
          </button>
        </div>
      </div>

      <!-- Formulaire d'ajout de lot -->
      <form @submit.prevent="ajouterLot" class="mb-8">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="nomLot">
            Nom du lot
          </label>
          <input
            type="text"
            id="nomLot"
            v-model="nouveauLot.nom"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Ex: Boisson, Hot Dog, etc."
          >
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="quantiteLot">
            Quantité
          </label>
          <input
            type="number"
            id="quantiteLot"
            v-model="nouveauLot.quantite"
            required
            min="1"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
        </div>

        <button
          type="submit"
          class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          Ajouter ce lot
        </button>
      </form>

      <!-- Liste des lots -->
      <div class="bg-white rounded-lg">
        <h2 class="text-xl font-bold mb-4">Liste des lots</h2>
        <div class="space-y-2">
          <div v-for="lot in lots" :key="lot.nom" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex-1 flex items-start gap-2 flex-col">
              <span class="font-medium">{{ lot.nom }}</span>
              <span class="text-gray-500 ml-2">
                ({{ lotsGagnesParType[lot.nom] || 0 }}/{{ lot.quantite }} disponibles)
              </span>
            </div>
            <button @click="supprimerLot(lots.indexOf(lot))" 
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- Résumé -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <h3 class="font-bold mb-2">Résumé</h3>
        <p>Nombre total de lots : {{ nombreTotalLots }}</p>
        <div class="mt-4 flex justify-center">
          <button
            @click="sauvegarderEtCommencer"
            :disabled="lots.length === 0"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            Lancer le jeu concours
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  showHeader: false,
  showNavbar: false,
  middleware: ['auth']
})

const router = useRouter()
const supabase = useSupabaseClient();
const lots = ref([]);
const nouveauLot = ref({
  nom: '',
  quantite: 1
});
const nombreGagnants = ref(0);
const nombreParticipants = ref(0);
const maxParticipations = ref(1);
const nombreTotalLots = ref(0);
const nombreLotsGagnes = ref(0);
const lotsGagnesParType = ref({});

// Fonction pour obtenir le nombre de participants uniques
async function getNombreParticipants() {
  try {
    const { data, error } = await supabase
      .from('user_wins')
      .select('user_id')
      .limit(1000);

    if (error) {
      console.error('Erreur lors de la récupération des participants:', error);
      return;
    }

    // Compter le nombre d'utilisateurs uniques
    const uniqueUsers = new Set(data.map(win => win.user_id));
    nombreParticipants.value = uniqueUsers.size;
  } catch (e) {
    console.error('Erreur:', e);
  }
}

// Fonction pour obtenir les statistiques des lots gagnés par type
async function getLotsGagnesParType() {
  try {
    const { data, error } = await supabase
      .from('user_wins')
      .select('lot_name');

    if (error) {
      console.error('Erreur lors de la récupération des lots gagnés:', error);
      return;
    }

    // Compter le nombre de fois que chaque lot a été gagné
    const compteur = {};
    data.forEach(win => {
      compteur[win.lot_name] = (compteur[win.lot_name] || 0) + 1;
    });
    lotsGagnesParType.value = compteur;
    nombreLotsGagnes.value = data.length;
  } catch (e) {
    console.error('Erreur:', e);
  }
}

// Charger les données au montage du composant
onMounted(async () => {
  // Charger les lots existants
  const lotsExistants = localStorage.getItem('jeuconcours_lots2')
  if (lotsExistants) {
    lots.value = JSON.parse(lotsExistants)
  }

  // Charger le nombre de gagnants
  const gagnants = localStorage.getItem('jeuconcours_gagnants2')
  if (gagnants) {
    nombreGagnants.value = parseInt(gagnants)
  }

  // Charger le nombre max de participations
  const maxPart = localStorage.getItem('jeuconcours_max_participations2')
  if (maxPart) {
    maxParticipations.value = parseInt(maxPart)
  }

  // Compter le nombre total de lots
  if (lots.value.length > 0) {
    nombreTotalLots.value = lots.value.reduce((total, lot) => total + parseInt(lot.quantite), 0)
  }

  // Obtenir le nombre de participants et les statistiques des lots
  await Promise.all([
    getNombreParticipants(),
    getLotsGagnesParType()
  ]);
})

// Rafraîchir les données toutes les 30 secondes
let refreshInterval;
onMounted(() => {
  refreshInterval = setInterval(async () => {
    await Promise.all([
      getNombreParticipants(),
      getLotsGagnesParType()
    ]);
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

function ajouterLot() {
  if (nouveauLot.value.nom && nouveauLot.value.quantite > 0) {
    lots.value.push({
      nom: nouveauLot.value.nom,
      quantite: parseInt(nouveauLot.value.quantite)
    })
    // Sauvegarder les lots dans le localStorage
    localStorage.setItem('jeuconcours_lots2', JSON.stringify(lots.value))
    // Réinitialiser le formulaire
    nouveauLot.value = {
      nom: '',
      quantite: 1
    }
    // Compter le nombre total de lots
    nombreTotalLots.value = lots.value.reduce((total, lot) => total + parseInt(lot.quantite), 0)
  }
}

function supprimerLot(index) {
  lots.value.splice(index, 1)
  // Sauvegarder les lots dans le localStorage
  localStorage.setItem('jeuconcours_lots2', JSON.stringify(lots.value))
  // Compter le nombre total de lots
  if (lots.value.length > 0) {
    nombreTotalLots.value = lots.value.reduce((total, lot) => total + parseInt(lot.quantite), 0)
  } else {
    nombreTotalLots.value = 0
  }
}

function sauvegarderEtCommencer() {
  // Sauvegarder les lots dans le localStorage
  localStorage.setItem('jeuconcours_lots2', JSON.stringify(lots.value))
  // Rediriger vers la page du jeu concours
  router.push('/jeu-concours-roulette')
}

function reinitialiserJeu() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ? Cela effacera toutes les participations et les gagnants.')) {
    localStorage.removeItem('jeuconcours_gagnants2')
    localStorage.removeItem('jeuconcours_participation2')
    localStorage.removeItem('jeuconcours_participations_utilisateur2')
    nombreGagnants.value = 0
    nombreParticipants.value = 0
  }
}

function sauvegarderMaxParticipations() {
  localStorage.setItem('jeuconcours_max_participations2', maxParticipations.value.toString())
}
</script>

<style scoped>
.container {
  min-height: calc(100vh - 100px);
}
</style>
