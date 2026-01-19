# Guide : Créer un projet Firebase compatible avec Expo/React Native

## 📋 Prérequis
- Un compte Google (pour accéder à Firebase)
- Votre application Expo configurée

## 🚀 Étapes de création du projet Firebase

### Étape 1 : Créer un nouveau projet Firebase

1. **Aller sur Firebase Console**
   - Ouvrez https://console.firebase.google.com/
   - Connectez-vous avec votre compte Google

2. **Créer un nouveau projet**
   - Cliquez sur "Ajouter un projet" ou "Add project"
   - **Nom du projet** : `app-job-tracker` (ou le nom de votre choix)
   - Cliquez sur "Continuer" / "Continue"

3. **Configurer Google Analytics (optionnel mais recommandé)**
   - Cochez "Activer Google Analytics pour ce projet"
   - Sélectionnez ou créez un compte Analytics
   - Cliquez sur "Créer le projet" / "Create project"

4. **Attendre la création**
   - Firebase va créer votre projet (quelques secondes)
   - Cliquez sur "Continuer" / "Continue" une fois terminé

---

### Étape 2 : Activer les services nécessaires

#### 2.1. Activer Authentication (Authentification)

1. Dans le menu de gauche, cliquez sur **"Authentication"** ou **"Authentification"**
2. Cliquez sur **"Commencer"** / **"Get started"**
3. Activez les méthodes de connexion :
   - **Email/Password** : Activez-la (c'est celle que votre app utilise)
   - Optionnel : Activez d'autres méthodes si nécessaire (Google, Facebook, etc.)

#### 2.2. Créer la base de données Firestore

1. Dans le menu de gauche, cliquez sur **"Firestore Database"** ou **"Base de données Firestore"**
2. Cliquez sur **"Créer une base de données"** / **"Create database"**
3. **Choisir le mode** :
   - Sélectionnez **"Mode production"** (recommandé) ou **"Mode test"** pour le développement
   - Cliquez sur "Suivant" / "Next"
4. **Choisir l'emplacement** :
   - Sélectionnez une région proche de vos utilisateurs (ex: `europe-west` pour l'Europe)
   - Cliquez sur "Activer" / "Enable"
   - ⚠️ **Important** : Notez l'emplacement choisi (ex: `nam5`, `europe-west1`)

#### 2.3. Configurer les règles de sécurité Firestore

1. Dans l'onglet **"Règles"** / **"Rules"** de Firestore
2. Configurez les règles selon vos besoins. Pour commencer en développement :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles temporaires pour le développement - À MODIFIER EN PRODUCTION
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Cliquez sur **"Publier"** / **"Publish"**

⚠️ **Sécurité** : Ces règles permettent à tous les utilisateurs authentifiés d'accéder à toutes les données. Vous devrez les affiner pour la production.

#### 2.4. Activer Storage (si nécessaire pour les fichiers)

1. Dans le menu de gauche, cliquez sur **"Storage"**
2. Cliquez sur **"Commencer"** / **"Get started"**
3. Acceptez les règles de sécurité par défaut
4. Choisissez l'emplacement (même région que Firestore si possible)
5. Cliquez sur "Terminé" / "Done"

---

### Étape 3 : Ajouter une application Web

Votre application Expo utilise le SDK Firebase JavaScript, donc vous devez ajouter une **application Web** :

1. **Retourner à la page d'accueil du projet**
   - Cliquez sur l'icône d'engrenage ⚙️ en haut à gauche
   - Cliquez sur **"Paramètres du projet"** / **"Project settings"**

2. **Ajouter une application Web**
   - Descendez jusqu'à la section **"Vos applications"** / **"Your apps"**
   - Cliquez sur l'icône **Web** (`</>`) pour ajouter une application web

3. **Configurer l'application**
   - **Nom de l'application** : `Job Tracker Web` (ou votre choix)
   - **Cochez** "Configurer également Firebase Hosting" (optionnel)
   - Cliquez sur **"Enregistrer l'application"** / **"Register app"**

4. **Copier la configuration**
   - Vous verrez un bloc de code JavaScript avec votre configuration Firebase
   - **Copiez ces valeurs** - vous en aurez besoin pour votre application :
     ```javascript
     const firebaseConfig = {
       apiKey: "VOTRE_API_KEY",
       authDomain: "votre-projet.firebaseapp.com",
       projectId: "votre-projet-id",
       storageBucket: "votre-projet.firebasestorage.app",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abcdef123456",
       measurementId: "G-XXXXXXXXXX" // Optionnel
     };
     ```

---

### Étape 4 : Structure des collections Firestore

Votre application utilise ces collections (créez-les si nécessaire) :

- **`users`** - Stocke les informations des utilisateurs
- **`jobs`** - Stocke les offres d'emploi
- **`applications`** - Stocke les candidatures
- **`messages`** - Stocke les messages entre utilisateurs

Ces collections seront créées automatiquement lors de la première utilisation, mais vous pouvez les créer manuellement si vous préférez.

---

### Étape 5 : Configurer les index Firestore (si nécessaire)

Si vous utilisez des requêtes complexes avec `where()` et `orderBy()`, Firebase vous demandera de créer des index :

1. Lors de l'exécution d'une requête, Firebase affichera un lien pour créer l'index
2. Cliquez sur le lien et suivez les instructions
3. Attendez que l'index soit créé (quelques minutes)

---

## ✅ Checklist de vérification

Avant de mettre à jour votre code, vérifiez que vous avez :

- [ ] ✅ Projet Firebase créé
- [ ] ✅ Authentication activé avec Email/Password
- [ ] ✅ Firestore Database créée
- [ ] ✅ Règles de sécurité Firestore configurées
- [ ] ✅ Storage activé (si vous utilisez des fichiers)
- [ ] ✅ Application Web ajoutée
- [ ] ✅ Configuration Firebase copiée (apiKey, authDomain, projectId, etc.)

---

## 🔧 Prochaines étapes

Une fois votre projet Firebase créé et configuré :

1. **Mettre à jour `src/config/firebaseConfig.ts`** avec vos nouvelles credentials
2. **Tester la connexion** en lançant votre application
3. **Créer un premier utilisateur** pour vérifier que l'authentification fonctionne
4. **Vérifier les données** dans la console Firebase

---

## 📚 Ressources utiles

- [Documentation Firebase pour Expo](https://docs.expo.dev/guides/using-firebase/)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Documentation Firebase Auth](https://firebase.google.com/docs/auth)

---

## ⚠️ Notes importantes

1. **Sécurité** : Ne commitez jamais vos credentials Firebase dans Git si le projet est public. Utilisez des variables d'environnement pour la production.

2. **Plan Firebase** : Le plan gratuit (Spark) est suffisant pour le développement et les petits projets.

3. **Région** : Choisissez une région proche de vos utilisateurs pour de meilleures performances.

4. **Règles de sécurité** : Les règles par défaut sont permissives. Affinez-les pour la production.
