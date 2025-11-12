<script setup>
import BackButton from '@/components/BackButton.vue'
definePageMeta({
  showHeader: false
})
</script>
<template>
  <div>
    <div class="py-24">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton />
        <p class="text-xl uppercase font-bold mb-8 text-blue-800">Conditions Générales d'Utilisation de Grinch</p>
        <p class="mb-4 text-sm italic">Dernière mise à jour : 7 octobre 2024</p>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">1. Acceptation des conditions</h2>
            <p class="mb-4">En utilisant l'application Grinch, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre application.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">2. Description du service</h2>
            <p class="mb-4">Grinch est une application de carte de fidélité multi-enseigne permettant aux utilisateurs de collecter et gérer des points de fidélité auprès de différentes enseignes partenaires.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">3. Inscription et compte utilisateur</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Pour utiliser Grinch, vous devez créer un compte en fournissant des informations précises et à jour.</li>
                <li class="mb-2">Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte.</li>
                <li class="mb-2">Vous pouvez supprimer votre compte à tout moment depuis votre espace personnel sur l'application.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">4. Utilisation du service</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Vous vous engagez à utiliser Grinch conformément aux lois en vigueur et à ces CGU.</li>
                <li class="mb-2">Il est interdit d'utiliser Grinch à des fins illégales ou non autorisées.</li>
                <li class="mb-2">Vous acceptez de ne pas interférer avec ou perturber le fonctionnement de l'application.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">5. Géolocalisation</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Grinch utilise la géolocalisation uniquement pour afficher les boutiques à proximité de votre position actuelle.</li>
                <li class="mb-2">Vous pouvez activer ou désactiver cette fonctionnalité à tout moment dans les paramètres de l'application ou de votre appareil.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">6. Propriété intellectuelle</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Tous les droits de propriété intellectuelle relatifs à Grinch et son contenu sont la propriété exclusive de [Nom de votre entreprise].</li>
                <li class="mb-2">Vous n'êtes pas autorisé à copier, modifier, distribuer ou utiliser à des fins commerciales tout élément de l'application sans autorisation écrite préalable.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">7. Confidentialité des données</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">La collecte et l'utilisation de vos données personnelles sont régies par notre Politique de Confidentialité, qui fait partie intégrante de ces CGU.</li>
                <li class="mb-2">En utilisant Grinch, vous consentez à la collecte et au traitement de vos données conformément à notre Politique de Confidentialité.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">8. Responsabilités et garanties</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Grinch s'efforce de fournir un service de qualité, mais ne peut garantir que l'application sera exempte d'erreurs ou disponible en permanence.</li>
                <li class="mb-2">Grinch n'est pas responsable des pertes ou dommages résultant de l'utilisation ou de l'impossibilité d'utiliser l'application.</li>
                <li class="mb-2">Vous êtes seul responsable de votre utilisation de l'application et des conséquences qui en découlent.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">9. Modification du service et des CGU</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Grinch se réserve le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment.</li>
                <li class="mb-2">Nous nous réservons le droit de modifier ces CGU à tout moment. Les modifications prendront effet dès leur publication sur l'application.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">10. Résiliation</h2>
            <ol class="list-decimal pl-6">
                <li class="mb-2">Vous pouvez résilier votre compte à tout moment en suivant les instructions dans l'application.</li>
                <li class="mb-2">Grinch se réserve le droit de suspendre ou résilier votre compte en cas de violation de ces CGU.</li>
            </ol>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">11. Loi applicable et juridiction</h2>
            <p class="mb-4">Ces CGU sont régies par le droit français. Tout litige relatif à l'interprétation ou à l'exécution de ces CGU sera soumis aux tribunaux compétents de [Ville de votre siège social].</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">12. Contact</h2>
            <p class="mb-4">Pour toute question concernant ces CGU, veuillez nous contacter à l'adresse suivante : <a href="mailto:contact@grinch.fr" class="text-blue-800 hover:underline">contact@grinch.fr</a></p>
        </section>

        <p class="mt-8 text-sm">En utilisant Grinch, vous reconnaissez avoir lu, compris et accepté ces Conditions Générales d'Utilisation.</p>
    </div>
  </div>
  </div>
</template>