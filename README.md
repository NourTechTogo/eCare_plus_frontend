# eCare+ — Frontend Web

Messages vocaux privés disponibles : enregistrement, brouillon, envoi explicite et lecture avec progression, via le backend commun. Voir [les ajouts récents](AJOUTS_RECENTS.md) et [la validation du 26 octobre 2026](docs/VALIDATION.md).

## Livraison indépendante du 25 octobre 2026

Branche `ecare_frontend_stable`, reliée uniquement à son dépôt GitHub. Les [ajouts détaillés](AJOUTS_RECENTS.md), [contrats API](docs/backend/API.md) et [validation / limites](docs/VALIDATION.md) sont disponibles dans ce dépôt.

### Lancer le portail professionnel

Prérequis : Node compatible avec Vite 8 et npm. Exécuter `npm ci`, copier `.env.example` en `.env`, régler `VITE_DEV_PROXY_TARGET=http://127.0.0.1:8081`, puis `npm run dev -- --host 127.0.0.1 --port 5183`. `VITE_API_URL=/api/v1` utilise le proxy local. En production, définir l'URL publique avant le build.

Validation : `npm test`, `npm run lint`, `npm run build`. Aucun secret serveur dans une variable `VITE_*`.


> Intégration au backend commun du 25 octobre 2026 : [bilan et preuves](docs/integration-clients/BILAN.md), [configuration des services](docs/integration-clients/CONFIGURATION.md), [contrats réels](docs/backend/API.md). La prévisualisation intégrée utilise le port 5183 et le backend 8081. Les descriptions historiques ci-dessous ne valent pas preuve de disponibilité des services externes.

Frontend web de **eCare+**, une solution e-santé destinée au suivi des patients atteints de maladies chroniques, notamment le diabète et/ou l'hypertension.

## 🎯 Objectif

eCare+ vise à améliorer le suivi des patients atteints de maladies chroniques en facilitant la centralisation et la consultation des informations de suivi par les professionnels de santé.

Le frontend web est principalement destiné aux **professionnels de santé**, notamment aux médecins.

## 🏗️ Architecture

Le projet utilise une architecture **Feature-Based / Modular**.

```text
src/
├── app/            # Configuration globale de l'application
│   ├── providers/  # Providers globaux
│   ├── routes/     # Configuration des routes
│   └── App.tsx
│
├── assets/         # Ressources statiques
├── components/     # Composants réutilisables
│   ├── ui/         # Composants UI génériques
│   └── layouts/    # Composants de mise en page
│
├── config/         # Configuration de l'application
├── features/       # Fonctionnalités métier
├── hooks/          # Hooks React réutilisables
├── lib/            # Bibliothèques et intégrations
├── stores/         # Gestion de l'état global
├── styles/         # Styles globaux
├── types/          # Types TypeScript partagés
└── utils/          # Fonctions utilitaires
```

Les fonctionnalités métier seront organisées dans `src/features/`.

Exemple :

```text
src/features/
└── patients/
    ├── components/
    ├── pages/
    ├── services/
    ├── hooks/
    ├── types/
    └── index.ts
```

## 🛠️ Technologies

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Oxlint

D'autres dépendances pourront être ajoutées au fur et à mesure des besoins du projet.

## 🚀 Installation

Cloner le repository puis installer les dépendances :

```bash
npm install
```

## 💻 Développement

Lancer le serveur de développement :

```bash
npm run dev
```

## 🏗️ Build

Créer le build de production :

```bash
npm run build
```

## 🔍 Lint

Vérifier le code avec Oxlint :

```bash
npm run lint
```

## 📌 État du projet

Fonctionnalités en place :

- connexion et déconnexion, avec des écrans adaptés au rôle ;
- gestionnaire : liste des patients avec recherche et filtre, création, consultation et modification d'un dossier ;
- médecin : tableau de bord, file des alertes et traitement d'une alerte, liste des patients avec dernière mesure et alertes, dossier avec suivi des mesures (dernières valeurs et historique) et observations cliniques.

Toutes les données sont **fictives** : l'authentification, les patients, les mesures et les alertes sont simulés dans les fichiers `services/` de chaque feature, en attendant l'API du backend.

Comptes de démonstration (toute structure, mot de passe `12345678`) :

| Rôle         | Identifiant |
| ------------ | ----------- |
| Gestionnaire | `abi2026`   |
| Médecin      | `dr2026`    |
