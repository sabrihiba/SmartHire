# Règles de sécurité Firestore

## Configuration des règles Firestore

Pour corriger l'erreur "Missing or insufficient permissions", vous devez configurer les règles de sécurité Firestore dans la console Firebase.

### Étapes pour configurer les règles :

1. **Ouvrir la console Firebase**
   - Allez sur https://console.firebase.google.com/
   - Sélectionnez votre projet `smarthire-db770`

2. **Accéder aux règles Firestore**
   - Dans le menu de gauche, cliquez sur **"Firestore Database"**
   - Cliquez sur l'onglet **"Règles"** (Rules)

3. **Copier et coller les règles suivantes** :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is the owner
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isOwner(userId);
      // Users can create/update their own profile
      allow create, update: if isOwner(userId);
      // Admins can read all users
      allow read: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Jobs collection
    match /jobs/{jobId} {
      // Anyone authenticated can read jobs (including archived ones for detail view)
      allow read: if isAuthenticated();
      // Recruiters can create jobs
      allow create: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'RECRUITER';
      // Only job owner (recruiter) can update/delete their jobs
      allow update, delete: if isAuthenticated() && 
        resource.data.recruiterId == request.auth.uid;
    }
    
    // Applications collection
    match /applications/{applicationId} {
      // Applicant can read their own applications
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      // Recruiter can read applications for their jobs
      allow read: if isAuthenticated() && 
        resource.data.recruiterId == request.auth.uid;
      // Admins can read all applications
      allow read: if isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
      
      // Authenticated users can create applications
      allow create: if isAuthenticated();
      
      // Applicant can update their own applications
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      // Recruiter can update applications for their jobs
      allow update: if isAuthenticated() && 
        resource.data.recruiterId == request.auth.uid;
    }
    
    // Messages collection
    match /messages/{messageId} {
      // Users can read messages for applications they're involved in
      allow read: if isAuthenticated() && (
        // Applicant can read messages for their applications
        get(/databases/$(database)/documents/applications/$(resource.data.applicationId)).data.userId == request.auth.uid ||
        // Recruiter can read messages for applications for their jobs
        get(/databases/$(database)/documents/applications/$(resource.data.applicationId)).data.recruiterId == request.auth.uid
      );
      
      // Authenticated users can create messages for applications they're involved in
      allow create: if isAuthenticated() && (
        // Applicant can create messages for their applications
        get(/databases/$(database)/documents/applications/$(request.resource.data.applicationId)).data.userId == request.auth.uid ||
        // Recruiter can create messages for applications for their jobs
        get(/databases/$(database)/documents/applications/$(request.resource.data.applicationId)).data.recruiterId == request.auth.uid
      );
      
      // Users can update messages they sent (mark as read, etc.)
      allow update: if isAuthenticated() && 
        resource.data.senderId == request.auth.uid;
    }
    
    // Application history collection
    match /application_history/{historyId} {
      // Users can read history for applications they're involved in
      allow read: if isAuthenticated() && (
        get(/databases/$(database)/documents/applications/$(resource.data.applicationId)).data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/applications/$(resource.data.applicationId)).data.recruiterId == request.auth.uid
      );
      
      // System can create history entries (when status changes)
      allow create: if isAuthenticated();
    }
  }
}
```

4. **Cliquer sur "Publier"** (Publish)

---

## Règles simplifiées pour le développement (moins sécurisées)

Si vous avez besoin de règles plus simples pour le développement uniquement :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ ATTENTION : Ces règles permettent à tous les utilisateurs authentifiés
    // d'accéder à toutes les données. À utiliser UNIQUEMENT en développement !
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Important** : Ne jamais utiliser les règles simplifiées en production !

---

## Vérification

Après avoir publié les règles :

1. **Attendre quelques secondes** pour que les règles soient propagées
2. **Tester votre application** :
   - Créer une candidature
   - Vérifier que le message initial est créé
   - Vérifier que le recruteur peut voir les messages

---

## Dépannage

Si vous avez encore des erreurs de permissions :

1. **Vérifier que l'utilisateur est bien authentifié** :
   - Vérifier dans la console Firebase → Authentication que l'utilisateur existe
   - Vérifier que `request.auth.uid` correspond bien à l'ID utilisateur

2. **Vérifier les logs Firestore** :
   - Dans la console Firebase → Firestore Database → Règles
   - Cliquer sur "Simulateur" pour tester vos règles

3. **Vérifier la structure des données** :
   - Assurez-vous que `recruiterId` est bien présent dans les applications
   - Assurez-vous que `userId` correspond bien à l'ID de l'utilisateur authentifié
