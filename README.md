# eCare+ — Frontend Web

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

Le portail web couvre le périmètre MVP du cahier des charges, ainsi que les rendez-vous et la publication d'articles.

- **Administrateur** (`ADMINISTRATEUR_STRUCTURE` côté backend) : création, désactivation et réactivation des comptes des médecins et du personnel.
- **Personnel de l'établissement** (rôle `PERSONNEL_ETABLISSEMENT`, à créer côté backend) :
  - liste des patients avec leur médecin référent et l'état de leur compte mobile ;
  - création d'un dossier, avec affectation du médecin référent et remise d'un code d'activation ;
  - référencement par code QR d'un patient inscrit dans l'application ;
  - modification d'un dossier.
- **Médecin** :
  - tableau de bord ;
  - file des alertes, traitement d'une alerte avec commentaire ;
  - dossier patient en onglets : résumé, mesures, traitements, documents, notes, seuils, rendez-vous, informations ;
  - messagerie : texte, photos, documents, messages vocaux, appels audio et vidéo, accusés de lecture ;
  - rendez-vous : publication de ses disponibilités, confirmation ou refus des créneaux réservés par les patients, agenda ;
  - rédaction et publication d'articles.
- **Tous les profils** : connexion, mot de passe oublié avec un code à 4 chiffres, profil. Le médecin règle aussi ses préférences de notification.

### Données locales (sans backend)

La variable `VITE_DATA_SOURCE` est obligatoire (voir `.env.example`) :

- `demo` : les services lisent et écrivent dans une base locale persistante (`src/demo/`, enregistrée dans le `localStorage` du navigateur). Les dates des données de départ suivent le jour courant ;
- `api` : l'authentification passe par le backend ; les autres services seront branchés au fur et à mesure.

Les routes attendues du backend sont décrites dans [`docs/CONTRAT_API.md`](docs/CONTRAT_API.md).

Comptes disponibles en mode `demo` :

| Profil                         | E-mail                     | Mot de passe  |
| ------------------------------ | -------------------------- | ------------- |
| Administrateur                 | `admin@ecareplus.test`     | `Admin2026`   |
| Personnel de l'établissement   | `accueil@ecareplus.test`   | `Accueil2026` |
| Personnel de l'établissement   | `m.adzo@ecareplus.test`    | `Accueil2026` |
| Médecin (Dr Kofi Agbeko)       | `k.agbeko@ecareplus.test`  | `Medecin2026` |
| Médecin (Dr Akossiwa Lawson)   | `a.lawson@ecareplus.test`  | `Medecin2026` |
| Médecin (Dr Yao Amouzou)       | `y.amouzou@ecareplus.test` | `Medecin2026` |
| Médecin désactivé              | `e.mensah@ecareplus.test`  | connexion refusée |

En mode `demo`, n'importe quel code à 4 chiffres est accepté pour réinitialiser ou changer le mot de passe (provisoire, en attendant l'envoi réel par e-mail). Pour repartir des données de départ, supprimez la clé `ecare.plateforme` du `localStorage`.
