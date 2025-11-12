import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const requiredEnvVars = [
  'NUXT_PUBLIC_FIREBASE_API_KEY',
  'NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NUXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NUXT_PUBLIC_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Erreur: Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  requiredEnvVars.forEach(varName => {
  });
  process.exit(1);
}

const swTemplate = `
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '${process.env.NUXT_PUBLIC_FIREBASE_API_KEY}',
  authDomain: '${process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN}',
  projectId: '${process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID}',
  storageBucket: '${process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET}',
  messagingSenderId: '${process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}',
  appId: '${process.env.NUXT_PUBLIC_FIREBASE_APP_ID}',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Message reçu en arrière-plan:', payload);
  // Personnalisez ici la notification en arrière-plan
});
`;

try {
  await writeFile(join(__dirname, '../public/firebase-messaging-sw.js'), swTemplate);
  console.log('Service worker généré avec succès.');
} catch (error) {
  console.error('Erreur lors de la génération du service worker:', error);
  process.exit(1);
}