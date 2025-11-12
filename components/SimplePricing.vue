<!-- components/SimplePricing.vue -->
<script setup>
import { ref, computed } from 'vue'

const isYearly = ref(false)

const prices = [
  {
    name: 'Engagement 1 an',
    label: 'cet abonnement',
    monthlyPrice: 19,
    yearlyPrice: 199,
    engagement1mois: '2 mois offert',
    engagement1an: '1 mois pour tester',
    redirectUrl1mois: 'https://buy.stripe.com/cN29D6eJc35m000eUX',
    redirectUrl1an: 'https://buy.stripe.com/00g9D658CgWc144bIK',
    features: [
      'Vous choisissez votre récompense',
      'Définissez le nombre de passage en caisse​​',
      'Campagne de marketing par emailing et notifications push​',
      'Communiquer avec vos clients​'
    ]
  }
]

const handleSubscription = (url) => {
  window.open(url, '_blank', 'width=1000,height=800')
}

const getRedirectUrl = computed(() => {
  return (plan) => isYearly.value ? plan.redirectUrl1an : plan.redirectUrl1mois
})
</script>

<template>
  <div class="max-w-6xl mx-auto py-8">
    <div class="flex justify-center space-x-4 mb-8">
      <button 
        @click="isYearly = false"
        :class="[
          'px-6 py-2 rounded-lg',
          !isYearly ? 'bg-blue-800 text-white' : 'bg-gray-100'
        ]"
      >
        Mensuel
      </button>
      <button 
        @click="isYearly = true"
        :class="[
          'px-6 py-2 rounded-lg',
          isYearly ? 'bg-blue-800 text-white' : 'bg-gray-100'
        ]"
      >
        Annuel
      </button>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <div 
        v-for="plan in prices" 
        :key="plan.name"
        class="border rounded-lg p-4 bg-white"
      >
        <h3 class="text-md font-medium text-blue-800 uppercase mb-4">{{ plan.name }}</h3>
        <div class="mb-6">
          <span class="text-2xl font-semibold text-blue-800">
            {{ isYearly ? plan.yearlyPrice : plan.monthlyPrice }}€
          </span>
          <span class="text-blue-800">
            ht /{{ isYearly ? 'an' : 'mois' }}
          </span>
          <span class="uppercase text-blue-800 text-md block font-semibold">
            {{ isYearly ? plan.engagement1mois : plan.engagement1an }}
          </span>
        </div>

        <ul class="space-y-3 mb-6">
          <li 
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-center text-blue-800"
          >
            <svg 
              class="w-5 h-5 text-green-500 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
            {{ feature }}
          </li>
        </ul>

        <button
          @click="handleSubscription(getRedirectUrl(plan))"
          class="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-900 transition"
        >
          Choisir {{ plan.label }}
        </button>
      </div>
    </div>
  </div>
</template>