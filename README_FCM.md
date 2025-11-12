# 🔔 Système de Notifications Firebase Cloud Messaging (FCM)

## 🎯 Vue d'ensemble

Votre application **Grinch (GRINCH)** utilise maintenant **Firebase Cloud Messaging** pour les notifications push.

**OneSignal a été complètement supprimé** et remplacé par FCM pour une meilleure intégration native.

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| **`ETAPES_FINALES.md`** | ⭐ **COMMENCEZ ICI** - Actions immédiates à faire |
| `FCM_INSTALLATION.md` | Guide complet d'installation et d'utilisation |
| `MIGRATION_FCM_COMPLETE.md` | Détails techniques de la migration |
| `CHECKLIST_FCM.md` | Checklist de vérification complète |

---

## ⚡ Démarrage rapide (3 commandes)

```bash
# 1. Installer Firebase Admin SDK
bun add firebase-admin

# 2. Configurer .env (voir ETAPES_FINALES.md)
# Ajouter FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY

# 3. Redémarrer le serveur
bun run dev
```

Ensuite, testez sur `/admin/envoyer-notification`

---

## 🏗️ Architecture

### Côté Client

```
┌─────────────────────────────────────┐
│  NotificationSubscribe.vue          │  ← Bouton d'activation
│  └─> useFirebaseMessaging()         │  ← Gestion FCM
│      └─> Firebase Messaging SDK     │  ← SDK client
│          └─> firebase-messaging-sw.js│  ← Service Worker
└─────────────────────────────────────┘
```

**Flux d'activation** :
1. User clique sur "Activer"
2. Permission demandée
3. Token FCM généré
4. Token sauvegardé dans `user_fcm_tokens`
5. Notification de bienvenue affichée

### Côté Serveur

```
┌─────────────────────────────────────┐
│  useFCMNotifications()              │  ← Composable helper
│  └─> /api/notifications/send        │  ← API serveur
│      └─> Firebase Admin SDK         │  ← Envoi FCM
│          └─> user_fcm_tokens        │  ← Récupération tokens
└─────────────────────────────────────┘
```

**Flux d'envoi** :
1. Appel de `sendNotification(userId, title, message)`
2. API récupère les tokens actifs de l'utilisateur
3. Envoi via Firebase Admin SDK
4. Gestion des échecs et nettoyage auto des tokens invalides
5. Retour du résultat

---

## 🎨 Composants disponibles

### `<NotificationSubscribe />`

Bouton d'activation/désactivation des notifications.

**Props :**
```vue
<NotificationSubscribe 
  :iconOnly="false"
  buttonClass="bg-blue-800 text-white px-4 py-2 rounded"
  iconClass="text-2xl"
/>
```

**États visuels :**
- 🔴 Gris : Désactivées / Bloquées
- 🔵 Bleu : Prêt à activer
- 🟢 Vert : Activées ✓

### `<UserTokenManager />`

Interface de gestion des appareils connectés (voir tokens actifs, désactiver).

```vue
<UserTokenManager />
```

### `<NotificationHandler />`

Composant de debug pour tester FCM.

```vue
<NotificationHandler />
```

---

## 🚀 Utilisation du composable

### Envoyer à un utilisateur

```typescript
const { sendNotification } = useFCMNotifications()

await sendNotification(
  userId,
  'Titre de la notification',
  'Corps du message',
  { 
    link_url: '/page-cible',
    image_url: 'https://example.com/image.jpg'
  }
)
```

### Broadcast à tous

```typescript
const { sendNotificationToAll } = useFCMNotifications()

await sendNotificationToAll(
  'Maintenance prévue',
  'L\'app sera en maintenance de 2h à 4h'
)
```

### Clients d'une boutique

```typescript
const { sendNotificationToShopCustomers } = useFCMNotifications()

await sendNotificationToShopCustomers(
  'boulangerie-paul',
  'Points doubles !',
  'Profitez de points doubles ce weekend'
)
```

---

## 📊 Base de données

### Table `user_fcm_tokens`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int | PK auto-increment |
| `user_id` | uuid | FK → auth.users.id |
| `token` | text | Token FCM unique |
| `device_info` | jsonb | Infos appareil (UA, platform) |
| `active` | boolean | Token actif ? |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Date dernière MAJ |
| `invalid_reason` | text | Raison si invalide |

**RLS** : ✅ Activé (sécurité garantie)

### Requêtes utiles

```sql
-- Statistiques
SELECT 
  COUNT(*) as total_tokens,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) FILTER (WHERE active = true) as active_tokens
FROM user_fcm_tokens;

-- Tokens d'un utilisateur
SELECT * FROM user_fcm_tokens 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;

-- Nettoyage manuel
DELETE FROM user_fcm_tokens 
WHERE active = false 
AND updated_at < NOW() - INTERVAL '30 days';
```

---

## 🔗 Routes admin

| URL | Description |
|-----|-------------|
| `/admin/envoyer-notification` | Interface d'envoi de notifications |
| `/admin/push` | Ancienne page (à migrer si nécessaire) |

---

## 🛠️ Maintenance

### Automatisations recommandées

1. **Cron de nettoyage** : Supprimer les vieux tokens inactifs
2. **Monitoring** : Tracker le taux de succès d'envoi
3. **Alertes** : Si trop de tokens deviennent invalides

### Logs à surveiller

**Navigateur** :
```
✅ [FCM] Setup complet avec succès
✅ [TOKEN] Token sauvegardé
```

**Serveur** :
```
✅ Firebase Admin SDK initialisé
✅ [SEND] Succès: X/Y
```

---

## 💡 Bonnes pratiques

### ✅ À faire

- Envoyer des notifications **pertinentes** et **utiles**
- Respecter la fréquence (max 3-5 par jour)
- Utiliser des **titres courts** (< 65 caractères)
- Ajouter des **images** pour plus d'engagement
- Tester sur plusieurs appareils

### ❌ À éviter

- Spam de notifications
- Notifications génériques sans contexte
- Notifications sans lien d'action
- Titres/messages trop longs
- Envoi massif sans segmentation

---

## 📱 Support navigateurs

| Navigateur | Support | Notes |
|------------|---------|-------|
| Chrome Android | ✅ Full | Parfait |
| Firefox Android | ✅ Full | OK |
| Safari iOS 16.4+ | ✅ Partiel | Nécessite iOS 16.4+ |
| Chrome Desktop | ✅ Full | OK |
| Safari Desktop | ✅ Full | OK avec permission |
| Firefox Desktop | ✅ Full | OK |

---

## 🎉 Résumé

**Avant** (OneSignal) :
- ❌ Service tiers
- ❌ Dépendance externe
- ❌ Moins de contrôle
- ❌ Configuration complexe

**Après** (FCM) :
- ✅ Service Google natif
- ✅ Gratuit et illimité
- ✅ Contrôle total
- ✅ Intégration Firebase complète
- ✅ API flexible
- ✅ Nettoyage automatique

---

## 🆘 Besoin d'aide ?

1. Consultez `ETAPES_FINALES.md` pour les actions immédiates
2. Lisez `FCM_INSTALLATION.md` pour les détails
3. Utilisez `CHECKLIST_FCM.md` pour valider chaque étape
4. Testez avec `NotificationHandler.vue` en mode debug

---

**Version** : 1.0  
**Date** : 12 octobre 2024  
**Status** : ✅ Migration complète - Prêt pour production

