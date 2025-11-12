# ✅ Migration OneSignal → Firebase Cloud Messaging (FCM) - TERMINÉE

## 📋 Récapitulatif des modifications

### 🗑️ Suppressions effectuées

1. ✅ `plugins/onesignal.client.js` - Supprimé
2. ✅ `public/OneSignalSDKWorker.js` - Supprimé
3. ✅ Références OneSignal dans `nuxt.config.ts` - Nettoyées
4. ✅ Références OneSignal dans `public/sw.js` - Nettoyées

### ✨ Fichiers créés/modifiés

1. ✅ `components/NotificationSubscribe.vue` - **Réécrit** pour utiliser FCM
2. ✅ `composables/useFirebaseMessaging.ts` - **Enrichi** avec :
   - `getUserActiveTokens(userId)` - Récupérer les tokens actifs
   - `refreshUserToken(userId)` - Rafraîchir un token

3. ✅ `composables/useFCMNotifications.ts` - **NOUVEAU** composable pour envoyer des notifications :
   - `sendNotification()` - Envoyer à un/plusieurs utilisateurs
   - `sendNotificationToAll()` - Broadcast
   - `sendNotificationToShopCustomers()` - Clients d'une boutique
   - `sendRewardNotification()` - Notification récompense
   - `sendShopMessageNotification()` - Message boutique

4. ✅ `server/api/notifications/send.post.ts` - **NOUVELLE** API serveur FCM :
   - Envoi de notifications via Firebase Admin SDK
   - Gestion automatique des tokens invalides
   - Nettoyage des tokens expirés
   - Support multi-utilisateurs

5. ✅ `pages/admin/envoyer-notification.vue` - **NOUVELLE** page admin :
   - Interface d'envoi de notifications
   - Ciblage : Tous / Boutique / Utilisateur
   - Statistiques en temps réel
   - Preview des notifications

---

## 🚀 Installation finale (IMPORTANT)

### Étape 1 : Installer Firebase Admin SDK

```bash
bun add firebase-admin
```

### Étape 2 : Configurer les variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# ⚠️ NOUVEAU : Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"
```

**Comment obtenir ces credentials ?**

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. ⚙️ **Paramètres du projet** → **Comptes de service**
4. Cliquez sur **"Générer une nouvelle clé privée"**
5. Téléchargez le fichier JSON
6. Copiez `client_email` et `private_key` dans votre `.env`

⚠️ **ATTENTION** : La clé privée doit contenir les `\n` et être entre guillemets !

### Étape 3 : Supprimer la dépendance OneSignal (optionnel)

```bash
bun remove @onesignal/onesignal-vue3
```

Ou manuellement dans `package.json`, retirez la ligne :
```json
"@onesignal/onesignal-vue3": "^2.2.1",
```

---

## 🧪 Tests à effectuer

### Test 1 : Activation côté client ✅

1. Connectez-vous à l'application
2. Allez sur une page avec `<NotificationSubscribe />`
3. Cliquez sur **"Activer les notifications"**
4. Acceptez la permission
5. Vous devriez recevoir une notification de bienvenue locale

**Vérification en base :**
```sql
SELECT * FROM user_fcm_tokens WHERE active = true;
```

Vous devriez voir votre token.

### Test 2 : Envoi depuis l'admin ✅

1. Connectez-vous en tant qu'admin
2. Allez sur `/admin/envoyer-notification`
3. Remplissez le formulaire :
   - Ciblage : "Utilisateur spécifique"
   - Sélectionnez votre compte
   - Titre : "Test notification"
   - Message : "Ceci est un test !"
4. Cliquez sur **"Envoyer"**
5. Vous devriez recevoir la notification

### Test 3 : Envoi via code ✅

Dans n'importe quelle page/composant :

```typescript
const { sendNotification } = useFCMNotifications()

async function testNotif() {
  await sendNotification(
    'VOTRE_USER_ID',
    '🎉 Test',
    'Notification de test !',
    { link_url: '/dashboard' }
  )
}
```

---

## 📊 Intégrations recommandées

### 1. Notification de récompense gagnée

Dans `server/api/rewards/add-point.post.ts`, ajoutez :

```typescript
import { sendRewardNotification } from '~/composables/useFCMNotifications'

// Après avoir attribué la récompense
if (newSolde >= boutique.limite) {
  // Envoyer la notification
  await sendRewardNotification(
    userId,
    boutique.name_shop,
    `Félicitations ! Vous avez gagné votre récompense (${boutique.limite} points)`
  )
}
```

### 2. Notification de nouveau message boutique

Quand une boutique envoie un message :

```typescript
const { sendShopMessageNotification } = useFCMNotifications()

await sendShopMessageNotification(
  userId,
  'Nom de la boutique',
  message.substring(0, 100) // Aperçu
)
```

### 3. Notification de bon plan

```typescript
const { sendNotificationToShopCustomers } = useFCMNotifications()

await sendNotificationToShopCustomers(
  'boulangerie-paul',
  '🔥 Bon plan !',
  'Réduction de 20% sur les croissants ce weekend !',
  { 
    link_url: '/bons-plans',
    image_url: 'https://example.com/promo.jpg'
  }
)
```

---

## 🔧 Monitoring et maintenance

### Statistiques temps réel

```sql
-- Utilisateurs avec notifications actives
SELECT COUNT(DISTINCT user_id) as users_count 
FROM user_fcm_tokens 
WHERE active = true;

-- Tokens actifs par plateforme
SELECT 
  CASE 
    WHEN device_info->>'userAgent' LIKE '%iPhone%' THEN 'iPhone'
    WHEN device_info->>'userAgent' LIKE '%Android%' THEN 'Android'
    WHEN device_info->>'userAgent' LIKE '%Mac%' THEN 'Mac'
    ELSE 'Autre'
  END as platform,
  COUNT(*) as count
FROM user_fcm_tokens 
WHERE active = true
GROUP BY platform;

-- Tokens créés aujourd'hui
SELECT COUNT(*) 
FROM user_fcm_tokens 
WHERE created_at::date = CURRENT_DATE;
```

### Nettoyage automatique

Les tokens invalides sont **automatiquement désactivés** lors de l'envoi de notifications.

Pour nettoyer manuellement les anciens tokens :

```sql
-- Supprimer les tokens inactifs de plus de 30 jours
DELETE FROM user_fcm_tokens 
WHERE active = false 
AND updated_at < NOW() - INTERVAL '30 days';
```

### Logs

Tous les envois de notifications sont loggés dans la console serveur :
- ✅ Nombre de succès
- ❌ Nombre d'échecs
- 🧹 Tokens nettoyés

---

## 🎯 Fonctionnalités disponibles

### Côté client

✅ Bouton d'activation/désactivation des notifications  
✅ État visuel (gris/bleu/vert)  
✅ Notification de bienvenue à l'activation  
✅ Support multi-appareils  
✅ Gestion automatique des permissions  

### Côté serveur

✅ API d'envoi de notifications  
✅ Ciblage par utilisateur(s)  
✅ Ciblage par boutique (clients)  
✅ Broadcast à tous  
✅ Nettoyage automatique des tokens invalides  
✅ Support images et liens  
✅ Données personnalisées  

### Interface admin

✅ Page d'envoi manuel  
✅ Prévisualisation  
✅ Statistiques en temps réel  
✅ Multi-ciblage  

---

## 📱 Format des notifications

### Structure du payload

```typescript
{
  notification: {
    title: "Titre de la notification",
    body: "Corps du message",
    imageUrl: "https://..." // Optionnel
  },
  data: {
    click_action: "/page-cible",
    timestamp: "2024-01-01T12:00:00Z",
    custom_field: "valeur personnalisée"
  }
}
```

### Gestion des clics

Le clic sur une notification :
1. Ouvre l'app ou focus la fenêtre si déjà ouverte
2. Navigue vers `data.click_action` (ou "/" par défaut)
3. Ferme la notification

Configuré dans `public/firebase-messaging-sw.js` lignes 48-75.

---

## ⚠️ Limitations et contraintes

### Notifications

- **Titre** : 65 caractères max (Android) / 178 (iOS)
- **Corps** : 240 caractères max recommandé
- **Image** : URL absolue uniquement (https://)
- **Fréquence** : Respecter le rate limiting de FCM

### Quotas FCM (Free tier)

- **Messages** : Illimité
- **Topics** : 2000 par projet
- **Throughput** : 600,000 messages/minute

---

## 🐛 Résolution de problèmes

### Erreur : "firebase-admin not found"

```bash
bun add firebase-admin
```

### Erreur : "Invalid service account"

➡️ Vérifiez que `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY` sont corrects dans `.env`

### Notifications non reçues en arrière-plan

1. Vérifiez que le service worker est actif :
   - Ouvrir DevTools → Application → Service Workers
   - `/firebase-messaging-sw.js` doit être listé

2. Vérifiez la console du service worker pour les erreurs

### Tokens non sauvegardés

➡️ Vérifiez les RLS policies sur `user_fcm_tokens` :

```sql
-- Les users doivent pouvoir INSERT leurs propres tokens
CREATE POLICY "Users can insert own tokens" 
ON user_fcm_tokens FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Les users peuvent SELECT leurs tokens
CREATE POLICY "Users can select own tokens" 
ON user_fcm_tokens FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Les users peuvent UPDATE leurs tokens
CREATE POLICY "Users can update own tokens" 
ON user_fcm_tokens FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);
```

---

## 🎉 Migration terminée !

Votre application utilise maintenant **100% Firebase Cloud Messaging** !

**Avantages de FCM :**
- ✅ Gratuit et illimité
- ✅ Meilleure intégration avec votre stack Firebase
- ✅ Plus de contrôle sur l'infrastructure
- ✅ Pas de service tiers
- ✅ Support multi-plateforme natif

---

## 📞 Support

En cas de problème, vérifiez :
1. Console du navigateur (erreurs FCM)
2. Console du service worker
3. Logs serveur Nuxt
4. Table `user_fcm_tokens` dans Supabase

---

**Date de migration** : 12 octobre 2024  
**Version** : FCM v1.0

