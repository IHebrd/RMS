# 🗂️ RMS — Handover Global du Projet

> **Reclamation Management System** — Document de passation technique complet  
> Généré le : Mai 2026 | Version : 1.0.0

---

## 1. 🎯 Vision Générale du Projet

**RMS (Reclamation Management System)** est une plateforme complète de gestion du cycle de vie des réclamations citoyens/clients adressées à des organisations (publiques, privées, associations).

### Idée centrale

Un **citoyen/utilisateur** signale un problème (panne électrique, voirie dégradée, problème numérique, etc.) contre une ou plusieurs organisations. Ces organisations prennent en charge la réclamation, créent des tâches pour leurs employés, collectent des preuves de résolution, et paient leurs employés. Un administrateur supervise l'ensemble de la plateforme.

### Flux principal en une phrase

```
Utilisateur crée réclamation → Responsable affecte tâches → Employé exécute & uploade preuves → Responsable valide & paie → Admin supervise tout
```

---

## 2. 🏗️ Architecture Globale

```
RMS/
├── backend/          # API Node.js/Express + PostgreSQL
│   ├── server.js
│   ├── config/       # DB, Email, Multer
│   ├── routes/       # Déclaration des endpoints
│   ├── controllers/  # Logique métier par acteur
│   ├── models/       # Classes SQL (pas d'ORM)
│   ├── services/     # Services transversaux
│   ├── middleware/   # Auth, upload, erreurs
│   ├── validations/  # Schémas Joi
│   ├── sql/          # Schema + seed PostgreSQL
│   └── uploads/      # Fichiers uploadés (avatars, preuves)
│
└── frontend/         # SPA React.js
    └── src/
        ├── App.js              # Routing global (4 portails)
        ├── components/         # Composants partagés (Layout, Sidebar...)
        └── pages/
            ├── adminPages/         # Portail Admin
            ├── responsablesPages/  # Portail Responsable
            ├── employerPages/      # Portail Employeur
            └── userPages/          # Portail Utilisateur
```

### Principe d'architecture : Layered Monolith

| Couche | Rôle |
|--------|------|
| **Routes** | Déclare les endpoints et les restrictions de rôle |
| **Controllers** | Orchestre la requête/réponse et la logique métier |
| **Models** | Classes SQL pour l'accès aux données (raw SQL, pas d'ORM runtime) |
| **Services** | Logique réutilisable transversale (statuts, paiements, emails, balances) |
| **Middleware** | Auth JWT, uploads Multer, erreurs centralisées |

---

## 3. 🧑‍🤝‍🧑 Les 4 Acteurs du Système

### 3.1 👤 User (Citoyen / Client)

**Qui c'est :** Toute personne qui soumet une réclamation.  
**Comment il accède :** Auto-inscription via `/user/signup`

| Capacité | Détail |
|----------|--------|
| S'inscrire / Se connecter | `/auth/register`, `/auth/login` |
| Créer une réclamation | Choisit le type, l'urgence, les organisations cibles |
| Suivre ses réclamations | Timeline horodatée, statut en temps réel |
| Annuler une réclamation | Seulement si `pending` |
| Échanger des messages | Thread par réclamation |
| Gérer son profil | Photo, infos personnelles |

**Token stocké dans :** `localStorage → userToken / userUser`  
**Route frontend d'entrée :** `/user/login`

---

### 3.2 🏢 Responsable

**Qui c'est :** Manager d'une organisation. Créé par l'Admin.  
**Périmètre :** Limité aux réclamations adressées à **son organisation**.

| Capacité | Détail |
|----------|--------|
| Voir les réclamations de son org | Filtrées automatiquement par `organization_id` |
| Changer le statut d'une réclamation | Via workflow contrôlé |
| Créer et gérer des employés | CRUD complet + bulk creation |
| Créer et affecter des tâches | Lier une tâche à un employé et une réclamation |
| Valider les preuves d'un employé | Accepter ou rejeter les fichiers uploadés |
| Distribuer les paiements | Créer une `payment_distribution` → `payment_items` |
| Voir les performances de l'équipe | Dashboard analytique |

**Token stocké dans :** `localStorage → responsableToken / responsableUser`  
**Route frontend d'entrée :** `/responsable/login`

---

### 3.3 👷 Employer (Employé)

**Qui c'est :** Technicien / agent de terrain. Créé par le Responsable.  
**Périmètre :** Limité aux tâches qui lui sont affectées.

| Capacité | Détail |
|----------|--------|
| Voir ses tâches affectées | Liste + détail |
| Démarrer / Compléter / Échouer une tâche | Transition de statut |
| Uploader des preuves | Images (≤5 MB) ou vidéos (≤50 MB) |
| Supprimer ses propres preuves | Avant validation |
| Consulter son solde | Portefeuille interne alimenté par paiements |
| Envoyer des messages | Thread sur la réclamation liée à la tâche |
| Gérer son profil | Photo, infos |

**Token stocké dans :** `localStorage → employerToken / employerUser`  
**Route frontend d'entrée :** `/employer/login`

---

### 3.4 🔑 Admin

**Qui c'est :** Super-utilisateur de la plateforme.  
**Périmètre :** Visibilité et contrôle complets, cross-organisation.

| Capacité | Détail |
|----------|--------|
| CRUD Organisations | Publiques, privées, associations |
| CRUD Responsables | Assigner à une organisation |
| CRUD Admins | Gérer les autres admins |
| Audit toutes les réclamations | Lecture + suppression |
| Audit toutes les tâches | Lecture + suppression |
| Audit tous les paiements | Distributions + items |
| Audit toutes les preuves | Lecture + suppression |
| Audit tous les messages | Lecture + suppression |
| Dashboard global | Stats cross-plateforme |

**Credentials par défaut :** `admin@rms.com` / `Admin@123`  
**Token stocké dans :** `localStorage → adminToken / adminUser`  
**Route frontend d'entrée :** `/login`

---

## 4. 🔄 Le Cycle de Vie d'une Réclamation

```
                  ┌─────────────────────────────────────────┐
                  │           RÉCLAMATION CRÉÉE              │
                  │         (User → status: pending)         │
                  └─────────────────┬───────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │    Responsable prend en charge │
                    │      status: in_progress       │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────▼─────────────────────┐
              │           Tâches créées & affectées        │
              │        (Employer → status: assigned)       │
              └─────────────────────┬─────────────────────┘
                                    │
              ┌─────────────────────▼─────────────────────┐
              │        Employer démarre la tâche           │
              │         (status: in_progress)              │
              └─────────────────────┬─────────────────────┘
                                    │
              ┌─────────────────────▼─────────────────────┐
              │    Employer uploade preuves & complète     │
              │         (status: completed)                │
              └─────────────────────┬─────────────────────┘
                                    │
              ┌─────────────────────▼─────────────────────┐
              │  Responsable valide preuves → paie employé │
              │      Réclamation → status: validated       │
              └─────────────────────┬─────────────────────┘
                                    │
              ┌─────────────────────▼─────────────────────┐
              │         Réclamation archivée               │
              │         (status: archived)                 │
              └───────────────────────────────────────────┘
```

### Règles de transition automatique

- Si **toutes les tâches** d'une réclamation passent à `completed` → la réclamation parente est auto-validée (`validated`)
- Si **toutes les organisations** liées valident leur côté → la réclamation parente est auto-validée

---

## 5. ⚙️ Stack Technique

### Backend

| Élément | Technologie |
|---------|-------------|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4.x + `express-async-errors` |
| Base de données | PostgreSQL (raw SQL via `pg` / `pg-pool`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Sécurité | `helmet`, `cors`, `express-rate-limit` |
| Fichiers | `multer` (stockage local `uploads/`) |
| Email | `nodemailer` + templates HTML inline |
| Validation | `joi` |
| Logging | Morgan (HTTP) + fichiers `logs/` + console |
| Dev | `nodemon`, `eslint`, `prettier`, `jest` |

### Frontend

| Élément | Technologie |
|---------|-------------|
| Framework | React.js (Create React App) |
| Routing | React Router v6 (`BrowserRouter`) |
| Style | CSS3 vanilla (un fichier `.css` par composant) |
| Auth | `localStorage` (token + user par rôle) |
| HTTP | `fetch` natif (pas d'axios) |
| Port de dev | `3000` |

---

## 6. 🔐 Système d'Authentification

### Fonctionnement

1. Login unique `/auth/login` : le backend cherche l'email dans **admin → responsable → employer → user** dans l'ordre
2. Si trouvé + mot de passe bcrypt valide → JWT généré (expire : **7 jours**)
3. JWT payload : `{ id, table, role }`
4. Le frontend stocke le token dans `localStorage` avec une clé **par rôle** :

```
adminToken          / adminUser
responsableToken    / responsableUser
employerToken       / employerUser
userToken           / userUser
```

### Middleware backend

| Middleware | Rôle |
|-----------|------|
| `protect` | Vérifie `Authorization: Bearer <token>` |
| `authorize(...roles)` | Vérifie l'appartenance au rôle |
| `checkOrganizationAccess` | Vérifie que le responsable accède bien à son organisation |

### Protection frontend

4 composants `<XxxRoute>` wrappent les routes privées et redirigent si token absent ou rôle invalide.

---

## 7. 🛠️ Services Métier (Backend)

### 7.1 `statusService.js` — Moteur de workflow

Service central qui contrôle **toutes les transitions de statut** avec transaction PostgreSQL.

```
Réclamation :        pending ↔ in_progress → validated → archived
                              └→ failed ↔ pending → archived
Réclamation/Org :    Même workflow (niveau organisation)
Tâche :              assigned → in_progress → completed
                                            └→ failed → assigned
```

Fonctions clés :
- `changeStatus(...)` → transition atomique avec historique
- `isTransitionAllowed(entityType, from, to)` → garde-fou
- `updateParentReclamationStatus(...)` → auto-validation parent
- `getReclamationTimeline(reclamationId)` → timeline horodatée

---

### 7.2 `emailService.js` — Notifications Email

Templates HTML inline pour :

| Déclencheur | Template |
|-------------|----------|
| Inscription user | `welcome` |
| Création compte responsable/employé | `accountCreated` (avec MDP temporaire) |
| Réclamation créée | `reclamationCreated` |
| Changement de statut | `reclamationStatusChanged` |
| Tâche affectée à employé | `taskAssigned` |
| Tâche complétée (notif responsable) | `taskCompletedByEmployer` |
| Tâche échouée (notif responsable) | `taskFailedByEmployer` |
| Paiement reçu | `paymentReceived` |

Chaque email envoyé est **loggé en base** (`emails_notifications`) avec statut `sent` ou `failed`.

---

### 7.3 `paymentService.js` — Paiements

Gère la création d'une distribution de paiement :
- `payment_distribution` → 1 par réclamation/organisation
- `payment_items` → 1 par employé concerné
- Déclenche la mise à jour du **solde employé** (`balanceService`)

---

### 7.4 `balanceService.js` — Portefeuille Employé

Maintient le solde interne de chaque employé (crédité lors d'un `payment_item`).

---

### 7.5 `referenceService.js` — Références Uniques

Génère des références de réclamation au format : `REC-2026-000001`

---

## 8. 📡 API — Catalogue des Endpoints

Base URL : `http://localhost:5000/api`

### Auth (public)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription utilisateur |
| POST | `/auth/login` | Connexion (tous acteurs) |
| POST | `/auth/logout` | Déconnexion |
| PUT | `/auth/change-password` | Changement mot de passe |

### User
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/user/organizations` | Liste des organisations |
| GET/PUT | `/user/profile` | Profil utilisateur |
| POST | `/user/profile/avatar` | Upload avatar |
| POST | `/user/reclamations` | Créer réclamation |
| GET | `/user/reclamations` | Mes réclamations |
| GET | `/user/reclamations/:id` | Détail réclamation |
| GET | `/user/reclamations/:id/tracking` | Timeline |
| PUT | `/user/reclamations/:id/cancel` | Annuler |
| GET/POST | `/user/reclamations/:id/messages` | Messages |

### Responsable
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/responsable/dashboard` | Dashboard |
| GET | `/responsable/reclamations` | Réclamations de l'org |
| PUT | `/responsable/reclamations/:id/status` | Changer statut |
| POST/GET | `/responsable/employees` | Gérer employés |
| POST | `/responsable/employees/bulk` | Création en masse |
| PUT | `/responsable/employees/:id/activate` | Activer/désactiver |
| POST/GET | `/responsable/tasks` | Gérer tâches |
| PUT | `/responsable/tasks/:id/validate` | Valider tâche |
| PUT | `/responsable/tasks/:id/proofs/validate` | Valider preuves |
| POST | `/responsable/payments/distribute` | Distribuer paiement |
| GET | `/responsable/payments/history` | Historique paiements |
| GET | `/dashboard/performance` | Perf équipe |

### Employer
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/employer/dashboard` | Dashboard |
| GET/PUT | `/employer/profile` | Profil |
| GET | `/employer/tasks` | Mes tâches |
| PUT | `/employer/tasks/:id/start` | Démarrer tâche |
| PUT | `/employer/tasks/:id/complete` | Compléter tâche |
| PUT | `/employer/tasks/:id/fail` | Signaler échec |
| POST | `/employer/tasks/:id/proofs` | Uploader preuves |
| DELETE | `/employer/proofs/:id` | Supprimer preuve |
| GET | `/employer/balance` | Solde |
| GET/POST | `/employer/tasks/:id/messages` | Messages |

### Admin
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| CRUD | `/admin/organizations` | Organisations |
| CRUD | `/admin/responsables` | Responsables |
| CRUD | `/admin/admins` | Administrateurs |
| GET/DELETE | `/reclamations` | Toutes les réclamations |
| GET/DELETE | `/tasks` | Toutes les tâches |
| GET/DELETE | `/payments/distributions` | Paiements |
| GET/DELETE | `/proofs` | Preuves |
| GET/DELETE | `/messages` | Messages |
| GET | `/dashboard/admin` | Dashboard global |
| GET | `/dashboard/stats` | Stats globales |

---

## 9. 🗄️ Modèle de Données (Entités Clés)

```
organizations ──< reclamation_organizations >── reclamations
      │                      │                       │
      │                   tasks                   user
      │                      │
responsable              employer
                              │
                          proofs
                              │
                    payment_items >── payment_distributions
                          
status_history  (lié à : reclamations, reclamation_organizations, tasks)
reclamation_messages (threads par réclamation)
emails_notifications (log des emails envoyés)
```

### Enums importants

| Enum | Valeurs |
|------|---------|
| `organization_type` | `public`, `private`, `association` |
| `reclamation_type` | `electrique`, `numerique`, `securite`, `voirie`, `plomberie`, `autre` |
| `urgency_level` | `normal`, `urgent`, `tres_urgent` |
| `status_type` | `pending`, `in_progress`, `validated`, `failed`, `archived` |
| `task_status_type` | `assigned`, `in_progress`, `completed`, `failed` |
| `actor_type` | `admin`, `responsable`, `employer`, `user` |

---

## 10. 🖥️ Frontend — Les 4 Portails

### Architecture de routing

```
/                   → redirect → /login
/login              → Portail Admin
/responsable/login  → Portail Responsable
/employer/login     → Portail Employeur
/user/login         → Portail Utilisateur
/user/signup        → Inscription
```

### Portail Admin (`/admin/*`)

| Page | Route | Statut |
|------|-------|--------|
| Dashboard | `/admin/dashboard` | ✅ |
| Organisations | `/admin/organizations` | ✅ |
| Ajouter/Modifier Org | `/admin/organizations/new` `/edit/:id` | ✅ |
| Responsables par Org | `/admin/organizations/:id/responsables` | ✅ |
| Ajouter/Modifier Responsable | `/new` `/edit/:id` | ✅ |
| Admins | `/admin/admins` | ✅ |
| Ajouter/Modifier Admin | `/new` `/edit/:id` | ✅ |
| Réclamations | `/admin/reclamations` | ✅ |
| Employés / Tâches / Paiements / Preuves / Messages | `*` | 🚧 Coming Soon |

---

### Portail Responsable (`/responsable/*`)

| Page | Statut |
|------|--------|
| Dashboard | ✅ |
| Réclamations | ✅ |
| Employés (CRUD) | ✅ |
| Tâches (CRUD + validation preuves) | ✅ |
| Paiements (distribution + historique) | ✅ |
| Performance équipe | ✅ |

---

### Portail Employeur (`/employer/*`)

| Page | Statut |
|------|--------|
| Dashboard | ✅ |
| Tâches (start/complete/fail + upload preuves) | ✅ |
| Profil | ✅ |
| Solde / Portefeuille | ✅ |

---

### Portail Utilisateur (`/user/*`)

| Page | Statut |
|------|--------|
| Dashboard | ✅ |
| Réclamations (créer, voir, annuler, tracking) | ✅ |
| Organisations | ✅ |
| Messages (thread) | ✅ |
| Profil | ✅ |
| Inscription | ✅ |

---

## 11. 📂 Upload de Fichiers

| Type | Dossier | Taille max | Formats |
|------|---------|-----------|---------|
| Avatar | `uploads/avatars/` | 5 MB | Images uniquement |
| Preuve image | `uploads/proofs/images/` | 50 MB | Images |
| Preuve vidéo | `uploads/proofs/videos/` | 50 MB | Vidéos |

> ⚠️ Le backend sert `uploads/` en statique. Pour la production, prévoir un CDN ou stockage objet (S3, etc.)

---

## 12. 📧 Format des Réponses API

### Succès
```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Message lisible"
  }
}
```

### Headers requis (frontend → backend)
```
Content-Type: application/json
Authorization: Bearer <token>
```

---

## 13. 🚀 Lancer le Projet en Local

### Backend
```bash
cd backend
npm install
# Configurer .env (DB, SMTP, JWT_SECRET, etc.)
npm run db:migrate   # Créer le schéma PostgreSQL
npm run db:seed      # Injecter les données de demo
npm run dev          # Démarrer sur http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Optionnel : créer .env avec REACT_APP_API_URL=http://localhost:5000/api
npm start            # Démarrer sur http://localhost:3000
```

---

## 14. ⚠️ Points d'Attention & Risques Connus

| Risque | Description | Action recommandée |
|--------|-------------|-------------------|
| **Stats publiques** | `/dashboard/stats`, `/reclamations/stats`, `/payments/stats`, `/proofs/stats` sont non protégées | Ajouter `protect` middleware |
| **Stockage local** | Fichiers dans `uploads/` sur le disque du serveur | Migrer vers S3 ou équivalent en prod |
| **Double config email** | `config/email.js` ET `services/emailService.js` | Consolider en un seul layer |
| **models/index.js` trompeur** | Ressemble à des associations ORM mais le code est en raw SQL | Ne pas modifier sans comprendre |
| **Pas de refresh token** | JWT expire après 7j sans mécanisme de renouvellement | Implémenter refresh token |
| **Pas de déconnexion auto** | Pas d'expiration session côté frontend | Ajouter timeout d'inactivité |
| **Pages Coming Soon** | Admin : employers, tasks, payments, proofs, messages | À implémenter |
| **Logs simples** | Pas de stack observabilité centralisée | Ajouter un outil type Sentry ou Datadog |

---

## 15. ✅ État de Complétion du Projet

### Backend — Complet ✅
Tous les controllers, modèles, routes et services sont implémentés pour les 4 acteurs.

### Frontend

| Portail | Complétion |
|---------|-----------|
| Admin | ~70% (CRUD org/responsable/admin/réclamations OK — le reste Coming Soon) |
| Responsable | ~100% ✅ |
| Employeur | ~100% ✅ |
| Utilisateur | ~100% ✅ |

---

## 16. 📋 Checklist Onboarding Nouveau Développeur

- [ ] Cloner les 2 repos (backend + frontend)
- [ ] Configurer `.env` backend (PostgreSQL, SMTP, JWT_SECRET)
- [ ] Lancer `npm run db:migrate` + `npm run db:seed`
- [ ] Tester login admin : `admin@rms.com` / `Admin@123`
- [ ] Tester le flux complet : création réclamation → tâche → preuve → paiement
- [ ] Sécuriser les endpoints de stats publics
- [ ] Planifier la migration du stockage de fichiers
- [ ] Implémenter les pages Coming Soon du portail Admin
- [ ] Ajouter refresh token + expiration session

---

*Document généré automatiquement — Mai 2026*
