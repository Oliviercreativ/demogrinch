# ⚡ Configuration rapide - À COPIER dans votre .env

## 🎯 Action immédiate

Ouvrez votre fichier `.env` et **ajoutez ces 2 lignes** :

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-nj5w3@grinch-99f2b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCXq8f/Ik6Yo3SI\nCbHaE11/qJsw/o7rHRpfRjBswe6c7tUrUqIRKHgqRO9rHK0+5t8Nbelq20hZejz8\nuYmYZpE918JrI3p7brLetao+v/pSbTLi6Qq9Y0VMF7i5kIwmUmstkGCdWG+IbfZc\nmDv/TpMYBGs822nU+VFt5eepGKEEE85cJlnRBbfZT85bpBHzIrleCK+bBPMBn/G6\n0nSIYCG1mrG4uTtGrE/tzxsTNuqLrGxsU+7bbG/PXBWETAhBdRtuaS0AW4H63X2L\n9KXf/eyMVqixKhxy4Tf9luxagpCCsY0KK6nyHsDux0zNX/L6gNOePK13h9q7MXZ4\nfE0ERcNlAgMBAAECgf9eM1MEI0qtgtfdpifQSjbIEvBQfcpGPM0kX3O0GL8auTus\nrKX8AiagGjCZVjZD2yCuNpXCyG8nI8S9Mn9DKHEM9/TIlkB8aUSvDiWu042lpCz2\nwcbp2b4whIs2tZBWPNpUclePYl3jXmilGegpqaOyRwxTv/L7U94/Y4t+es2GudGs\nQSXA6ZxGAJWGeYPJI/p4c64QczA5VbpPuvIe2P5iesy8l+XL9nYnRdXEFd5KB8pY\nQxTnh9GNHcwLeWFVGnxWDBKH/2nV5Xs8khOnQG/Tr9471dNXV8YgesjUu8iXWrtt\nbDxu89iq7yO04uIKCnJ7ePSkEc828kviMBxCZcECgYEAxR0gpIz7nDdMMYy6LtLO\nRwBqZmQNvN0TYQqRoYVe+Evz6vwOHj6UZLTLbrGmzQKWavtreDUe+lAoAlW1XI8f\nA9Sv6EdbIvjLj4m309/wwq+idalonkxMDfR/k+63BsI8+I9zcrIAUtFPxcO8LCay\n85NmbZjQfYQDulqfpWaBUNUCgYEAxPtIAoks8XjGqNbejV+tYUf+pcRxK2W4HVVa\nK840f/tnr9kEQW9cvFgIha1dLqSeu5qvbLijPQNVU1Mu8T2iDteogpV3mtlR0mxr\nAfEIMC0B+TIYVzmh2/8FxwPqv/iV3uS7+kyyGwDW1OYtSvj1V/Rs4+nyNh3Ph0Id\nESkGcFECgYBd8dLz+imVO5m55+t4k4oyttT/NeKCSA+LaaEdDVbFGlYHgdgsvAC3\nup9Wg58PCJOuK2P+J7s66+cVrcnBcokCp2SrXQ7nrRI/uBCAD7RM5a6VS4eMIqsA\n363KULS0qPCsOpp4aLPUxOOzSuWtWUhi5Lalt3Zuy/OG5tg92Yv6fQKBgAXou9pH\nny+HPf5mo7p9+keGz17Nq89vd7x5iQDzaKPGOPAPhI8p9hA4W9kWwErb6V8bXtPW\nHh+AcBjVz/ywqqHjWkzAixv8FPZJBlTClEpNr1d4Zz6GnhJpbhTwSySDIovTNMhn\ncJhayBcO6KDtIv8GeBXGONvivQ0DsLeJEYZhAoGACuLy6eQq65T8XR1oj+y2oG4y\nuj//UleetOoYFiwZfAfKgkf7KvZ9z8BiKUR0Ybu2I8ON6RPe1NncejjivUzPcPaE\n5IYrFxmJGdLzC5Jle94OAER4N6VLuwZmr+xyA1lLkfRh7bK4ci4LjTCL/gJ8gqbU\nS9TuDr8NWyEvifxYT9E=\n-----END PRIVATE KEY-----\n"
```

---

## 📝 Instructions

1. **Ouvrez** votre fichier `.env` (à la racine de votre projet)

2. **Ajoutez** ces 2 lignes **à la fin** du fichier

3. **Sauvegardez** le fichier

4. **Redémarrez** le serveur :
   ```bash
   # Arrêtez avec Ctrl+C
   bun run dev
   ```

---

## ✅ Vérification

Au démarrage du serveur, vous devriez voir :

```
✅ Firebase Admin SDK initialisé avec succès
📦 Project ID: grinch-99f2b
📧 Service Account: firebase-adminsdk-nj5w3@grinch-99f2b.iam.gserviceaccount.com
```

**Si vous voyez ça** → C'est bon ! 🎉

**Si vous voyez encore "Variables manquantes"** → Vérifiez que vous avez bien copié les guillemets et les `\n`

---

## ⚠️ Important

- ✅ Gardez les **guillemets** autour de `FIREBASE_PRIVATE_KEY`
- ✅ Gardez les **`\n`** dans la clé (ne les remplacez pas)
- ✅ La clé est **longue** (environ 1700 caractères) - c'est normal
- ❌ Ne committez **JAMAIS** ce fichier `.env` dans Git

---

**Une fois configuré, le serveur devrait démarrer sans erreur et vous pourrez envoyer des notifications ! 🚀**

