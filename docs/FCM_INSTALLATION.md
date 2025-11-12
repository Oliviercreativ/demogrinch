# 🔔 Installation complète Firebase Cloud Messaging (FCM)

## ✅ Ce qui a été fait

1. ✅ Suppression de OneSignal
2. ✅ Refonte de `NotificationSubscribe.vue` pour utiliser FCM
3. ✅ Ajout des fonctions manquantes dans `useFirebaseMessaging.ts`
4. ✅ Création de l'API serveur `/api/notifications/send`
5. ✅ Création du composable `useFCMNotifications.ts`

---

## 📦 Installation requise

### 1. Installer Firebase Admin SDK

```bash
npm install firebase-admin
# ou
bun add firebase-admin
```

### 2. Configuration des variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Firebase Client (déjà configuré)
NUXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_project.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
NUXT_PUBLIC_FIREBASE_VAPID_KEY=votre_vapid_key

# ⚠️ NOUVEAU : Firebase Admin SDK (pour le serveur)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE\n-----END PRIVATE KEY-----\n"
```

### 3. Obtenir les credentials Firebase Admin

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur ⚙️ **Paramètres du projet** > **Comptes de service**
4. Cliquez sur **Générer une nouvelle clé privée**
5. Un fichier JSON sera téléchargé avec ce format :

```json
{
  "type": "service_account",
  "project_id": "votre-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@votre-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

6. Copiez les valeurs dans votre `.env` :
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (gardez les `\n`)

---

## 🧪 Comment tester

### Test 1 : Activer les notifications (côté client)

1. Connectez-vous à l'application
2. Cliquez sur le bouton "Activer les notifications"
3. Acceptez la permission dans le navigateur
4. Vous devriez recevoir une notification de bienvenue

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT * FROM user_fcm_tokens WHERE active = true;
```

### Test 2 : Envoyer une notification (côté serveur)

#### Option A : Via l'API directement

```javascript
// Dans la console du navigateur ou un script
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_ids: ['VOTRE_USER_ID'],
    title: 'Test notification',
    message: 'Ceci est un test !',
    link_url: '/',
    data: { test: 'true' }
  })
})
```

#### Option B : Via le composable

```vue
<script setup>
const { sendNotification } = useFCMNotifications()

async function testNotification() {
  try {
    const result = await sendNotification(
      'USER_ID',
      '🎉 Test',
      'Notification de test !',
      { link_url: '/dashboard' }
    )
    console.log('Résultat:', result)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
</script>
```

---

## 📚 Utilisation du composable `useFCMNotifications`

### Envoyer à un utilisateur

```typescript
const { sendNotification } = useFCMNotifications()

await sendNotification(
  'user-id-123',
  'Titre',
  'Message de la notification',
  {
    link_url: '/page-cible',
    image_url: 'https://example.com/image.jpg',
    data: { custom: 'data' }
  }
)
```

### Envoyer à plusieurs utilisateurs

```typescript
await sendNotification(
  ['user-1', 'user-2', 'user-3'],
  'Nouveau bon plan !',
  'Venez découvrir nos offres'
)
```

### Broadcast à tous les utilisateurs

```typescript
const { sendNotificationToAll } = useFCMNotifications()

await sendNotificationToAll(
  'Maintenance prévue',
  'L\'application sera en maintenance demain de 2h à 4h'
)
```

### Notifier les clients d'une boutique

```typescript
const { sendNotificationToShopCustomers } = useFCMNotifications()

await sendNotificationToShopCustomers(
  'boulangerie-paul',
  'Points doubles ce weekend !',
  'Venez profiter de notre offre spéciale',
  { link_url: '/shop/boulangerie-paul' }
)
```

### Notification de récompense

```typescript
const { sendRewardNotification } = useFCMNotifications()

await sendRewardNotification(
  userId,
  'Boulangerie Paul',
  'Vous avez gagné un croissant gratuit !'
)
```

---

## 🏗️ Intégrer dans votre code existant

### 1. Lors de l'attribution d'une récompense

```typescript:server/api/rewards/add-point.post.ts
// Après avoir ajouté la récompense
const { sendRewardNotification } = useFCMNotifications()

if (newSolde >= boutique.limite) {
  // Envoyer la notification
  await sendRewardNotification(
    userId,
    boutique.name_shop,
    `Vous avez gagné votre récompense ! (${boutique.limite} points)`
  )
}
```

### 2. Lors d'un nouveau message boutique

```typescript
// Dans la création de message
const { sendShopMessageNotification } = useFCMNotifications()

await sendShopMessageNotification(
  userId,
  boutiqueData.name_shop,
  message.substring(0, 100) // Aperçu
)
```

### 3. Dashboard admin - Envoi manuel

Créez une page `/admin/send-notification.vue` :

```vue
<template>
  <div>
    <h1>Envoyer une notification</h1>
    
    <form @submit.prevent="send">
      <input v-model="title" placeholder="Titre" required>
      <textarea v-model="message" placeholder="Message" required></textarea>
      
      <select v-model="target">
        <option value="all">Tous les utilisateurs</option>
        <option value="shop">Clients d'une boutique</option>
        <option value="custom">Utilisateurs spécifiques</option>
      </select>
      
      <button type="submit" :disabled="sending">
        {{ sending ? 'Envoi...' : 'Envoyer' }}
      </button>
    </form>
    
    <div v-if="result">
      ✅ Envoyé à {{ result.sentCount }} utilisateur(s)
    </div>
  </div>
</template>

<script setup>
const { sendNotificationToAll } = useFCMNotifications()

const title = ref('')
const message = ref('')
const target = ref('all')
const sending = ref(false)
const result = ref(null)

async function send() {
  sending.value = true
  try {
    result.value = await sendNotificationToAll(title.value, message.value)
  } catch (error) {
    console.error(error)
  } finally {
    sending.value = false
  }
}
</script>
```

---

## 🔧 Dépannage

### Erreur : "Firebase Admin SDK not initialized"

➡️ Vérifiez que `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY` sont bien dans `.env`

### Erreur : "Invalid private key"

➡️ Assurez-vous que la clé privée contient bien `\n` et est entre guillemets

### Aucune notification reçue

1. Vérifiez que le token est dans `user_fcm_tokens` avec `active=true`
2. Testez la permission : `Notification.permission` doit être `"granted"`
3. Vérifiez la console du navigateur pour les erreurs
4. Testez avec `sendTestNotification()` du composable

### Les notifications ne s'affichent pas en arrière-plan

➡️ Vérifiez que `/firebase-messaging-sw.js` est bien chargé (onglet Application > Service Workers dans DevTools)

---

## 📊 Monitoring

### Statistiques d'utilisation

```sql
-- Nombre total de tokens actifs
SELECT COUNT(*) FROM user_fcm_tokens WHERE active = true;

-- Tokens par utilisateur
SELECT user_id, COUNT(*) as tokens_count 
FROM user_fcm_tokens 
WHERE active = true 
GROUP BY user_id;

-- Tokens invalides récents
SELECT * FROM user_fcm_tokens 
WHERE active = false 
AND invalid_reason IS NOT NULL 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Nettoyage automatique

Les tokens invalides sont automatiquement désactivés lors de l'envoi. 

Pour nettoyer manuellement :

```sql
-- Supprimer les tokens inactifs de plus de 30 jours
DELETE FROM user_fcm_tokens 
WHERE active = false 
AND updated_at < NOW() - INTERVAL '30 days';
```

---

## ✅ Checklist finale

- [ ] `firebase-admin` installé
- [ ] Variables d'environnement configurées
- [ ] Test de notification client réussi
- [ ] Test d'envoi serveur réussi
- [ ] Composable intégré dans le code
- [ ] Page admin créée (optionnel)
- [ ] Monitoring en place

---

**🎉 Félicitations ! Votre système FCM est maintenant opérationnel !**

