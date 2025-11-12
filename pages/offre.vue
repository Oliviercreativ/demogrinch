<script setup>
import { useRouter } from '#imports'
import { ref } from 'vue'
import SimplePricing from '@/components/SimplePricing.vue';

const router = useRouter()
const isYearly = ref(false)
const user = useSupabaseUser()

definePageMeta({
  showHeader: false,
  showNavbar: false,
})

const faqItems = ref([
  {
    question: "Pourquoi fidéliser vos clients",
    answer: "La fidélisation est un levier puissant pour développer votre activité. Garder vos clients actuels coûte moins cher que d’en acquérir de nouveaux, et un client fidèle est plus susceptible d’effectuer des achats répétés. <br><br>En proposant un programme de fidélité attractif via “GRINCH”, vous augmentez non seulement leur satisfaction, mais vous les incitez également à revenir régulièrement.Attirer de Nouveaux Clients et Augmenter Votre Chiffre d’Affaires. <br><br>L’application ne se limite pas à fidéliser vos clients existants : elle est aussi un excellent outil pour attirer de nouveaux consommateurs. En offrant des avantages clairs et des récompenses motivantes, vous vous démarquez de la concurrence et suscitez l’intérêt des clients potentiels.<br><br> Chaque nouveau client représente une opportunité d’augmenter votre chiffre d’affaires, renforçant ainsi la viabilité économique de votre commerce.“GRINCH” va au-delà d’une simple carte de fidélité. Elle a été créée pour enrichir et dynamiser le commerce local en renforçant les liens entre commerçants et clients. En rejoignant cette application multi-enseignes, vous devenez acteur d’une communauté commerciale solidaire qui valorise l’achat local et soutient l’économie de Conflans-Sainte-Honorine.",
    isOpen: false
  },
  {
    question: "Les avantages clés de l’application",
    answer: "• Simplicité d’utilisation : Un simple scan du QR code suffit pour attribuer des points.<br>• Personnalisation : Offrez des récompenses adaptées à votre clientèle.<br>• Visibilité accrue : Intégrez un réseau multi-enseignes qui attire plus de clients.<br>• Digitalisation : Modernisez votre approche commerciale avec une solution numérique.<br>• Impact local : Participez activement à la dynamisation du commerce local.<br>Ensemble, Construisons l’Avenir du Commerce Local",
    isOpen: false
  },
  {
    question: "Rejoingnez la communauté",
    answer: "L’application “GRINCH” n’est pas seulement une solution technologique ; c’est un outil pour créer une communauté forte et visible à Conflans-Sainte-Honorine. En adoptant cette innovation, vous contribuez à bâtir un écosystème commercial solidaire où chaque acteur bénéficie du soutien collectif.<br><br>Rejoignez-nous dès maintenant pour découvrir comment “GRINCH” peut transformer votre activité, fidéliser vos clients et booster votre chiffre d’affaires. Ensemble, faisons du commerce local une force incontournable dans le paysage économique moderne.",
    isOpen: false
  },
])

const toggleItem = (index) => {
  faqItems.value[index].isOpen = !faqItems.value[index].isOpen
}

onMounted(async () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }
})
</script>

<template>
  <div class="min-h-screen max-w-6xl flex items-center justify-center">
    <div class="max-w-xl w-full space-y-8 pt-4 pb-24 px-4">
      <div class="text-left">
        <!-- Icône de succès -->
        <div class="mx-auto flex items-center justify-center">
          <img src="https://api.grinch.fr/storage/v1/object/public/image/covers/screenshot-2024-12-04-a-21.48.53.jpg" />
        </div>

        <h2 class="text-xl font-semibold uppercase text-blue-800 mb-4">
          Fidélisez vos clients et boostez votre activité
        </h2>
        <p class="text-gray-800 mb-8 text-left">
          <span class="font-semibold">L’essence même de l’application “GRINCH” repose sur la fidélisation de vos clients grâce à une carte de fidélité innovante et simple d’utilisation. Fidéliser vos clients, c’est non seulement les remercier pour leur confiance, mais aussi leur offrir une raison de revenir chez vous régulièrement. En proposant un programme de fidélité attractif, vous augmentez vos chances de conserver vos clients actuels tout en renforçant leur engagement envers votre enseigne.</span>
        </p>
        <p class="text-gray-800 mb-8 text-left">
          <span class="font-semibold">Mais ce n’est pas tout</span> : une carte de fidélité est également un excellent levier pour attirer de nouveaux clients. En offrant des avantages clairs et des récompenses motivantes, vous vous démarquez de la concurrence et donnez envie à de nouveaux consommateurs de découvrir vos produits ou services. Et qui dit nouveaux clients dit également opportunités d’augmenter votre chiffre d’affaires.
        </p>
        <p class="text-gray-800 mb-8 text-left">
          Avec l’application “GRINCH”, vous bénéficiez d’une solution multi-enseignes qui enrichit le commerce local tout en dynamisant votre activité. Grâce à un simple scan de QR code, vos clients accumulent des points qu’ils peuvent échanger contre des récompenses définies par vous. C’est une façon moderne et efficace de les fidéliser tout en valorisant leur expérience.
        </p>
        <p class="text-gray-800 mb-8 text-left">
          Rejoignez-nous pour découvrir comment cette application peut transformer votre relation client, renforcer votre communauté et contribuer directement à la croissance de votre chiffre d’affaires. Ensemble, faisons de la fidélisation un outil puissant pour développer le commerce local !
        </p>
        <div v-for="(item, index) in faqItems" :key="index" class="mb-4">
          <button
            @click="toggleItem(index)"
            class="flex justify-between items-center w-full text-left p-4 transition-colors duration-200 rounded-lg border border-blue-800"
          >
            <span class="font-normal text-blue-800 text-sm pr-5">{{ item.question }}</span>
            <svg
              class="w-5 h-5 transition-transform duration-200 stroke-blue-800"
              :class="{ 'transform rotate-180': item.isOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div v-show="item.isOpen" class="p-2">
            <div v-html="item.answer" class="text-sm"></div>
          </div>
        </div>
        
        <div class="py-6">
          <span class="text-left font-semibold text-blue-800 uppercase">Comment ça marche  ?</span>
          <ol>
            <li>1 - Je me connect à Stripe pour choisir mon abonnement</li>
            <li>2 - Je remplis le formulaire pour créer ma boutique</li>
            <li>3 - A nous de jouer pour valider votre inscription et créer votre présentoir</li>
          </ol>
        </div>

        

        <div class="space-y-4">
          <span class="text-left font-semibold text-blue-800 uppercase">Je souhaite souscrire au programme de fidélité</span>
          <SimplePricing />
        </div>
      </div>
    </div>
  </div>
</template>