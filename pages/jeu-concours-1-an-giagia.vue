<template>
  <div class="container mx-auto px-4 pt-2 pb-24">
    <div class="max-w-xl mx-auto bg-white rounded-lg p-6">
      <!-- En-tête -->
      <div class="text-center">
        <div class="flex items-center justify-center gap-4">
          <img src="https://media.madeinconflans.fr/wp-content/uploads/2024/05/6452416fef45718de89d7925_giagia-beige-2-p-500.png" class="w-1/2 h-48 object-contain mx-auto">
          <img src="https://api.grinch.fr/storage/v1/object/public/image//Logo%20creativconflans.png" class="w-1/2 h-32 object-contain mx-auto">
        </div>
        <h1 class="text-2xl text-blue-800 font-bold text-center mb-2">Jeu Concours 1 an Giagia <br> Giagia x Mysteria Ingenium</h1>
        <p class="text-gray-600 mb-2">Dimanche 25 mai 2025</p>
         <p class="text-gray-600 mb-2">Tenter de gagner 1 des 2 goûters offert par Giagia, bonne chance</p>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <div v-else>
        <!-- Roulette -->
        <div class="flex flex-col items-center my-8">
          <div
            class="w-64 h-64 flex items-center justify-center border-4 border-blue-300 rounded-full text-4xl font-bold transition-all duration-200 bg-white"
            :class="{ 'animate-spin-slow': isSpinning }"
          >
            <span v-if="rouletteText">{{ rouletteText }}</span>
            <span v-else>&nbsp;</span>
          </div>
        </div>

        <!-- Bouton pour participer -->
        <div v-if="!aJoue && nombreParticipants < maxParticipants && nombreGagnants < maxWinners">
          <button
            @click="lancerRoulette"
            class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-4 transition duration-200"
            :disabled="isSpinning"
          >
            Tenter votre chance !
          </button>
        </div>
        
        <!-- Message si jeu terminé -->
        <div v-else-if="nombreParticipants >= maxParticipants || nombreGagnants >= maxWinners" class="my-8 p-4 bg-yellow-100 rounded-lg text-center">
          <h3 class="font-bold text-lg text-yellow-800">Jeu terminé !</h3>
          <p class="text-yellow-700">
            {{ nombreGagnants >= maxWinners ? 'Les 4 lots ont déjà été gagnés.' : 'Les 1000 participations ont été atteintes.' }}
          </p>
        </div>
        
        <!-- Résultat -->
        <div v-if="aJoue && estGagnant !== null" class="mt-6 p-6 rounded-lg text-center" :class="estGagnant ? 'bg-blue-100' : 'bg-red-50'">
          <div v-if="estGagnant" class="text-blue-600">
            <p class="text-2xl mb-3 font-bold">🎉 Gagné !</p>
            <p class="text-xl">Félicitations ! Vous avez gagné un goûter chez Giagia !</p>
            <p class="text-lg mt-2">Un mail avec le message de félicitation vous sera envoy et vous pouvez retrouvez votre cadeaux dans votre messagerie. Présentez le message de félicitation à Giagia pour recevoir votre goûter.</p>
            <NuxtLink to="/notifications" class="text-blue-600 hover:underline">Consultez ma messagerie</NuxtLink>
          </div>
          <div v-else class="text-red-600">
            <p class="text-2xl mb-3 font-bold">😢 Perdu !</p>
            <p class="text-xl">Désolé, vous n'avez pas gagné cette fois-ci.</p>
            <p class="text-lg mt-2">Merci pour votre participation !</p>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-600 text-center">
          <img src="https://media.madeinconflans.fr/wp-content/uploads/2024/05/whatsapp-image-2024-05-31-at-17.11.42.jpeg" class="w-0full rounded-md object-contain mx-auto mb-4">
          <p>Cumulez des points à chaque achat chez Giagia pour un cadeau avec GRINCH votre nouvelle carte de fidélité à Conflans Ste Honorine.</p>
        </div>
      </div>
    </div>
    <div class="flex justify-center mt-6">
        <NuxtLink to="/shop/giagia-coffee" class="text-white bg-blue-800 px-6 py-3 rounded-lg text-center cursor-pointer hover:bg-blue-700 transition-colors">
      Découvrez Giagia
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

// Supabase client
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

// Paramètres du jeu
const maxParticipants = 100
const maxWinners = 2

// IMPORTANT: Vérifier que cette valeur correspond exactement à celle dans la base de données
// y compris les majuscules, minuscules et espaces
const partenaire = 'jeu concours 1 an Giagia'

// Alternative pour le filtrage si la valeur exacte n'est pas connue
const partenaireAlternatives = [
  'jeu concours 1 an giagia',
  'Jeu concours 1 an giagia',
  'jeu concours 1 an Giagia',
  'Jeu Concours 1 an Giagia',
  'jeu-concours-1-an-giagia'
]

// Etats du jeu
const nombreParticipants = ref(0)
const nombreGagnants = ref(0)
const aJoue = ref(false)
const estGagnant = ref(null) // true, false ou null
const isSpinning = ref(false)
const rouletteText = ref('')
const loading = ref(true)
const showAdminPanel = ref(false)
const participantsData = ref([])  // Données des participants pour l'affichage admin

// Positions gagnantes prédéfinies (5e, 15e, 25e et 35e participants)
const positionsGagnantes = [4, 8]

// Participations simulées pour démarrer le jeu (pour test)
const participationsSimulees = ref(0)

// Chargement des données au démarrage
onMounted(async () => {
  try {
    // Vérifier si l'utilisateur est connecté
    if (!user.value) {
      // Rediriger vers la page d'authentification
      await router.push('/jeux-concours-auth')
      return
    }
    await chargerDonnees()
    
    // Vérifier dans Supabase si l'utilisateur a déjà participé
    if (!aJoue.value && user.value) {
      const { data } = await supabase
        .from('user_wins')
        .select('*')
        .eq('user_id', user.value.id)
        .eq('partenaires', partenaire)
        .single()
      
      if (data) {
        aJoue.value = true
        estGagnant.value = data.lot_name === 'gagnant'
        rouletteText.value = estGagnant.value ? 'Gagnant' : 'Perdu'
        
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    loading.value = false
  }
})

// Initialiser des participations simulées pour démarrer le jeu
function initialiserParticipationsSimulees() {
  // Pour les tests, on simule qu'il y a déjà eu 3 participations
  // Ainsi, le prochain joueur sera le 4e, et le 5e sera gagnant
  participationsSimulees.value = 3
  
  // On peut aussi simuler qu'il y a déjà eu des gagnants
  // nombreGagnants.value = 1
}

// Fonction pour enregistrer la participation dans la base de données
async function saveWinToDatabase(userId, lotName) {
  try {
    console.log('Tentative d\'insertion:', { userId, lotName, partenaire });
    const { data, error } = await supabase
      .from('user_wins')
      .insert([
        { 
          user_id: userId, 
          lot_name: lotName,
          win_date: new Date().toISOString(),
          created_date: new Date().toISOString(),
          partenaires: partenaire
        }
      ])
      .select();

    if (error) {
      console.error('Erreur lors de l\'insertion du lot gagné:', error.message);
      return false;
    }

    console.log('Participation enregistrée dans la base de données:', data);
    return true;
  } catch (e) {
    console.error('Erreur inattendue:', e);
    return false;
  }
}

// Charger le nombre de participations et de gagnants depuis Supabase
async function chargerDonnees() {
  console.log('Début de chargerDonnees()')
  console.log('Partenaire utilisé pour le filtre:', partenaire)
  
  // Vérifier tous les enregistrements pour déboguer
  const { data: allRecords, error: recordsError } = await supabase
    .from('user_wins')
    .select('*')
  
  console.log('Tous les enregistrements dans user_wins:', allRecords)
  if (recordsError) {
    console.error('Erreur lors de la récupération de tous les enregistrements:', recordsError)
  }
  
  // Afficher la liste des user_id qui ont fait tourner la roue
  if (allRecords && allRecords.length > 0) {
    const userIds = allRecords.map(record => record.user_id);
    console.log('Liste des user_id qui ont fait tourner la roue:', userIds);
    
    // Créer un objet avec le nombre de participations par user_id
    const userParticipations = {};
    allRecords.forEach(record => {
      if (record.user_id) {
        userParticipations[record.user_id] = (userParticipations[record.user_id] || 0) + 1;
      }
    });
    console.log('Nombre de participations par user_id:', userParticipations);
    
    // Stocker les données pour l'affichage (filtrées par partenaire)
    participantsData.value = allRecords.map(record => ({
      userId: record.user_id,
      date: record.created_at,
      result: record.lot_name,
      partenaire: record.partenaires
    }));
  }
  
  // Récupérer TOUS les enregistrements de la table user_wins sans filtre
  const { data: allUserWins, error: allWinsError } = await supabase
    .from('user_wins')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (allUserWins && allUserWins.length > 0) {
    console.log('TOUS les enregistrements de la table user_wins:', allUserWins);
    
    // Remplacer les données pour l'affichage par TOUS les enregistrements
    participantsData.value = allUserWins.map(record => ({
      userId: record.user_id,
      date: record.created_at,
      result: record.lot_name,
      partenaire: record.partenaires
    }));
  }
  
  if (allWinsError) {
    console.error('Erreur lors de la récupération de tous les enregistrements user_wins:', allWinsError);
  }
  
  // Filtrer manuellement pour voir combien d'enregistrements correspondent au partenaire (avec alternatives)
  const filteredRecords = allRecords ? allRecords.filter(record => {
    // Vérifier si le partenaire correspond à l'une des alternatives
    const matchesAny = partenaireAlternatives.some(alt => record.partenaires === alt);
    
    // Afficher les valeurs pour déboguer
    if (record.partenaires) {
      console.log(`Comparaison: '${record.partenaires}' vs '${partenaire}' => ${record.partenaires === partenaire}`);
    }
    
    return matchesAny || record.partenaires === partenaire;
  }) : [];
  
  console.log(`Enregistrements filtrés pour partenaire '${partenaire}' (avec alternatives):`, filteredRecords)
  
  // Compter le nombre total de participations (sans filtre de partenaire pour déboguer)
  const { count: allParticipations } = await supabase
    .from('user_wins')
    .select('*', { count: 'exact', head: true })
  
  console.log('Nombre TOTAL de participations dans la table:', allParticipations)
  
  // Compter avec le filtre de partenaire
  const { count: totalParticipations, error: countError } = await supabase
    .from('user_wins')
    .select('*', { count: 'exact', head: true })
    .eq('partenaires', partenaire)
  
  console.log('Nombre de participations retourné par Supabase:', totalParticipations)
  if (countError) {
    console.error('Erreur lors du comptage des participations:', countError)
  }
  
  // Compter le nombre de gagnants
  const { count: totalGagnants, error: winnersError } = await supabase
    .from('user_wins')
    .select('*', { count: 'exact', head: true })
    .eq('partenaires', partenaire)
    .eq('lot_name', 'gagnant')
  
  console.log('Nombre de gagnants retourné par Supabase:', totalGagnants)
  if (winnersError) {
    console.error('Erreur lors du comptage des gagnants:', winnersError)
  }
  
  // CORRECTION: Utiliser le nombre d'enregistrements filtrés manuellement plutôt que le résultat de la requête
  // Cela contourne le problème de filtrage avec le paramètre partenaire
  const actualParticipations = filteredRecords.length
  console.log('Nombre final de participations utilisé (filtré manuellement):', actualParticipations)
  
  // Ajouter les participations simulées aux participations réelles
  nombreParticipants.value = actualParticipations + participationsSimulees.value
  nombreGagnants.value = totalGagnants || 0
  
  console.log('nombreParticipants.value mis à jour:', nombreParticipants.value)
  console.log('nombreGagnants.value mis à jour:', nombreGagnants.value)
  
  // Initialiser les participations simulées si c'est la première fois
  if (actualParticipations === 0 && participationsSimulees.value === 0) {
    initialiserParticipationsSimulees()
    console.log('Participations simulées initialisées:', participationsSimulees.value)
  }
}

// Fonction pour lancer la roulette et enregistrer la participation
async function lancerRoulette() {
  if (aJoue.value || nombreParticipants.value >= maxParticipants || nombreGagnants.value >= maxWinners || isSpinning.value) {
    return
  }
  
  isSpinning.value = true
  rouletteText.value = ''
  
  // Animation de la roulette
  const sequence = ['Gagnant', 'Perdu', 'Perdu', 'Gagnant', 'Perdu', 'Perdu', 'Perdu', 'Gagnant', 'Perdu', 'Perdu', 'Perdu', 'Perdu']
  let idx = 0
  const interval = setInterval(() => {
    rouletteText.value = sequence[idx % sequence.length]
    idx++
  }, 80)
  
  try {
    // Récupérer le nombre exact de participations depuis la base de données
    await chargerDonnees()
    
    // Compter le nombre actuel de participations pour ce partenaire
    const { count: participationsActuelles, error: countError } = await supabase
      .from('user_wins')
      .select('*', { count: 'exact', head: true })
      .eq('partenaires', partenaire)
    
    if (countError) {
      console.error('Erreur lors du comptage des participations:', countError)
      throw new Error('Erreur lors du comptage des participations')
    }
    
    console.log('Nombre actuel de participations:', participationsActuelles)
    console.log('Partenaire utilisé pour le filtre:', partenaire)
    
    // Vérifier tous les enregistrements pour déboguer
    const { data: allRecords } = await supabase
      .from('user_wins')
      .select('*')
      .eq('partenaires', partenaire)
    
    console.log('Tous les enregistrements pour ce partenaire:', allRecords)
    
    // La nouvelle participation sera la suivante (participations actuelles + 1)
    const nouvellePosition = (participationsActuelles || 0) + 1
    console.log('Nouvelle position:', nouvellePosition)
    console.log('Positions gagnantes:', positionsGagnantes)
    
    // CORRECTION: Forcer un gagnant pour le 5ème participant
    let estUnGagnant = positionsGagnantes.includes(nouvellePosition)
    
    // Si nous avons exactement 5 participations et que la nouvelle sera la 6ème,
    // vérifions si nous avons déjà un gagnant
    if (nouvellePosition > 5) {
      const { count: gagnants } = await supabase
        .from('user_wins')
        .select('*', { count: 'exact', head: true })
        .eq('partenaires', partenaire)
        .eq('lot_name', 'gagnant')
      
      console.log('Nombre de gagnants actuels:', gagnants)
      
      // Si nous n'avons aucun gagnant mais que nous avons dépassé la position 5,
      // forcer le prochain participant à être gagnant
      if (gagnants === 0 && nouvellePosition > 5) {
        console.log('CORRECTION: Aucun gagnant trouvé après 5 participations, forçage du gagnant')
        estUnGagnant = true
      }
    }
    
    console.log('Décision finale - Est un gagnant:', estUnGagnant)
    
    // Vérifier que l'utilisateur est connecté
    if (!user.value) {
      throw new Error("Vous devez être connecté pour participer au jeu concours.")
    }
    
    const userId = user.value.id
    
    // Enregistrer la participation dans Supabase avec la fonction dédiée
    const resultatEnregistrement = await saveWinToDatabase(
      userId, 
      estUnGagnant ? 'gagnant' : 'perdu'
    )
    
    if (!resultatEnregistrement) {
      throw new Error("Erreur lors de l'enregistrement de votre participation.")
    }
    
    // Si l'utilisateur a gagné, envoyer un message de félicitation
    if (estUnGagnant) {
      await envoyerMessageFelicitation(userId)
    }
    
    // Mettre à jour l'interface
    setTimeout(() => {
      clearInterval(interval)
      
      if (estUnGagnant) {
        estGagnant.value = true
        rouletteText.value = 'Gagnant'
        nombreGagnants.value++
      } else {
        estGagnant.value = false
        rouletteText.value = 'Perdu'
      }
      
      aJoue.value = true
      isSpinning.value = false
      
      // Participation enregistrée dans Supabase
    }, 1700)
  } catch (error) {
    console.error('Erreur lors de la participation:', error)
    clearInterval(interval)
    isSpinning.value = false
    rouletteText.value = 'Erreur'
  }
}

// Fonction pour envoyer un message de félicitation au gagnant
async function envoyerMessageFelicitation(userId) {
  try {
    // Créer un message de félicitation
    const message = `Félicitations ! Vous avez gagné un goûter offert par Giagia dans le cadre du jeu concours 1 an Giagia. Présentez ce message dans la messagerie pour récupérer votre récompense.`
    
    // Calculer la date d'expiration (30 jours à partir d'aujourd'hui)
    const today = new Date()
    const expiryDate = new Date(today)
    expiryDate.setDate(today.getDate() + 30)
    
    // Insérer le message dans la table user_messages
    const { data, error } = await supabase
      .from('user_messages')
      .insert([
        {
          user_id: userId,
          message: message,
          is_read: false,
          expiry_date: expiryDate.toISOString(),
          boutique_slug: 'giagia-coffee'
        }
      ])
    
    if (error) {
      console.error('Erreur lors de l\'envoi du message de félicitation:', error)
      return false
    }
    
    console.log('Message de félicitation envoyé avec succès:', data)
    return true
  } catch (error) {
    console.error('Erreur inattendue lors de l\'envoi du message:', error)
    return false
  }
}
</script>

<style scoped>
.animate-spin-slow {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>