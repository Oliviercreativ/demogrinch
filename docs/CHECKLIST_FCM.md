# ✅ Checklist de vérification FCM

Utilisez cette checklist pour vérifier que tout fonctionne correctement.

---

## 📦 1. Installation

- [ ] `firebase-admin` installé
  ```bash
  bun add firebase-admin
  ```

- [ ] Variables d'environnement configurées dans `.env`
  ```env
  FIREBASE_CLIENT_EMAIL=...
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  ```

---

## 🧪 2. Tests côté client

### Test A : Vérifier le composant NotificationSubscribe

- [ ] Le bouton s'affiche correctement
- [ ] Cliquer sur "Activer les notifications"
- [ ] La permission du navigateur est demandée
- [ ] Après acceptation, le bouton devient vert "Notifications activées ✓"
- [ ] Une notification de bienvenue locale apparaît

### Test B : Vérifier en base de données

Exécutez dans Supabase SQL Editor :

```sql
-- Votre token doit apparaître
SELECT id, user_id, active, device_info, created_at 
FROM user_fcm_tokens 
WHERE user_id = 'VOTRE_USER_ID' 
AND active = true;
```

**Résultat attendu** : 1 ligne avec votre token

### Test C : Console du navigateur

Ouvrez les DevTools (F12) → Console :

```
✅ [FCM] Support navigateur OK
✅ [FCM] Service worker prêt
✅ [FCM] Config envoyée au service worker
🔐 [FCM] Permission actuelle: granted
🔑 [FCM] Récupération du token...
✅ [FCM] Setup complet avec succès
💾 [TOKEN] Sauvegarde pour utilisateur: xxx
✅ [TOKEN] Token sauvegardé
🎉 [WELCOME] Notification de bienvenue envoyée
```

**Aucune erreur rouge ne doit apparaître**

---

## 🖥️ 3. Tests côté serveur

### Test A : Vérifier l'initialisation Firebase Admin

Démarrez le serveur et regardez les logs :

```
✅ Firebase Admin SDK initialisé
```

**Si erreur** : Vérifiez vos variables d'environnement

### Test B : Tester l'API d'envoi

**Option 1 : Via la console du navigateur**

```javascript
await $fetch('/api/notifications/send', {
  method: 'POST',
  body: {
    user_ids: ['VOTRE_USER_ID'],
    title: 'Test API',
    message: 'Ceci est un test d\'envoi serveur !',
    link_url: '/'
  }
})
```

**Option 2 : Via curl**

```bash
curl -X POST https://votre-domaine.fr/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["USER_ID"],
    "title": "Test",
    "message": "Message de test",
    "link_url": "/"
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "sentCount": 1,
  "failureCount": 0,
  "invalidTokensCleaned": 0
}
```

### Test C : Logs serveur

Dans la console serveur Nuxt :

```
📤 [SEND] Envoi de notifications FCM...
📱 [SEND] 1 token(s) trouvé(s)
🚀 [SEND] Envoi via FCM...
✅ [SEND] Succès: 1/1
❌ [SEND] Échecs: 0
```

---

## 🎯 4. Tests fonctionnels

### Scénario 1 : Récompense gagnée

1. [ ] Scanner une boutique jusqu'à atteindre la limite
2. [ ] Recevoir une notification "Récompense gagnée"
3. [ ] Cliquer sur la notification → Redirection vers `/cartes-de-fidelite`

### Scénario 2 : Message boutique

1. [ ] Une boutique envoie un message
2. [ ] Recevoir une notification "Nouveau message"
3. [ ] Cliquer → Redirection vers `/messagerie`

### Scénario 3 : Broadcast admin

1. [ ] Admin envoie une notification globale
2. [ ] Tous les utilisateurs avec notifications actives la reçoivent
3. [ ] Stats correctes dans l'interface admin

---

## 📱 5. Tests multi-plateformes

- [ ] **Android Chrome** : Notifications foreground + background
- [ ] **iPhone Safari** : Notifications (iOS 16.4+)
- [ ] **Desktop Chrome** : Notifications
- [ ] **Desktop Safari** : Notifications

---

## 🔒 6. Sécurité

### Vérifier les RLS policies

```sql
-- La table doit avoir RLS activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_fcm_tokens';
-- rowsecurity doit être 'true'

-- Lister les policies
SELECT * FROM pg_policies 
WHERE tablename = 'user_fcm_tokens';
```

**Policies requises** :
- Users peuvent INSERT leurs tokens
- Users peuvent SELECT leurs tokens
- Users peuvent UPDATE leurs tokens
- Admins peuvent tout faire

---

## 📊 7. Performance

### Vérifier le temps de réponse

```javascript
console.time('FCM-Send')
await sendNotification(userId, 'Test', 'Message')
console.timeEnd('FCM-Send')
```

**Temps attendu** : < 2 secondes

### Vérifier la taille des tokens

```sql
SELECT 
  AVG(LENGTH(token)) as avg_token_length,
  MAX(LENGTH(token)) as max_token_length
FROM user_fcm_tokens;
```

**Résultat attendu** : ~150-200 caractères

---

## 🎉 Validation finale

Si tous les tests passent :

✅ OneSignal complètement supprimé  
✅ FCM opérationnel côté client  
✅ FCM opérationnel côté serveur  
✅ Interface admin fonctionnelle  
✅ Notifications reçues et fonctionnelles  
✅ Sécurité RLS en place  
✅ Monitoring en place  

**🚀 Votre migration FCM est COMPLÈTE et OPÉRATIONNELLE !**

---

## 🆘 En cas de problème

1. Consultez `FCM_INSTALLATION.md` pour le guide détaillé
2. Vérifiez les logs navigateur et serveur
3. Testez avec le composant `NotificationHandler.vue` (mode debug)
4. Vérifiez que Firebase Admin SDK est bien initialisé

---

**Dernière mise à jour** : 12 octobre 2024

