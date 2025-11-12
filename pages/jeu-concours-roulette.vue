<template>
  <div class="container mx-auto px-4 pt-8 pb-24">
    
    <div class="max-w-xl mx-auto bg-white rounded-lg p-6">
      <!-- Statistiques -->
      <div class="text-center">
        <img src="https://www.creativcard.fr/wp-content/uploads/2024/06/screenshot-2024-07-10-a-22-31-30.webp" class="w-full h-48 object-contain mx-auto mb-8">
        <h1 class="text-2xl text-blue-800 font-bold text-center">Jeu Concours <br> CAJVB x GRINCH</h1>
        <p>Samedi 8 février 2025</p>
        <p class="text-lg font-semibold">Lots gagnés : {{ nombreGagnants }} sur 50 disponibles</p>
        <p class="text-sm text-gray-600 mt-2" v-if="maxParticipations > 1">
          Il vous reste {{ participationsRestantes }} participation{{ participationsRestantes > 1 ? 's' : '' }}
        </p>
      </div>

      <div v-if="aDejaJoue && participationsRestantes === 0" class="">
       
      </div>

      <div v-else-if="nombreGagnants >= 50" class="my-12 p-4 bg-yellow-100 rounded-lg text-center">
        <h3 class="font-bold text-lg">Jeu terminé !</h3>
        <p>Les 50 lots ont déjà été gagnés.</p>
      </div>

      <!-- La roulette (toujours visible) -->
      <div class="relative w-96 h-96 mx-auto my-12">
        <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div class="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[24px] border-red-500"></div>
        </div>
        <canvas ref="wheelCanvas" width="384" height="384" class="absolute"></canvas>
      </div>

      <!-- Bouton pour faire tourner (visible uniquement avant de jouer) -->
      <div v-if="!aDejaJoue && nombreGagnants < 50">
        <button
          v-if="!isSpinning && participationsRestantes > 0"
          @click="spinWheel"
          class="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Tenter votre chance !
        </button>
        <p v-else-if="participationsRestantes === 0" class="text-center text-lg font-bold text-gray-600 mt-4">
          Vous avez déjà utilisé toutes vos participations.
        </p>

        <!-- Message pendant que la roue tourne -->
        <div v-if="isSpinning" class="text-center text-lg font-bold text-gray-600 mt-4">
          La roue tourne...
        </div>
      </div>

      <!-- Résultats -->
      <div v-if="winner" class="mt-6 p-4 rounded-lg text-center" :class="winner === 'perdu' ? 'bg-red-100' : 'bg-blue-100'">
        <h3 class="font-bold text-xl mb-2" :class="winner === 'perdu' ? 'text-red-600' : 'text-blue-600'">
          {{ winner === 'perdu' ? '😢 Perdu !' : '🎉 Gagné !' }}
        </h3>
        <p v-if="winner === 'perdu'" class="text-red-600">
          Désolé, vous n'avez pas gagné cette fois-ci.
        </p>
        <p v-else class="text-blue-600 font-semibold">
          Félicitations ! Vous avez gagné {{ winner }} !
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser();
const wheelCanvas = ref(null)
const isSpinning = ref(false)
const winner = ref(null)
const sections = ref([])
const lots = ref([])
const nombreGagnants = ref(0)
const maxParticipations = ref(1)
const participationsRestantes = ref(maxParticipations.value)
const aDejaJoue = ref(false)

// Charger les données au montage du composant
onMounted(() => {
  // Récupérer les lots depuis le localStorage
  const lotsExistants = localStorage.getItem('jeuconcours_lots')
  if (lotsExistants) {
    lots.value = JSON.parse(lotsExistants)
    // Créer les sections de la roue avec les lots
    initializeSections()
  }

  // Charger le nombre de gagnants
  const gagnants = localStorage.getItem('jeuconcours_gagnants')
  if (gagnants) {
    nombreGagnants.value = parseInt(gagnants)
  }

  // Charger le nombre max de participations
  const maxPart = localStorage.getItem('jeuconcours_max_participations')
  if (maxPart) {
    maxParticipations.value = parseInt(maxPart)
  }

  // Vérifier le nombre de participations de l'utilisateur
  const participationsUtilisateur = localStorage.getItem('jeuconcours_participations_utilisateur')
  if (participationsUtilisateur) {
    const nbParticipations = parseInt(participationsUtilisateur)
    if (nbParticipations >= maxParticipations.value) {
      aDejaJoue.value = true
    }
    participationsRestantes.value = maxParticipations.value - nbParticipations
  } else {
    participationsRestantes.value = maxParticipations.value
  }

  // Initialiser la roue
  initWheel()
})

async function saveWinToDatabase(userId, lotName) {
  try {
    console.log('Tentative d\'insertion:', { userId, lotName });
    const { data, error } = await supabase
      .from('user_wins')
      .insert([
        { 
          user_id: userId, 
          lot_name: lotName
        }
      ])
      .select();

    if (error) {
      console.error('Erreur lors de l\'insertion du lot gagné:', error.message);
      return false;
    }

    console.log('Lot gagné ajouté à la base de données:', data);
    return true;
  } catch (e) {
    console.error('Erreur inattendue:', e);
    return false;
  }
}

// Fonction pour initialiser les sections de la roue
function initializeSections() {
  // Les lots sont placés dans un ordre fixe, dans le sens horaire
  const lotsOrdonnes = [
    { id: 1, nom: 'un hot dog' },
    { id: 2, nom: 'une crêpe' },
    { id: 3, nom: 'une boisson' }
  ];
  
  // On remplit la roue avec 12 sections dans le sens horaire
  sections.value = Array(12).fill(null).map((_, index) => {
    const lot = lotsOrdonnes[index % lotsOrdonnes.length];
    return {
      id: lot.id,
      nom: lot.nom,
      index: index
    };
  });
}

// Fonction pour calculer la section gagnante en tenant compte du sens horaire
function getSelectedSection(rotation) {
  const sectionAngle = (2 * Math.PI) / sections.value.length; // 30 degrés par section
  let normalizedRotation = rotation % (2 * Math.PI);
  if (normalizedRotation < 0) {
    normalizedRotation += 2 * Math.PI;
  }
  
  // Dans le sens horaire, on soustrait de 360° pour avoir l'index depuis le haut
  const degreesFromTop = 360 - (normalizedRotation * 180 / Math.PI);
  const indexFromTop = Math.floor(degreesFromTop / 30) % 12; // 30 degrés par section
  const selectedSection = sections.value[indexFromTop];

  console.log('Position sous le triangle rouge:', {
    rotationDegres: (normalizedRotation * 180 / Math.PI).toFixed(2) + '°',
    degresDepuisHaut: degreesFromTop.toFixed(2) + '°',
    indexDepuisHaut: indexFromTop,
    lotSousLeTriangle: selectedSection.nom,
    toutesLesSections: sections.value.map(s => s.nom)
  });
  
  return selectedSection;
}

function initWheel() {
  const canvas = wheelCanvas.value;
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner les sections de la roue
  const sectionAngle = (2 * Math.PI) / sections.value.length;
  sections.value.forEach((section, index) => {
    const startAngle = index * sectionAngle;
    const endAngle = (index + 1) * sectionAngle;

    // Dessiner le secteur
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    // Alterner les couleurs des sections
    ctx.fillStyle = '#1D4ED8';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ajouter le texte
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sectionAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(section.nom, radius - 20, 5);
    ctx.restore();
  });

  // Dessiner le cercle central
  ctx.beginPath();
  ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function spinWheel() {
  if (isSpinning.value || aDejaJoue.value || nombreGagnants.value >= 50) return;

  isSpinning.value = true;
  winner.value = null;

  if (!sections.value || sections.value.length === 0) {
    initializeSections();
  }

  // On fait tourner la roue dans le sens horaire
  const sectionAngle = (2 * Math.PI) / sections.value.length;
  const baseRotations = 5;
  const targetRotation = (baseRotations * 2 * Math.PI) + (Math.random() * 2 * Math.PI);

  let currentRotation = 0;
  let startTime = null;
  const animationDuration = 5000;

  const animate = async (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = (timestamp - startTime) / animationDuration;

    if (progress < 1) {
      currentRotation = targetRotation * easeOut(progress);
      const ctx = wheelCanvas.value.getContext('2d');
      ctx.save();
      ctx.translate(wheelCanvas.value.width / 2, wheelCanvas.value.height / 2);
      ctx.rotate(currentRotation);
      ctx.translate(-wheelCanvas.value.width / 2, -wheelCanvas.value.height / 2);
      initWheel();
      ctx.restore();
      requestAnimationFrame(animate);
    } else {
      // Animation terminée
      isSpinning.value = false;
      
      // Obtenir la section sous le triangle
      const selectedSection = getSelectedSection(currentRotation);
      
      console.log('Résultat final:', {
        rotationFinale: (currentRotation * 180 / Math.PI).toFixed(2) + '°',
        lotSousLeTriangle: selectedSection.nom,
        lotGagne: selectedSection.nom
      });
      
      // Utiliser le lot sous le triangle
      winner.value = selectedSection.nom;
      
      try {
        const userId = user.value?.id;
        if (userId) {
          await saveWinToDatabase(userId, selectedSection.nom);
        }
      } catch (e) {
        // Gérer l'erreur silencieusement
      }

      // Mettre à jour le nombre de gagnants
      nombreGagnants.value++;
      localStorage.setItem('jeuconcours_gagnants', nombreGagnants.value.toString());

      // Mettre à jour les participations
      const participationsUtilisateur = parseInt(localStorage.getItem('jeuconcours_participations_utilisateur') || '0');
      const nouvellesParticipations = participationsUtilisateur + 1;
      localStorage.setItem('jeuconcours_participations_utilisateur', nouvellesParticipations.toString());
      
      participationsRestantes.value = maxParticipations.value - nouvellesParticipations;
      if (nouvellesParticipations >= maxParticipations.value) {
        aDejaJoue.value = true;
      }
    }
  };

  requestAnimationFrame(animate);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}

definePageMeta({
  showHeader: false,
  showNavbar: false,
})
</script>

<style scoped>
.container {
  min-height: calc(100vh - 100px);
}
</style>