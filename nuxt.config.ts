import { defineNuxtConfig } from 'nuxt/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineNuxtConfig({
  modules: [
    '@vite-pwa/nuxt',
    '@nuxtjs/supabase',
    'nuxt-gtag',
    '@nuxtjs/color-mode',
    '@nuxt/image',
    'nuxt-clarity-analytics',
    'nuxt-vuefire',
    '@unlok-co/nuxt-stripe',
  ],
  plugins: [
    '~/plugins/cookie-cleanup.client.js', // Nettoie les anciens cookies Supabase au démarrage
    '~/plugins/session-sync.client.js', // Synchronise la session entre onglets
    '~/plugins/serviceWorkerUpdateHandler.js',
    '~/plugins/auth.client.js',
  ],

  runtimeConfig: {
    public: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      enableServiceWorker: process.env.ENABLE_SERVICE_WORKER || 'false',
      apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      vapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY
    }
  },

  supabase: {
    redirect: false,
    cookieOptions: {
      domain: '.grinch.fr',
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 365 jours (1 an)
    }
  },
  
  vuefire: {
    config: {
      apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      vapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY
    },
    onFirebaseHosting: false,
    services: {
      messaging: true
    }
  },

  app: {
    head: {
      title: 'GRINCH avec Grinch',
      htmlAttrs: {
        lang: 'fr'
      },
      meta: [
        {
          charset: 'utf-8',
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        },
        {hid: 'description', name: 'description', content: ''},
        {name: 'format-detection', content: 'telephone=no'},
        {
          name: 'firebase-messaging-sender-id',
          content: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        },
        {name: 'robots', content: 'noindex, nofollow'}
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap'
        },
        {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
        {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}
      ],
    }
  },

  nitro: {
    prerender: {
      routes: ['/']
    },
    routeRules: {
      '/**': {cors: true}
    },
    timing: true,
    experimental: {
      openAPI: true
    },
    moduleSideEffects: ['firebase-admin'],
    alias: {
      'firebase-admin': 'firebase-admin'
    },
    cors: {
      origin: [
        'https://madeinconflans.grinch.fr',
        'https://halloween.grinch.fr',
        'http://localhost:3000'
      ],
      credentials: true,
      methods: ['GET', 'POST']
    }
  },

  gtag: {
    id: 'G-45ZCQXSDDB'
  },

pwa: {
  registerType: 'prompt',
  manifest: {
    name: 'GRINCH',
    short_name: 'MadeInConflans',
    version: '2.0.0',
    description: 'Application de fidélité des commerçants',
    theme_color: '#1e40af',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    lang: 'fr',
    scope: '/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  },
  workbox: {
    navigateFallback: null,
    cleanupOutdatedCaches: true,
    sourcemap: false,
    navigationPreload: true,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Auth Supabase - JAMAIS de cache
      {
        urlPattern: /^https:\/\/uqhcrdxcnkxghdmvxoxv\.supabase\.co\/auth\/.*/i,
        handler: 'NetworkOnly'
      },
      // API Supabase - Cache court
      {
        urlPattern: /^https:\/\/uqhcrdxcnkxghdmvxoxv\.supabase\.co\/rest\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          cacheableResponse: {
            statuses: [0, 200]
          },
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 10 * 60 // 10 minutes
          }
        }
      },
      // Images - Cache long terme
      {
        urlPattern: /\.(png|jpg|jpeg|webp|svg|ico|gif)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
          }
        }
      },
      // JS/CSS - Cache moyen terme
      {
        urlPattern: /\.(js|css)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-js-css',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semaine
          }
        }
      },
      // Fonts
      {
        urlPattern: /\.(woff2|woff|ttf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60 // 1 an
          }
        }
      }
    ]
  },
  client: {
    installPrompt: true
  },
  registerWebManifestInRouteRules: true,
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: '/',
    suppressWarnings: true
  }
},
/*
  router: {
    middleware: ['auth']
  },
  */
  build: {
    transpile: ['qrcode.vue']
  },

  experimental: {
    renderJsonPayloads: false,
    asyncContext: true
  },

  vite: {
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },
    optimizeDeps: {
      exclude: ['vue-demi']
    }
  },

  css: [
    '~/assets/css/main.css'
  ],

  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {}
    }
  }, // Ajout de la virgule ici

  components: [{path: '~/components', pathPrefix: false}],

  image: {
    quality: 80,
    format: ['webp', 'png', 'jpg', 'jpeg']
  },

  colorMode: {
    preference: 'light', // Forcer le mode light
    fallback: 'light',
    dataValue: 'light', // Force la valeur du data attribute
    classSuffix: '', // Pas de suffix sur les classes
    storageKey: 'nuxt-color-mode'
  },

  stripe: {
    client: {
      key: process.env.STRIPE_PUBLIC_KEY,
      manualClientLoad: true
    },
    server: {
      key: process.env.STRIPE_SECRET_KEY
    }
  },

  compatibilityDate: '2024-04-03'
})
