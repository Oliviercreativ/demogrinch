# 🔧 Configuration Firebase Admin - À FAIRE MAINTENANT

## ⚠️ Erreur actuelle

Vous voyez cette erreur car les **credentials Firebase Admin** ne sont pas configurés.

```
ERROR Cannot read properties of undefined (reading 'length')
```

---

## 🎯 Solution : Ajouter 2 variables dans votre fichier `.env`

### **Étape 1 : Obtenir les credentials**

1. Ouvrez [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur ⚙️ → **Paramètres du projet**
4. Onglet **"Comptes de service"**
5. Bouton **"Générer une nouvelle clé privée"**
6. Un fichier JSON sera téléchargé (ex: `votre-projet-firebase-adminsdk.json`)

### **Étape 2 : Ouvrir le fichier JSON**

Le fichier ressemble à ça :

```json
{
  "type": "service_account",
  "project_id": "votre-projet-123",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@votre-projet-123.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### **Étape 3 : Copier dans votre `.env`**

**Ouvrez votre fichier `.env`** et ajoutez ces **2 lignes à la fin** :

```env
# Firebase Admin SDK (pour envoyer des notifications)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-projet.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**Remplacez** :
- `firebase-adminsdk-xxxxx@...` par la valeur de `"client_email"` du JSON
- `-----BEGIN PRIVATE KEY-----\n...` par la valeur de `"private_key"` du JSON

⚠️ **IMPORTANT** :
- Gardez les **guillemets** autour de `FIREBASE_PRIVATE_KEY`
- Gardez les **`\n`** dans la clé (ne les remplacez pas par des retours à la ligne)
- Copiez la clé **EXACTEMENT** comme elle apparaît dans le JSON

---

## ✅ **Vérification**

Après avoir sauvegardé votre `.env`, redémarrez le serveur :

```bash
# Arrêtez le serveur (Ctrl+C si il tourne)
bun run dev
```

**Au démarrage, vous devriez voir** :

```
✅ Firebase Admin SDK initialisé avec succès
📦 Project ID: votre-projet-123
```

**Si vous voyez ça** → C'est bon ! ✅  
**Si erreur** → Vos credentials sont incorrects, vérifiez la copie.

---

## 🧪 **Test rapide**

Une fois le serveur redémarré sans erreur, testez l'API :

```bash
# Dans un autre terminal
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["test"],
    "title": "Test",
    "message": "Test message"
  }'
```

Si ça fonctionne, vous verrez la réponse de l'API.

---

## 📝 **Exemple de .env complet**

Votre fichier `.env` devrait ressembler à ça :

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# Firebase Client (déjà configuré)
NUXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXX
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet-123
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NUXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
NUXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxxxxxxxxxxxxx

# Firebase Admin SDK (À AJOUTER)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-projet-123.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# Stripe (si configuré)
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

---

## ❓ **Vous n'avez pas le fichier JSON ?**

Si vous n'avez jamais téléchargé les credentials :

1. Allez sur https://console.firebase.google.com/
2. Connectez-vous avec votre compte Google
3. Sélectionnez le projet que vous utilisez pour Grinch
4. Suivez les étapes ci-dessus

**Le projet Firebase doit être le même** que celui configuré dans vos variables `NUXT_PUBLIC_FIREBASE_*`.

---

**📞 Dites-moi quand c'est fait pour qu'on teste ensemble !**

