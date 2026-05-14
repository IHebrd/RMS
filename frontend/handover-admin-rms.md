# Handover Technique - Module Administration RMS

## 📋 Informations Générales

| Information | Détail |
|------------|--------|
| **Projet** | RMS (Reclamation Management System) - Module Admin |
| **Date de livraison** | Mai 2026 |
| **Version** | 1.0.0 |
| **Technologies** | React.js, CSS3, REST API |
| **Backend requis** | Node.js/Express sur port 5000 |

---

## 🏗️ Architecture du Module Admin

### Structure des dossiers
```
frontend/
├── src/
│   ├── components/
│   │   ├── AdminLayout.js              # Layout principal avec sidebar
│   │   ├── AdminLayout.css
│   │   ├── AdminNavbar.js              # Barre de navigation supérieure
│   │   ├── AdminNavbar.css
│   │   ├── Sidebar.js                  # Menu latéral de navigation
│   │   ├── Sidebar.css
│   │   └── StatsCards.js              # Composant des statistiques
│   ├── pages/
│   │   └── adminPages/
│   │       ├── Login.js                # Page de connexion admin
│   │       ├── AdminDashboard.js       # Tableau de bord
│   │       ├── Organizations.js        # Liste des organisations
│   │       ├── AddOrganization.js      # Ajout organisation
│   │       ├── EditOrganization.js     # Modification organisation
│   │       ├── OrganizationResponsables.js  # Responsables par org
│   │       ├── AddResponsable.js       # Ajout responsable
│   │       ├── EditResponsable.js      # Modification responsable
│   │       ├── Admins.js               # Liste administrateurs
│   │       ├── AddAdmin.js             # Ajout administrateur
│   │       ├── EditAdmin.js            # Modification admin
│   │       ├── Reclamations.js         # Gestion réclamations
│   │       ├── Employers.js            # Pages (Coming Soon)
│   │       ├── Tasks.js
│   │       ├── Payments.js
│   │       ├── Proofs.js
│   │       └── Messages.js
│   └── App.js                          # Configuration des routes
```

---

## 🔐 Authentification

### Page de connexion (`/login`)
- **Email par défaut** : `admin@rms.com`
- **Mot de passe par défaut** : `Admin@123`
- **Fonctionnalités** :
  - Validation des champs
  - Affichage/masquage du mot de passe
  - "Se souvenir de moi" (sauvegarde email)
  - Redirection vers `/admin/dashboard` après connexion
  - Stockage du token dans `localStorage`

### Stockage local
```javascript
localStorage.setItem('adminToken', token);
localStorage.setItem('adminUser', JSON.stringify(user));
```

---

## 🗺️ Routes Disponibles

| Route | Composant | Description | Statut |
|-------|-----------|-------------|--------|
| `/login` | Login | Page de connexion | ✅ |
| `/admin/dashboard` | AdminDashboard | Tableau de bord | ✅ |
| `/admin/organizations` | Organizations | Liste organisations | ✅ |
| `/admin/organizations/new` | AddOrganization | Ajouter organisation | ✅ |
| `/admin/organizations/edit/:id` | EditOrganization | Modifier organisation | ✅ |
| `/admin/organizations/:id/responsables` | OrganizationResponsables | Liste responsables | ✅ |
| `/admin/organizations/:id/responsables/new` | AddResponsable | Ajouter responsable | ✅ |
| `/admin/responsables/edit/:id` | EditResponsable | Modifier responsable | ✅ |
| `/admin/admins` | Admins | Liste administrateurs | ✅ |
| `/admin/admins/new` | AddAdmin | Ajouter administrateur | ✅ |
| `/admin/admins/edit/:id` | EditAdmin | Modifier administrateur | ✅ |
| `/admin/reclamations` | Reclamations | Gestion réclamations | ✅ |
| `/admin/employers` | Employers | Gestion employés | 🚧 |
| `/admin/tasks` | Tasks | Gestion tâches | 🚧 |
| `/admin/payments` | Payments | Gestion paiements | 🚧 |
| `/admin/proofs` | Proofs | Gestion preuves | 🚧 |
| `/admin/messages` | Messages | Gestion messages | 🚧 |

---

## 📊 Fonctionnalités Implémentées

### 1. Gestion des Organisations

| Fonction | Endpoint API | Méthode |
|----------|-------------|---------|
| Liste des organisations | `/api/admin/organizations` | GET |
| Ajouter organisation | `/api/admin/organizations` | POST |
| Modifier organisation | `/api/admin/organizations/:id` | PUT |
| Supprimer organisation | `/api/admin/organizations/:id` | DELETE |
| Activer/Désactiver | `/api/admin/organizations/:id` | PUT |

**Champs du formulaire organisation :**
- Nom, Type, Description
- Logo (URL)
- Gouvernorat, Délégation, Code postal, Adresse
- Téléphone, Email, Site web
- Statut actif/inactif

---

### 2. Gestion des Responsables

| Fonction | Endpoint API | Méthode |
|----------|-------------|---------|
| Liste par organisation | `/api/admin/responsables?organization_id=:id` | GET |
| Ajouter responsable | `/api/admin/responsables` | POST |
| Modifier responsable | `/api/admin/responsables/:id` | PUT |

**Champs du formulaire responsable :**
- Prénom, Nom, CIN
- Email, Mot de passe
- Téléphone, Poste
- Statut actif/inactif

---

### 3. Gestion des Administrateurs

| Fonction | Endpoint API | Méthode |
|----------|-------------|---------|
| Liste administrateurs | `/api/admin/admins` | GET |
| Ajouter administrateur | `/api/admin/admins` | POST |
| Modifier administrateur | `/api/admin/admins/:id` | PUT |
| Supprimer administrateur | `/api/admin/admins/:id` | DELETE |

---

### 4. Gestion des Réclamations

| Fonction | Endpoint API | Méthode |
|----------|-------------|---------|
| Liste réclamations | `/api/reclamations` | GET |
| Changer statut | `/api/reclamations/:id/status` | PUT |
| Statistiques | `/api/dashboard/stats` | GET |

**Statuts disponibles :**
- `pending` — En attente
- `processing` — En cours
- `resolved` — Résolue
- `rejected` — Rejetée

---

### 5. Tableau de Bord

| Fonction | Endpoint API | Méthode |
|----------|-------------|---------|
| Statistiques globales | `/api/dashboard/stats` | GET |
| Dashboard admin | `/api/dashboard/admin` | GET |

**Statistiques affichées :**
- Nombre d'organisations
- Nombre de responsables
- Nombre d'administrateurs
- Nombre de réclamations
- Taux de satisfaction
- Temps moyen de résolution

---

## 🎨 Composants UI Réutilisables

### `AdminLayout`
Layout principal avec :
- Sidebar collapsible
- Navbar avec notifications
- Zone de contenu dynamique

### `Sidebar`
Menu latéral avec :
- 10 entrées de navigation
- Icônes colorées
- État actif sur la page courante
- Design responsive

### `StatsCards`
Affiche les statistiques sous forme de cartes :
- Chargement asynchrone
- Gestion des erreurs
- Click sur carte = navigation

---

## 🔧 Configuration et Installation

### Prérequis
```bash
Node.js >= 14.x
npm >= 6.x
Backend RMS démarré sur http://localhost:5000
```

### Installation
```bash
# Cloner le projet
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

### Variables d'environnement (optionnel)
Créer un fichier `.env` à la racine :
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📡 Communication API

### Headers requis
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### Structure de réponse attendue
```javascript
{
  success: true,
  data: {
    // Données spécifiques à l'endpoint
  }
}
```

### Gestion des erreurs
| Code | Signification | Action |
|------|--------------|--------|
| 200/201 | Succès | — |
| 401 | Non authentifié | Redirection vers login |
| 404 | Ressource non trouvée | Afficher message d'erreur |
| 500 | Erreur serveur | Afficher message générique |

---

## 🐛 Problèmes Connus et Solutions

### Problème 1 : `GET /api/admin/responsables/:id` retourne 404
> **Solution :** L'endpoint n'existe pas dans le backend. Utiliser la navigation avec `location.state` pour passer les données.

### Problème 2 : Statistiques toujours à 0
> **Solution :** Vérifier que l'endpoint `/api/dashboard/stats` retourne les bonnes données. Modifier `StatsCards.js` selon la structure réelle.

### Problème 3 : Création organisation échoue
> **Solution :** Vérifier que tous les champs requis sont envoyés et que le token est valide.

---

## 📝 Maintenance et Évolutions

### Pages à compléter (Coming Soon)
- [ ] Employés (`/admin/employers`)
- [ ] Tâches (`/admin/tasks`)
- [ ] Paiements (`/admin/payments`)
- [ ] Preuves (`/admin/proofs`)
- [ ] Messages (`/admin/messages`)

### Améliorations suggérées
- Ajouter la pagination complète pour toutes les listes
- Implémenter la recherche avancée avec filtres
- Ajouter l'export Excel/PDF des données
- Ajouter des graphiques dans le tableau de bord
- Mettre en place des notifications en temps réel
- Ajouter un système de logs des actions admin

### Sécurité
- Ajouter un refresh token
- Implémenter la déconnexion automatique après inactivité
- Ajouter une confirmation pour les actions critiques
- Limiter les tentatives de connexion

---

## 👥 Contacts

| Rôle | Nom | Contact |
|------|-----|---------|
| Développeur Frontend | À compléter | — |
| Développeur Backend | À compléter | — |
| Chef de projet | À compléter | — |

---

## 📚 Documentation Complémentaire

- **Backend API** : Voir documentation Swagger sur `http://localhost:5000/api-docs`
- **Postman Collection** : Fichier `RMS-Admin-API-Tests.json` fourni
- **Base de données** : Modèle relationnel disponible dans le backend

---

## ✅ Checklist de Validation

- [x] Page de connexion fonctionnelle
- [x] Dashboard affiche les statistiques
- [x] CRUD Organisations complet
- [x] CRUD Responsables complet
- [x] CRUD Administrateurs complet
- [x] Gestion des réclamations
- [x] Navigation sidebar fonctionnelle
- [x] Protection des routes
- [x] Responsive design
- [x] Messages d'erreur appropriés

---

*Document généré le : Mai 2026 — Prochaines mises à jour : À déterminer*
