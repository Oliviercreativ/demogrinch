# ⚡ ACTION IMMÉDIATE - Configurer Firebase Admin

## ✅ Ce qui est déjà fait

- ✅ `firebase-admin` installé
- ✅ Plugin Nitro créé
- ✅ Code modifié et prêt
- ✅ OneSignal supprimé

## 🎯 Ce qu'il vous reste à faire (5 minutes)

---

### **Étape 1 : Obtenir les credentials Firebase** (3 min)

1. **Ouvrez** → https://console.firebase.google.com/

2. **Sélectionnez** votre projet Grinch/GRINCH

3. Cliquez sur **⚙️** (en haut à gauche) → **Paramètres du projet**

4. Cliquez sur l'onglet **"Comptes de service"**

5. Descendez et cliquez sur **"Générer une nouvelle clé privée"**

6. Confirmez → Un fichier **JSON** sera téléchargé

   Nom du fichier : `votre-projet-firebase-adminsdk-xxxxx.json`

7. **Ouvrez ce fichier** avec un éditeur de texte

---

### **Étape 2 : Éditer votre fichier `.env`** (2 min)

1. **Ouvrez** votre fichier `.env` (à la racine de votre projet)

2. **Ajoutez ces 2 lignes à la fin** :

```env
# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=REMPLACEZ_PAR_CLIENT_EMAIL_DU_JSON
FIREBASE_PRIVATE_KEY="REMPLACEZ_PAR_PRIVATE_KEY_DU_JSON"
```

3. **Dans le JSON téléchargé**, trouvez :

   ```json
   {
     ...
     "client_email": "firebase-adminsdk-abc123@votre-projet.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n",
     ...
   }
   ```

4. **Copiez** `client_email` dans votre `.env` :
   ```env
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@votre-projet.iam.gserviceaccount.com
   ```

5. **Copiez** `private_key` dans votre `.env` :
   ```env
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
   ```

⚠️ **ATTENTION** :
- Gardez les **guillemets** autour de la clé privée
- Gardez les **`\n`** (ne les supprimez pas !)
- La clé doit faire environ 1700 caractères

6. **Sauvegardez** le fichier `.env`

---

### **Étape 3 : Redémarrer le serveur** (30 sec)

```bash
# Dans votre terminal, arrêtez le serveur actuel (Ctrl+C)

# Puis relancez
bun run dev
```

**Au démarrage, cherchez cette ligne** :

```
✅ Firebase Admin SDK initialisé avec succès
📦 Project ID: votre-projet-123
```

**Si vous voyez ça** → ✅ **C'EST BON !**

**Si vous voyez** :
```
⚠️ Firebase Admin SDK - Variables d'environnement manquantes
```
→ Vos credentials `.env` sont incorrects ou manquants

---

## 🧪 **Test rapide (optionnel)**

Une fois le serveur démarré sans erreur, testez l'envoi :

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["test-user-id"],
    "title": "Test",
    "message": "Premier test FCM !"
  }'
```

---

## 📸 **Exemple visuel du JSON Firebase**

Votre fichier JSON téléchargé ressemble à ça :

```json
{
  "type": "service_account",
  "project_id": "madeinconflans-abc123",        ← Devrait matcher NUXT_PUBLIC_FIREBASE_PROJECT_ID
  
  "client_email": "firebase-adminsdk-xyz@madeinconflans-abc123.iam.gserviceaccount.com",
  ↑ Copiez cette ligne complète dans FIREBASE_CLIENT_EMAIL
  
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n",
  ↑ Copiez cette ligne complète dans FIREBASE_PRIVATE_KEY (avec les guillemets et \n)
  
  "client_id": "123456789",
  ...
}
```

---

## ❌ **Erreurs courantes**

### Erreur : "Invalid service account"

→ Vous avez mal copié `FIREBASE_PRIVATE_KEY`
- Vérifiez les guillemets
- Vérifiez les `\n`
- La clé doit commencer par `"-----BEGIN` et finir par `-----\n"`

### Erreur : "Variables d'environnement manquantes"

→ Vous avez oublié une variable ou fait une faute de frappe
- Le nom doit être exactement `FIREBASE_CLIENT_EMAIL` (pas FIREBASE_EMAIL)
- Le nom doit être exactement `FIREBASE_PRIVATE_KEY` (pas FIREBASE_KEY)

### Le serveur démarre mais rien dans les logs

→ Vérifiez que vous avez bien **sauvegardé** le fichier `.env`

---

## 🎯 **Checklist finale**

- [ ] Fichier JSON téléchargé depuis Firebase Console
- [ ] `FIREBASE_CLIENT_EMAIL` ajouté dans `.env`
- [ ] `FIREBASE_PRIVATE_KEY` ajouté dans `.env` (avec guillemets et \n)
- [ ] Fichier `.env` sauvegardé
- [ ] Serveur redémarré
- [ ] Message "✅ Firebase Admin SDK initialisé" visible

---

**🎉 Une fois ces étapes faites, votre système FCM sera 100% opérationnel !**

**📞 Dites-moi quand c'est fait pour qu'on teste l'envoi de notifications !**

