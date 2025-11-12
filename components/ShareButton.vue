<script setup>
const share = () => {
  if (navigator.share) {
    navigator.share({
      title: 'GRINCH',
      text: 'Découvrez GRINCH!',
      url: window.location.href
    }).then(() => {
      console.log('Contenu partagé avec succès')
    }).catch((error) => {
      console.error('Erreur lors du partage', error)
    })
  } else {
    alert("Votre navigateur ne supporte pas l'API de partage.")
  }
}
</script>
<template>
  <button @click="share" class="flex items-center justify-center flex-col gap-2" aria-label="Partager">
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-share stroke-blue-800" width="36" height="36" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
        <path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
        <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
        <path d="M8.7 10.7l6.6 -3.4" />
        <path d="M8.7 13.3l6.6 3.4" />
      </svg>
      <p class="text-xs text-blue-800 text-center text-balance font-medium">Partagez à vos amis</p>
  </button>
</template>
