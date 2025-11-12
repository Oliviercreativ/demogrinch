<template>
  <div>
    <div class="text-xs font-semibold text-red-800 uppercase">
      <button @click="readNFC">Lire Tag NFC</button>
      <div v-if="nfcData">Données NFC : {{ nfcData }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const nfcData = ref(null);
const navigateToPage = () => {
  if (nfcData.value) {
    const slug = nfcData.value;
    this.$router.push({ path: `/merci?boutique=${slug}` });
  }
};

const readNFC = async () => {
  if ('NFC' in window) {
    try {
      const nfc = new NDEFReader();
      await nfc.scan();
      nfc.onreading = (event) => {
        const message = event.message;
        for (const record of message.records) {
          if (record.recordType === "text") {
            nfcData.value = new TextDecoder().decode(record.data);
          }
        }
      };
    } catch (error) {
      console.error("Erreur lors de la lecture du tag NFC : ", error);
    }
  } else {
    alert("NFC n'est pas supporté sur cet appareil.");
  }
  navigateTo();
};

</script>