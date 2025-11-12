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
        <p class="text-xl uppercase font-bold mb-8 text-blue-800">Politique de Confidentialité de Grinch</p>
        <p class="mb-4 text-sm italic">Dernière mise à jour : 7 octobre 2024</p>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">1. Introduction</h2>
            <p class="mb-4">Bienvenue sur Grinch, votre application de carte de fidélité multi-enseigne. Chez Grinch, la protection de vos données personnelles est notre priorité absolue. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">2. Collecte des données</h2>
            <p class="mb-4">Nous collectons les types d'informations suivants :</p>
            <ul class="list-disc pl-6 mb-4">
                <li>Informations d'inscription : nom, prénom, adresse e-mail</li>
                <li>Données de géolocalisation (avec votre consentement)</li>
                <li>Données d'utilisation de l'application</li>
                <li>Informations sur les points de fidélité accumulés</li>
            </ul>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">3. Utilisation des données</h2>
            <p class="mb-4">Vos données sont utilisées exclusivement pour :</p>
            <ul class="list-disc pl-6 mb-4">
                <li>Gérer votre compte et vos points de fidélité</li>
                <li>Afficher les boutiques à proximité de votre position actuelle</li>
                <li>Améliorer nos services et votre expérience utilisateur</li>
            </ul>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">4. Géolocalisation</h2>
            <p class="mb-4">La géolocalisation est utilisée uniquement pour afficher les boutiques aux alentours de votre position actuelle. Cette fonctionnalité nécessite votre consentement explicite et peut être désactivée à tout moment dans les paramètres de votre appareil ou de l'application.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">5. Cookies et technologies similaires</h2>
            <p class="mb-4">Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience sur notre plateforme. Nous utilisons uniquement :</p>
            <ul class="list-disc pl-6 mb-4">
                <li>Google Analytics : pour analyser le trafic et l'utilisation du site</li>
                <li>Microsoft Clarity : pour comprendre le comportement des utilisateurs</li>
            </ul>
            <p class="mb-4">Les cookies sont stockés conformément aux directives de la CNIL, pour une durée maximale de 13 mois.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">6. Partage des données</h2>
            <p class="mb-4">Grinch s'engage à ne pas vendre, louer ou partager vos données personnelles avec des tiers, à l'exception des cas suivants :</p>
            <ul class="list-disc pl-6 mb-4">
                <li>Partage limité avec les enseignes partenaires : Une enseigne a uniquement accès à votre nom, prénom et au nombre de scans effectués dans sa boutique, et ce, uniquement si vous avez accumulé des points de fidélité dans cet établissement.</li>
                <li>Services tiers : Nous utilisons Google Analytics et Microsoft Clarity pour améliorer nos services. Ces entreprises ont accès à certaines de vos données d'utilisation, mais sont tenues de les traiter conformément à leurs propres politiques de confidentialité et aux lois applicables.</li>
            </ul>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">7. Sécurité des données</h2>
            <p class="mb-4">Nous mettons en place des mesures de sécurité techniques et organisationnelles pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">8. Vos droits</h2>
            <p class="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul class="list-disc pl-6 mb-4">
                <li>Droit d'accès à vos données personnelles</li>
                <li>Droit de rectification de vos données</li>
                <li>Droit à l'effacement de vos données ("droit à l'oubli")</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité de vos données</li>
                <li>Droit d'opposition au traitement de vos données</li>
                <li>Droit de ne pas faire l'objet d'une décision fondée exclusivement sur un traitement automatisé</li>
            </ul>
            <p class="mb-4">Pour exercer ces droits, veuillez contacter notre DPO à l'adresse : <a href="mailto:contact@grinch.fr" class="text-blue-800 hover:underline">contact@grinch.fr</a></p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">9. Conservation des données</h2>
            <p class="mb-4">Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Les données relatives aux points de fidélité sont conservées tant que votre compte est actif.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">10. Modifications de la politique de confidentialité</h2>
            <p class="mb-4">Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec une date de dernière mise à jour révisée.</p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">11. Contact</h2>
            <p class="mb-4">Pour toute question concernant cette politique de confidentialité ou vos données personnelles, veuillez contacter notre Délégué à la Protection des Données (DPO) à l'adresse suivante : <a href="mailto:contact@grinch.fr" class="text-blue-800 hover:underline">contact@grinch.fr</a></p>
        </section>

        <section class="mb-8">
            <h2 class="text-lg uppercase font-semibold mb-4 text-blue-800">12. Autorité de contrôle compétente</h2>
            <p class="mb-4">Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) - <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" class="text-blue-800 hover:underline">www.cnil.fr</a>.</p>
        </section>
    </div>
  </div>
  </div>
</template>