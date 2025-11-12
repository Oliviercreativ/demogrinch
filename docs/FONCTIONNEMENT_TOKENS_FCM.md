# 🔍 Fonctionnement complet du système de tokens FCM

## 📊 Vue d'ensemble

Le système de tokens FCM suit un cycle de vie précis. Laissez-moi vous expliquer **exactement** ce qui se passe.

---

## 🎬 Scénario 1 : Première inscription (utilisateur nouveau)

### **Étape par étape**

```
👤 Utilisateur → Clique sur "Activer les notifications"
         ↓
🔐 Navigateur → Demande la permission
         ↓
✅ Permission accordée
         ↓
🔑 Firebase SDK → Génère un token FCM unique (ex: "dIJkksbMkK4O13...")
         ↓
💾 Supabase → Sauvegarde en base
```

### **Code exact** (dans `useFirebaseMessaging.ts`)

```typescript:87-129:composables/useFirebaseMessaging.ts
const saveTokenForUser = async (token, userId) => {
  console.log('💾 [TOKEN] Sauvegarde pour utilisateur:', userId)
  
  // 1. DÉSACTIVER tous les anciens tokens de l'utilisateur
  await supabase
    .from('user_fcm_tokens')
    .update({ active: false })
    .eq('user_id', userId)
  
  // 2. INSÉRER le nouveau token comme actif
  await supabase
    .from('user_fcm_tokens')
    .insert({
      user_id: userId,
      token: token,
      device_info: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        platform: navigator.platform
      },
      active: true  // ← Seul celui-ci est actif
    })
  
  console.log('✅ [TOKEN] Token sauvegardé')
}
```

### **Résultat en base de données**

```sql
-- Après la première inscription
SELECT * FROM user_fcm_tokens WHERE user_id = 'USER_ID';

| id | user_id | token        | active | created_at          |
|----|---------|--------------|--------|---------------------|
| 1  | user123 | dIJkksbM...  | true   | 2024-10-13 10:00:00 |
```

---

## 🔄 Scénario 2 : Reconnexion sur le même appareil

### **Que se passe-t-il ?**

**RIEN automatiquement !** ❌

Le token FCM **ne se régénère PAS** automatiquement à chaque connexion.

### **Pourquoi ?**

Un token FCM est lié à :
- ✅ L'appareil (smartphone, ordi)
- ✅ Le navigateur (Chrome, Safari, etc.)
- ✅ Le site web (domaine)

**Il reste valide tant que** :
- ✅ L'utilisateur ne désinstalle pas l'app
- ✅ Le navigateur ne supprime pas les données
- ✅ Firebase ne révoque pas le token

### **Durée de vie typique**

Un token FCM peut rester valide **plusieurs mois** voire **indéfiniment** !

---

## 📱 Scénario 3 : Connexion sur un NOUVEL appareil

### **Exemple**

1. **Lundi** : L'utilisateur active les notifications sur son **iPhone**
2. **Mardi** : Il se connecte sur son **Mac**
3. **Mercredi** : Il clique à nouveau "Activer les notifications" sur le Mac

### **Ce qui se passe**

```
📱 iPhone : Token A (généré lundi)
💻 Mac : Token B (généré mercredi)
```

### **En base de données**

```sql
SELECT * FROM user_fcm_tokens WHERE user_id = 'USER_ID';

| id | user_id | token    | active | device_info       | created_at          |
|----|---------|----------|--------|-------------------|---------------------|
| 1  | user123 | Token_A  | false  | iPhone Safari     | 2024-10-13 10:00:00 |
| 2  | user123 | Token_B  | true   | Mac Chrome        | 2024-10-15 14:00:00 |
```

**Résultat** :
- ❌ Token A devient `active: false` (ancien appareil)
- ✅ Token B devient `active: true` (nouvel appareil)

**⚠️ IMPORTANT** : L'utilisateur ne recevra les notifications que sur le **dernier appareil** où il a activé les notifications !

---

## 🔄 Scénario 4 : Rafraîchissement automatique (optionnel)

Vous avez un fichier `useTokenRefresh.ts` qui **n'est pas utilisé actuellement**.

### **Code existant**

```typescript:16-19:composables/useTokenRefresh.ts
// Vérification périodique (une fois par jour)
setInterval(() => {
  checkAndRefreshToken()
}, 24 * 60 * 60 * 1000) // Toutes les 24 heures
```

### **Comment ça marche**

```typescript:22-41:composables/useTokenRefresh.ts
const checkAndRefreshToken = async () => {
  if (!user.value) return

  // 1. Obtenir le token actuel de Firebase
  const newToken = await $getToken()
  
  // 2. Comparer avec celui stocké localement
  const storedToken = localStorage.getItem('fcm-token')
  
  // 3. Si différent → Mettre à jour en base
  if (storedToken !== newToken) {
    console.log('🔄 Nouveau token détecté, mise à jour...')
    await saveTokenForUser(newToken, user.value.id)
    localStorage.setItem('fcm-token', newToken)
  }
}
```

**⚠️ PROBLÈME** : Ce code n'est **jamais appelé** ! Il faut l'activer.

---

## 💡 Comportement ACTUEL de votre app

### **✅ Ce qui se passe**

1. L'utilisateur clique sur "Activer les notifications"
2. Un token est généré et sauvegardé
3. Ce token reste valide **indéfiniment** (ou jusqu'à expiration Firebase)
4. **PAS de rafraîchissement automatique** à chaque connexion

### **❌ Ce qui NE se passe PAS**

- ❌ Le token ne se rafraîchit **pas** à chaque connexion
- ❌ Le token ne se met **pas** à jour automatiquement
- ❌ Pas de vérification périodique (le code existe mais n'est pas utilisé)

---

## 🎯 Comprendre le cycle de vie d'un token

### **État 1 : Pas de token**
```
User connecté + Notifications désactivées
→ Aucune ligne dans user_fcm_tokens
→ L'utilisateur ne reçoit RIEN
```

### **État 2 : Token actif**
```
User clique "Activer" → Token créé
→ 1 ligne dans user_fcm_tokens (active: true)
→ L'utilisateur reçoit TOUTES les notifications
```

### **État 3 : Nouveau token (nouvel appareil)**
```
User clique "Activer" sur un autre appareil → Nouveau token
→ Ancien token passe à active: false
→ Nouveau token passe à active: true
→ L'utilisateur reçoit les notifications sur le DERNIER appareil uniquement
```

### **État 4 : Token invalide**
```
Token révoqué par Firebase (app désinstallée, etc.)
→ Lors de l'envoi, FCM retourne une erreur
→ Notre API détecte l'erreur et met active: false
→ L'utilisateur ne reçoit PLUS de notifications
```

---

## 🔍 Analyse de votre base de données actuelle

```sql
SELECT 
  id,
  user_id,
  LEFT(token, 30) as token_preview,
  active,
  device_info->>'platform' as platform,
  created_at
FROM user_fcm_tokens 
ORDER BY created_at DESC;
```

**Résultat actuel** (d'après les données que j'ai vues) :

| User | Token | Active | Platform | Date |
|------|-------|--------|----------|------|
| user1 | dIJkksbMkK4... | ✅ true | Android | 17 juil 2025 |
| admin | chDSjU4IZFv... | ✅ true | MacIntel | 19 juil 2025 |
| admin | e8e033Rsk... | ❌ false | MacIntel | 12 juil 2025 |
| admin | dR5i0SajLq... | ❌ false | Android | 14 juin 2025 |
| user2 | d8qvoQ0t1V... | ✅ true | iPhone | 4 oct 2025 |

**Observation** :
- ✅ 3 utilisateurs ont des tokens actifs
- ✅ L'admin a activé sur plusieurs appareils (seul le dernier est actif)
- ✅ Les anciens tokens sont désactivés automatiquement

---

## 🤔 Questions/Réponses

### **Q1 : Le token se rafraîchit à chaque connexion ?**

**R : NON** ❌

Le token se crée **uniquement** quand l'utilisateur clique sur "Activer les notifications".

Après, il reste valide **indéfiniment** (sauf si révoqué).

### **Q2 : Que se passe-t-il si je me connecte sur un autre appareil ?**

**R :** Si vous cliquez sur "Activer les notifications" sur le nouvel appareil :
- ✅ Nouveau token créé
- ❌ Ancien token désactivé (`active: false`)
- ✅ Vous recevez les notifications sur le nouvel appareil **UNIQUEMENT**

### **Q3 : Puis-je recevoir des notifications sur plusieurs appareils ?**

**R : NON** ❌ Avec le code actuel.

Le code désactive tous les anciens tokens (ligne 98-101) :

```typescript:98-101:composables/useFirebaseMessaging.ts
// Désactiver les anciens tokens
await supabase
  .from('user_fcm_tokens')
  .update({ active: false })
  .eq('user_id', userId)
```

**Pour supporter multi-appareils**, il faudrait **NE PAS** désactiver les anciens tokens.

### **Q4 : Comment savoir si mon token est toujours valide ?**

**R :** Le token reste valide jusqu'à ce que :
1. Firebase le révoque (app désinstallée, données effacées)
2. Votre code l'envoie une notification et reçoit une erreur "invalid"
3. Le cron de nettoyage le désactive (90+ jours sans mise à jour)

### **Q5 : Quand le token change-t-il ?**

**R :** Un token change **rarement** :
- ✅ Nouvelle installation de l'app
- ✅ Réinitialisation des données du navigateur
- ✅ Changement d'appareil
- ❌ **PAS** à chaque connexion
- ❌ **PAS** à chaque visite

---

## 🛠️ Recommandations

### **Option A : Garder le système actuel (1 appareil)**

✅ **Avantages** :
- Simple à gérer
- Un seul token par utilisateur
- Pas de confusion

❌ **Inconvénients** :
- L'utilisateur perd les notifications s'il change d'appareil
- Doit réactiver à chaque fois

### **Option B : Support multi-appareils** (recommandé)

**Modifier** `saveTokenForUser` :

```typescript
const saveTokenForUser = async (token, userId) => {
  const supabase = useSupabaseClient()
  
  // Vérifier si ce token existe déjà
  const { data: existing } = await supabase
    .from('user_fcm_tokens')
    .select('id')
    .eq('token', token)
    .eq('user_id', userId)
    .single()
  
  if (existing) {
    // Token existe déjà, juste mettre à jour
    await supabase
      .from('user_fcm_tokens')
      .update({ 
        active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
  } else {
    // Nouveau token, insérer
    // NE PAS désactiver les autres tokens
    await supabase
      .from('user_fcm_tokens')
      .insert({
        user_id: userId,
        token: token,
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          platform: navigator.platform
        },
        active: true
      })
  }
}
```

✅ **Avantages** :
- Notifications sur tous les appareils
- Meilleure UX
- Standard des apps modernes

❌ **Inconvénients** :
- Plus de tokens à gérer
- Plus de coûts d'envoi (mais FCM est gratuit)

### **Option C : Rafraîchissement automatique** (optionnel)

**Activer** `useTokenRefresh` dans un composant global :

```vue
<!-- app.vue ou layout/default.vue -->
<script setup>
const { setupTokenRefresh } = useTokenRefresh()

onMounted(() => {
  setupTokenRefresh() // Active le rafraîchissement automatique
})
</script>
```

✅ **Avantages** :
- Tokens toujours à jour
- Détection automatique des changements

❌ **Inconvénients** :
- Vérification toutes les 24h (charge supplémentaire)
- Pas vraiment nécessaire en pratique

---

## 📊 Diagramme du cycle de vie actuel

```
┌─────────────────────────────────────────────┐
│  Utilisateur clique "Activer notifications" │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  requestPermission()                        │
│  - Demande permission navigateur            │
│  - Enregistre service worker                │
│  - Obtient token FCM de Firebase            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  saveTokenForUser(token, userId)            │
│  1. Désactive TOUS les tokens existants     │
│  2. Insère le nouveau token (active: true)  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Base de données : user_fcm_tokens          │
│  - user_id: UUID de l'utilisateur           │
│  - token: String FCM (~150 caractères)      │
│  - active: true (seul celui-ci)             │
│  - device_info: {userAgent, platform}       │
└─────────────────────────────────────────────┘
```

---

## 🔄 Cycle de rafraîchissement (si activé)

```
┌──────────────────┐
│  Toutes les 24h  │
│  (si activé)     │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  checkAndRefreshToken()             │
│  1. Obtient token actuel            │
│  2. Compare avec localStorage       │
│  3. Si différent → Met à jour       │
└─────────────────────────────────────┘
```

**Mais** : Ce code n'est **pas activé** dans votre app actuellement.

---

## 🧪 Test pratique pour comprendre

### **Expérience 1 : Même appareil, plusieurs connexions**

```
1. Activez les notifications
2. Notez l'ID du token en base
3. Déconnectez-vous
4. Reconnectez-vous
5. Vérifiez le token en base

Résultat : ✅ MÊME token, pas de changement
```

### **Expérience 2 : Plusieurs appareils**

```
1. Activez sur iPhone → Token A
2. Vérifiez en base : Token A (active: true)
3. Activez sur Mac → Token B
4. Vérifiez en base : 
   - Token A (active: false)
   - Token B (active: true)

Résultat : ✅ Seul le dernier appareil reçoit les notifications
```

### **Expérience 3 : Désactivation puis réactivation**

```
1. Activez les notifications → Token A créé
2. Cliquez "Désactiver" → Token A passe à active: false
3. Recliquez "Activer" → Nouveau Token B créé
4. Vérifiez en base :
   - Token A (active: false)
   - Token B (active: true)

Résultat : ✅ Nouveau token à chaque activation
```

---

## 🎯 Vérification dans votre base

```sql
-- Voir tous vos tokens
SELECT 
  id,
  user_id,
  LEFT(token, 30) || '...' as token_short,
  active,
  device_info->>'platform' as platform,
  device_info->>'userAgent' as user_agent,
  created_at,
  updated_at
FROM user_fcm_tokens 
WHERE user_id = 'VOTRE_USER_ID'
ORDER BY created_at DESC;
```

---

## 📝 Résumé simple

### **Quand un token est créé ?**
✅ Quand l'utilisateur clique "Activer les notifications"  
❌ **PAS** à chaque connexion  
❌ **PAS** à chaque visite

### **Un token dure combien de temps ?**
✅ Plusieurs mois/années (tant que valide)  
❌ Firebase peut le révoquer si :
- App désinstallée
- Données du navigateur effacées
- Token périmé

### **Plusieurs appareils ?**
❌ **Non** avec le code actuel (seul le dernier appareil reçoit)  
✅ **Possible** en modifiant `saveTokenForUser` (voir Option B)

### **Rafraîchissement automatique ?**
❌ **Non** actuellement (code existe mais pas activé)  
✅ **Possible** en activant `useTokenRefresh` dans app.vue

---

## 🚀 Recommandation

**Pour une meilleure UX**, je vous recommande :

1. ✅ **Activer le support multi-appareils** (ne pas désactiver les anciens tokens)
2. ❌ **Ne PAS activer le rafraîchissement automatique** (pas nécessaire)
3. ✅ **Garder le nettoyage automatique** des tokens invalides lors de l'envoi

---

**Voulez-vous que je modifie le code pour supporter les notifications multi-appareils ? 📱💻**

