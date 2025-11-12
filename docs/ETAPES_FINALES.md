# 🎯 Étapes finales pour activer FCM

## ⚡ Actions immédiates (5 minutes)

### 1️⃣ Installer Firebase Admin SDK

```bash
cd /Users/olivierdemontant/Sites/nuxtjs/grinch
bun add firebase-admin
```

### 2️⃣ Obtenir les credentials Firebase

1. Ouvrez [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur ⚙️ (roue crantée) → **Paramètres du projet**
4. Onglet **Comptes de service**
5. Bouton **"Générer une nouvelle clé privée"**
6. Un fichier JSON sera téléchargé

### 3️⃣ Ajouter les variables d'environnement

Ouvrez votre fichier `.env` et ajoutez :

```env
# Firebase Admin SDK (pour l'envoi de notifications serveur)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-projet.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_COMPLETE_ICI\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANT** : 
- Gardez les guillemets autour de `FIREBASE_PRIVATE_KEY`
- Gardez les `\n` dans la clé
- Copiez la clé EXACTEMENT comme elle apparaît dans le JSON

### 4️⃣ Supprimer OneSignal du package.json (optionnel)

Ouvrez `package.json` et **supprimez** la ligne 18 :

```json
"@onesignal/onesignal-vue3": "^2.2.1",  ← Supprimer cette ligne
```

Puis :

```bash
bun install
```

### 5️⃣ Redémarrer le serveur

```bash
# Arrêtez le serveur actuel (Ctrl+C)
bun run dev
```

---

## 🧪 Tests rapides

### Test 1 : Console serveur

Au démarrage, vous devriez voir :

```
✅ Firebase Admin SDK initialisé
```

**Si erreur** : Vos credentials `.env` sont incorrects.

### Test 2 : Activer les notifications

1. Connectez-vous sur l'app
2. Allez sur une page avec le bouton notifications
3. Cliquez sur **"Activer les notifications"**
4. Acceptez la permission
5. Une notification de bienvenue devrait apparaître

### Test 3 : Envoyer via admin

1. Allez sur `/admin/envoyer-notification`
2. Remplissez :
   - Ciblage : **Utilisateur spécifique** (vous)
   - Titre : `Test FCM`
   - Message : `Ma première notification FCM !`
3. Cliquez sur **"Envoyer"**
4. Vous devriez recevoir la notification

---

## 📁 Fichiers créés pour vous

| Fichier | Description |
|---------|-------------|
| `FCM_INSTALLATION.md` | Guide complet d'installation et d'utilisation |
| `MIGRATION_FCM_COMPLETE.md` | Documentation de la migration |
| `CHECKLIST_FCM.md` | Checklist de vérification complète |
| `composables/useFCMNotifications.ts` | Composable pour envoyer des notifications |
| `server/api/notifications/send.post.ts` | API d'envoi serveur |
| `pages/admin/envoyer-notification.vue` | Interface admin d'envoi |

---

## 🎯 Prochaines étapes (après activation)

### 1. Intégrer dans votre code existant

#### Lors d'une récompense gagnée

```typescript
// Dans server/api/rewards/add-point.post.ts
const { sendRewardNotification } = useFCMNotifications()

if (newSolde >= limite) {
  await sendRewardNotification(userId, shopName, rewardDetails)
}
```

#### Lors d'un nouveau message boutique

```typescript
const { sendShopMessageNotification } = useFCMNotifications()

await sendShopMessageNotification(userId, shopName, messagePreview)
```

#### Lors d'un bon plan

```typescript
const { sendNotificationToShopCustomers } = useFCMNotifications()

await sendNotificationToShopCustomers(
  'boutique-slug',
  '🔥 Bon plan !',
  'Réduction de 20% ce weekend !',
  { link_url: '/bons-plans' }
)
```

### 2. Configurer les RLS policies

Vérifiez que les policies existent sur `user_fcm_tokens` :

```sql
-- Vérifier les policies existantes
SELECT * FROM pg_policies WHERE tablename = 'user_fcm_tokens';
```

Si aucune policy, créez-les (voir `MIGRATION_FCM_COMPLETE.md`)

### 3. Monitoring

Créez un cron job pour nettoyer les anciens tokens :

```typescript
// server/api/cron/cleanup-old-tokens.post.ts
export default defineEventHandler(async () => {
  const supabase = createClient()
  
  // Supprimer les tokens inactifs de + de 30 jours
  await supabase
    .from('user_fcm_tokens')
    .delete()
    .eq('active', false)
    .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  
  return { success: true }
})
```

---

## ⚠️ Points d'attention

### Sécurité `.env`

**Ne JAMAIS commiter** le fichier `.env` avec vos clés Firebase !

Vérifiez que `.env` est dans `.gitignore` :

```bash
cat .gitignore | grep .env
```

### Service Worker

Le service worker Firebase (`/firebase-messaging-sw.js`) doit être à la **racine** de votre domaine.

Vérifiez dans DevTools :
- Application → Service Workers
- `/firebase-messaging-sw.js` doit être **activé et en cours d'exécution**

### Permissions HTTPS

Les notifications push nécessitent **HTTPS** (ou localhost en dev).

En production, assurez-vous que votre domaine a un certificat SSL valide.

---

## 🎉 C'est prêt !

Une fois ces étapes complétées, votre système FCM sera **100% opérationnel**.

**Recap de ce qui a été fait :**
- ✅ OneSignal supprimé
- ✅ FCM configuré côté client
- ✅ FCM configuré côté serveur
- ✅ API d'envoi créée
- ✅ Composable helper créé
- ✅ Interface admin créée
- ✅ Documentation complète fournie

**Il ne reste plus qu'à** :
1. Installer `firebase-admin`
2. Configurer les credentials `.env`
3. Redémarrer le serveur
4. Tester !

---

**Besoin d'aide ?** Consultez :
- `FCM_INSTALLATION.md` - Guide détaillé
- `MIGRATION_FCM_COMPLETE.md` - Détails techniques
- `CHECKLIST_FCM.md` - Tests complets

