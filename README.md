# SenSanté - Système de Gestion des Dossiers Médicaux

## Description
SenSanté est un logiciel sécurisé de gestion des dossiers médicaux développé dans le cadre du projet DevSecOps. Il permet aux médecins d'une organisation de soins de santé multi-sites de créer, consulter et mettre à jour les dossiers médicaux de leurs patients.

## Fonctionnalités de Sécurité

### Sprint Alpha - Audit
- ✅ Journal d'audit complet de toutes les actions
- ✅ Traçabilité des connexions et consultations
- ✅ Horodatage précis des événements
- ✅ Détails des actions en format JSON

### Sprint Beta - Authentification et Autorisation
- ✅ Authentification par email/mot de passe
- ✅ Mots de passe hashés avec bcrypt
- ✅ Tokens JWT pour les sessions
- ✅ Contrôle d'accès basé sur les sites médicaux
- ✅ Autorisation par rôle (médecin/site)

## Technologies Utilisées
- **Backend**: Node.js avec Express.js
- **Base de données**: MySQL
- **Sécurité**: bcrypt, JWT
- **Frontend**: HTML5, CSS3, JavaScript vanilla

## Installation et Configuration

### Prérequis
- Node.js (version 14 ou supérieure)
- MySQL Server
- npm ou yarn

### Étapes d'installation

1. **Installer les dépendances**
\`\`\`bash
npm install
\`\`\`

2. **Configurer MySQL**
- Créer la base de données en exécutant le script SQL :
\`\`\`bash
mysql -u root -ppasser < scripts/creation-base-donnees.sql
\`\`\`

3. **Initialiser les données de test**
\`\`\`bash
node scripts/initialiser-donnees.js
\`\`\`

4. **Démarrer le serveur**
\`\`\`bash
npm start
\`\`\`

5. **Accéder à l'application**
Ouvrir http://localhost:3000 dans votre navigateur

## Comptes de Test

| Email | Mot de passe | Spécialité | Site |
|-------|--------------|------------|------|
| amadou.diop@sensante.sn | motdepasse123 | Cardiologie | Hôpital Principal Dakar |
| fatou.ndiaye@sensante.sn | motdepasse123 | Pédiatrie | Hôpital Principal Dakar |
| moussa.fall@sensante.sn | motdepasse123 | Médecine Générale | Clinique de Thiès |
| aissatou.sarr@sensante.sn | motdepasse123 | Gynécologie | Centre Médical Kaolack |
| admin@sensante.sn | admin123 | - | - |

## Fonctionnalités Principales

### Gestion des Patients
- Création de nouveaux dossiers patients
- Consultation des informations patients
- Restriction d'accès par site médical

### Gestion des Consultations
- Enregistrement de nouvelles consultations
- Historique des consultations par patient
- Diagnostic et notes médicales

### Système d'Audit
- Journal complet des actions utilisateurs
- Traçabilité des accès aux données
- Horodatage précis des événements

## Sécurité Implémentée

### Authentification
- Mots de passe hashés avec bcrypt (salt rounds: 10)
- Sessions sécurisées avec JWT
- Expiration automatique des tokens (8h)

### Autorisation
- Contrôle d'accès basé sur les sites médicaux
- Vérification des permissions pour chaque action
- Isolation des données par site

### Audit et Traçabilité
- Enregistrement de toutes les actions sensibles
- Détails des actions en format JSON
- Horodatage précis avec timezone

### Confidentialité et Intégrité
- Validation des entrées utilisateur
- Protection contre l'injection SQL
- Communications sécurisées (recommandé HTTPS en production)

## Structure du Projet

\`\`\`
sensante-medical/
├── serveur.js              # Serveur Express principal
├── package.json            # Dépendances Node.js
├── README.md              # Documentation
├── scripts/
│   ├── creation-base-donnees.sql
│   ├── donnees-test.sql
│   └── initialiser-donnees.js
└── public/
    ├── index.html         # Interface utilisateur
    ├── styles.css         # Styles CSS
    └── app.js            # JavaScript frontend
\`\`\`

## API Endpoints

### Authentification
- `POST /api/connexion` - Connexion utilisateur

### Patients
- `GET /api/patients` - Liste des patients du site
- `POST /api/patients` - Créer un nouveau patient
- `GET /api/patients/:id` - Détails d'un patient

### Consultations
- `POST /api/consultations` - Créer une consultation
- `GET /api/patients/:id/consultations` - Historique des consultations

### Audit
- `GET /api/audit` - Journal d'audit

## Conformité aux Exigences

### Éléments de Sécurité Requis
- ✅ **Authentification**: Email/mot de passe avec hachage bcrypt
- ✅ **Autorisation**: Contrôle d'accès par site médical (DAC)
- ✅ **Audit**: Journal complet des actions utilisateurs
- ✅ **Confidentialité**: Restriction d'accès aux données sensibles
- ✅ **Intégrité**: Validation des données et protection contre les modifications non autorisées

### User Stories Implémentées
- ✅ RF1: Création de dossiers patients
- ✅ RF2: Enregistrement de consultations
- ✅ RF4: Consultation de l'historique patient
- ✅ RF5: Authentification sécurisée
- ✅ RF6: Contrôle d'accès par site
- ✅ RF7: Journal d'audit

## Développement et Tests

### Démarrage en mode développement
\`\`\`bash
npm run dev
\`\`\`

### Tests de Sécurité
- Vérification des mots de passe hashés
- Test des restrictions d'accès par site
- Validation de l'audit des actions

## Auteur
**Khadidiatou GUEYE**  
École Supérieure Polytechnique - Université Cheikh Anta Diop  
Projet DevSecOps 2024-2025
