<template>
  <div class="container mx-auto px-4 pt-2 pb-24">
    
    <div class="max-w-xl mx-auto bg-white rounded-lg p-6">
      <!-- Statistiques -->
      <div class="text-center">
        <div class="flex items-center gap-2">
          <img src="https://www.madeinconflans.fr/wp-content/uploads/2024/05/6452416fef45718de89d7925_giagia-beige-2-p-500.png" class="w-full h-48 object-contain mx-auto mb-8">
          <img src="https://www.madeinconflans.fr/wp-content/uploads/2023/02/LogFANb.png" class="w-full h-48 object-contain mx-auto mb-8">
        </div>
        <h1 class="text-2xl text-blue-800 font-bold text-center">Jeu Concours <br> Giagia x FA Coaching</h1>
        <p>Samedi 8 février 2025</p>
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
        <div class="absolute top-1/2 -right-6 transform -translate-y-1/2 rotate-90 z-10">
          <div class="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[24px] border-red-500"></div>
        </div>
        
        <!-- Point vert de référence -->
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
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
        <div v-if="winner === 'perdu'" class="text-red-600">
          <p class="text-xl mb-2 font-bold">😢 Perdu !</p>
          <p class="text-xl">Désolé, vous n'avez pas gagné cette fois-ci.</p>
        </div>
        <div v-else class="text-blue-600">
          <p class="text-xl mb-2 font-bold">🎉 Gagné ! (index {{ selectedSection?.index }})</p>
          <p class="text-xl">Félicitations ! Vous avez gagné {{ selectedSection?.nom }} !</p>
          <p class="text-lg mt-2">Votre lot vous sera envoyé prochainement.</p>
        </div>
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
const selectedSection = ref(null)

// Charger les données au montage du composant
onMounted(() => {
  // Récupérer les lots depuis le localStorage
  const lotsExistants = localStorage.getItem('jeuconcours_lots2')
  if (lotsExistants) {
    lots.value = JSON.parse(lotsExistants)
    // Créer les sections de la roue avec les lots
    initializeSections()
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

  // Vérifier le nombre de participations de l'utilisateur
  const participationsUtilisateur = localStorage.getItem('jeuconcours_participations_utilisateur2')
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
  // Créer un tableau avec exactement une section pour chaque lot et le reste en perdu
  // On commence par Giagia à 12h (index 1)
  sections.value = [
    { id: 3, nom: 'Perdu', index: 1 },
    { id: 3, nom: 'Perdu', index: 2 },
    { id: 3, nom: 'Perdu', index: 3 },
    { id: 1, nom: '10€ Giagia', index: 4 },
    { id: 2, nom: '10€ FA Coaching', index: 5 },
    { id: 3, nom: 'Perdu', index: 6 },
    { id: 3, nom: 'Perdu', index: 7 },
    { id: 3, nom: 'Perdu', index: 8 },
    { id: 3, nom: 'Perdu', index: 9 },
    { id: 3, nom: 'Perdu', index: 10 },
    { id: 3, nom: 'Perdu', index: 11 },
    { id: 3, nom: 'Perdu', index: 12 }
  ];
}

// Fonction pour calculer la section gagnante
function getSelectedSection(rotation) {
  if (!sections.value || sections.value.length === 0) {
    return null;
  }

  // Convertir la rotation en degrés et inverser le sens (-rotation)
  let degrees = (-rotation * 180 / Math.PI) % 360;
  
  // S'assurer que les degrés sont positifs
  if (degrees < 0) {
    degrees += 360;
  }
  
  // Calculer l'index (12 sections de 30 degrés chacune)
  const index = (Math.floor(degrees / 30) % 12) + 1;
  
  // Calculer l'index précédent et suivant
  const prevIndex = index === 1 ? 12 : index - 1;
  const nextIndex = index === 12 ? 1 : index + 1;

  // Vérifier que les index sont valides
  const prevSection = sections.value[prevIndex - 1];
  const currentSection = sections.value[index - 1];
  const nextSection = sections.value[nextIndex - 1];

  if (!currentSection) {
    console.error('Section non trouvée pour index:', index);
    return null;
  }

  console.log('Position de la roue:', {
    rotationDegres: degrees.toFixed(2) + '°',
    indexPrecedent: {
      index: prevIndex,
      nom: prevSection?.nom || 'N/A'
    },
    indexActuel: {
      index: index,
      nom: currentSection.nom
    },
    indexSuivant: {
      index: nextIndex,
      nom: nextSection?.nom || 'N/A'
    },
    angleParSection: '30°',
    debutSection: ((index - 1) * 30) + '°',
    finSection: (index * 30) + '°'
  });

  return currentSection;
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
  sections.value.forEach((section, i) => {
    // Convertir l'index 1-12 en position 0-11 pour le calcul des angles
    const index = i;
    
    // Chaque section fait 30 degrés, avec un décalage initial de -15 degrés
    const startAngle = (index * (Math.PI / 6)) - (Math.PI / 12);
    const endAngle = ((index + 1) * (Math.PI / 6)) - (Math.PI / 12);

    // Dessiner le secteur
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    // Couleur de la section
    ctx.fillStyle = '#1D4ED8';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ajouter le texte
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + (Math.PI / 12));
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

  const totalTirages = parseInt(localStorage.getItem('total_tirages') || '0');
  const nouveauTirage = totalTirages + 1;
  
  let forceRotation;
  if (nouveauTirage === 3) {
      forceRotation = (5 * 2 * Math.PI) + (3 * Math.PI / 6);
  } else if (nouveauTirage === 6) {
      forceRotation = (5 * 2 * Math.PI) + (4 * Math.PI / 6);
  } else {
    const perduRotations = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11].map(i => i * Math.PI / 6);
    forceRotation = (5 * 2 * Math.PI) + perduRotations[Math.floor(Math.random() * perduRotations.length)];
  }

  localStorage.setItem('total_tirages', nouveauTirage.toString());

  const targetRotation = forceRotation;
  
  isSpinning.value = true;
  winner.value = null;
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
      
      // Obtenir la section sous le point vert
      selectedSection.value = getSelectedSection(currentRotation);
      
      if (selectedSection.value) {
        const calculatedIndex = (Math.floor((-currentRotation * 180 / Math.PI) / 30) % 12) + 1;
        const prevIndex = calculatedIndex === 1 ? 12 : calculatedIndex - 1;
        const nextIndex = calculatedIndex === 12 ? 1 : calculatedIndex + 1;

        console.log('Résultat final:', {
          rotationFinale: (-currentRotation * 180 / Math.PI).toFixed(2) + '°',
          indexPrecedent: {
            index: prevIndex,
            nom: sections.value[prevIndex - 1]?.nom || 'N/A'
          },
          indexActuel: {
            index: calculatedIndex,
            nom: selectedSection.value.nom
          },
          indexSuivant: {
            index: nextIndex,
            nom: sections.value[nextIndex - 1]?.nom || 'N/A'
          }
        });
      }
      
      // Utiliser le lot sous le point vert
      if (selectedSection.value && selectedSection.value.nom === 'Perdu') {
        winner.value = 'perdu';
      } else if (selectedSection.value) {
        winner.value = selectedSection.value.nom;
        
        try {
          const userId = user.value?.id;
          if (userId) {
            await saveWinToDatabase(userId, selectedSection.value.nom);
          }
        } catch (e) {
          // Gérer l'erreur silencieusement
        }

        // Mettre à jour le nombre de gagnants
        nombreGagnants.value++;
        localStorage.setItem('jeuconcours_gagnants2', nombreGagnants.value.toString());
      }

      // Mettre à jour les participations
      const participationsUtilisateur = parseInt(localStorage.getItem('jeuconcours_participations_utilisateur2') || '0');
      const nouvellesParticipations = participationsUtilisateur + 1;
      localStorage.setItem('jeuconcours_participations_utilisateur2', nouvellesParticipations.toString());
      
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