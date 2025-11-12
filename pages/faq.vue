<script setup>
import { ref } from 'vue'

definePageMeta({
  showHeader: false
})

const faqItems = ref([
  {
    question: "Qu'est-ce que GRINCH ?",
    answer: "GRINCH est une initiative locale visant à promouvoir les commerces et artisans de Conflans-Sainte-Honorine. Vous pouvez retrouver plus de 70 professionnels de Conflans dans notre annuaire.<br><a href='https://www.madeinconflans.fr' target='_blank'><b>Voir le site web</b></a>",
    isOpen: false
  },
  {
    question: "Comment fonctionne le programme de fidélité ?",
    answer: "Chaque fois que vous scannez le QR code dans un commerce participant (une fois par jour), vous gagnez un point. Accumulez suffisamment de points pour obtenir des récompenses !",
    isOpen: false
  },
  {
    question: "Où puis-je trouver la liste des commerces participants ?",
    answer: "Vous pouvez trouver la liste complète des commerces participants sur notre application mobile.",
    isOpen: false
  },
  {
    question: "Lorsque je scanne un QRCODE, le point de fidélité est-il ajouté automatiquement ?",
    answer: "Oui, lorsque vous scannez un QRCODE, le point de fidélité est ajouté automatiquement. Vous pouvez également ajouter un point manuellement en cliquant sur le bouton 'Ajouter un point'.",
    isOpen: false
  },
  {
    question: "J'ai installé l'application, mais mon appareil photo ne marche plus pour scanner le QRCODE ?",
    answer: "Une mise àjour a été faite, il suffit de désinstaller et réinstaller l'application pour que les changements prennent effet.",
    isOpen: false
  },
  { 
    question: "Comment installer l'application sur mon écran d'accueil ?",
     answer: `
      <ol>
        <li>Appuyez sur le bouton de partage de votre navigateur</li>
        <li>Faites défiler et appuyez sur 'Ajouter à l'écran d'accueil'</li>
        <li>Appuyez sur 'Ajouter' en haut à droite</li>
      </ol>
    `,
    isOpen: false
  },
  {
    question: "Comment je peux inviter un ami ou un commerçant à l'application ?",
    answer: "Vous pouvez inviter un ami ou un commerçant à l'application en cliquant sur le bouton <b>Partager</b>. Ils recevront un lien vers l'application et pourront l'ajouter à leur écran d'accueil.",
    isOpen: false
  },
  {
    question: "Sur mon profil, j'ai des centre d'intérêt, comment les ajouter ?",
    answer: "Selectionnez le centre d'intérêts que vous souhaitez ajouter, puis cliquez sur le bouton 'Mettre à jour mes préferences'. Vous pouvez également ajouter vos boutiques préférées'.",
    isOpen: false
  },
  {
    question: "Pourquoi il y a une bulle rouge ou verte ou jaune à coté du nom des boutiques ?",
    answer: "Les bulles de couleurs sont des indicateurs de statut de la boutique. Elles indiquent si la boutique est ouverte, fermée ou en cours de fermeture.",
    isOpen: false
  },
])

const toggleItem = (index) => {
  faqItems.value[index].isOpen = !faqItems.value[index].isOpen
}
</script>
<template>
  <div class="max-w-2xl mx-auto px-4 pb-24">
    <p class="text-lg uppercase text-blue-800 font-semibold mb-4 pt-7 pb-10">Comment ça marche</p>
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
      <div v-show="item.isOpen" class="mt-2 p-4 rounded-lg shadow">
        <div v-html="item.answer" class="text-sm"></div>
      </div>
    </div>
  </div>
</template>