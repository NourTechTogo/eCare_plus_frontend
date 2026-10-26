# Contrat API attendu par le frontend web

Ce document liste les routes dont le portail web eCare+ a besoin côté backend. Aujourd'hui, le portail fonctionne sans backend (`VITE_DATA_SOURCE=demo`) : chaque service de `src/features/*/services/` lit et écrit dans une base locale (`src/demo/`). Pour brancher une fonctionnalité sur l'API, on réécrit les fonctions de son service avec `apiRequest`, derrière `if (usesLocalData)`. Les composants ne changent pas.

## Conventions

- Base : `/api/v1`, en JSON. Les dates sont au format ISO-8601, et les dates sans heure au format `AAAA-MM-JJ`.
- Authentification : `Authorization: Bearer <jwt>` sur toutes les routes sauf `/auth/*`.
- Nommage : les champs JSON sont en camelCase français, comme le backend actuel (`nom`, `prenoms`, `dateNaissance`…). Les types du frontend sont en anglais (`lastName`, `firstName`, `birthDate`…), et la correspondance se fait dans le service. **Les contenus de référence sont les types TypeScript cités dans chaque section.** À confirmer avec l'équipe mobile.
- Erreurs : `{ "code": "...", "message": "..." }`. Les codes utiles à l'interface sont indiqués route par route.
- Listes : tableaux simples pour commencer. La pagination pourra venir ensuite (`?page=&taille=`).
- Rôles : `ADMINISTRATEUR_STRUCTURE` (« Administrateur » sur le web), `PERSONNEL_ETABLISSEMENT` (« Personnel de l'établissement », **rôle à créer côté backend**) et `MEDECIN`. Le backend applique les règles d'accès ci-dessous. L'interface se contente de masquer ce qui n'est pas permis.

| Rôle | Ce qu'il peut faire |
| --- | --- |
| Administrateur | Crée, désactive et réactive les comptes des médecins et du personnel. N'ouvre pas les dossiers patients. |
| Personnel | Voit tous les patients de l'établissement, crée et modifie les dossiers, référence les patients inscrits par code QR, affecte le médecin référent. Lit la liste des médecins pour cette affectation. N'a accès à aucune donnée clinique (mesures, alertes, notes). |
| Médecin | Ne voit que les patients **actifs** dont il est le médecin référent. Toutes ses actions cliniques sont limitées à ces patients. |

## 1. Authentification et profil (`features/auth/types/auth.ts`)

Ces routes sont déjà branchées sur le backend en mode `api`.

| Méthode | Route | Corps | Réponse |
| --- | --- | --- | --- |
| POST | `/auth/connexion` | `{ identifiant, motDePasse }` | `{ token, expiresAt, utilisateur }`. `401` si les identifiants sont faux, `403 COMPTE_DESACTIVE` si le compte est désactivé. |
| POST | `/auth/mot-de-passe/otp` | `{ email }` | `202` dans tous les cas : la réponse ne révèle pas si le compte existe. |
| POST | `/auth/mot-de-passe/otp/verifier` | `{ email, code }` | `{ resetToken }`. `400 CODE_INVALIDE` si le code est faux. |
| POST | `/auth/mot-de-passe/reinitialiser` | `{ resetToken, nouveauMotDePasse }` | `204` |
| PATCH | `/moi` | `{ prenoms, nom, telephone }` | Utilisateur mis à jour |
| GET / PUT | `/moi/preferences-notifications` | `NotificationPreferences` (`features/profile/types/preferences.ts`) | Même objet |

## 2. Patients (`features/patients/types/patient.ts`)

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/patients` | Les deux, filtré selon le rôle | `Patient[]` |
| GET | `/patients/{id}` | Les deux | `Patient`. `404` si le patient n'est pas visible. |
| POST | `/patients` | Personnel | `PatientInput` → `Patient`, avec `status: en_attente_activation` et un `activationCode` généré. `409 PATIENT_EXISTANT` si un dossier a déjà les mêmes nom, prénoms, date de naissance et téléphone. |
| PUT | `/patients/{id}` | Personnel | `PatientInput` → `Patient` |
| GET | `/inscriptions/{code}` | Personnel | `PendingRegistration`, c'est-à-dire un compte créé dans l'application et présenté par code QR. `404` ou `410` si le code est inconnu ou expiré. |
| POST | `/inscriptions/{code}/referencer` | Personnel | Le reste de `PatientInput` (pathologie, médecin référent…) → `Patient` actif, avec `origin: auto_inscription` |

Un seul appel suffit pour créer le dossier et affecter le médecin (`referentDoctorId`). Aujourd'hui, le backend enchaîne la création du dossier puis l'affectation. Le frontend n'a pas besoin de connaître ce détail.

## 3. Comptes (`features/staff/types/doctor.ts`, `features/staff/types/staffMember.ts`)

L'administrateur choisit le mot de passe de connexion à la création du compte (8 caractères au minimum, au moins une lettre et un chiffre). L'utilisateur peut ensuite le changer depuis son profil.

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/medecins` | Administrateur, personnel | `Doctor[]`, avec `patientCount` |
| POST | `/medecins` | Administrateur | `DoctorInput` et `motDePasse` → `Doctor`. `409 EMAIL_EXISTANT` si l'adresse est déjà utilisée. |
| PUT | `/medecins/{id}` | Administrateur | `DoctorInput` → `Doctor`. `409 EMAIL_EXISTANT` |
| PATCH | `/medecins/{id}/statut` | Administrateur | `{ statut: 'actif' \| 'desactive' }` → `Doctor` |
| GET | `/personnel` | Administrateur | `StaffMember[]` |
| POST | `/personnel` | Administrateur | `StaffMemberInput` et `motDePasse` → `StaffMember`. `409 EMAIL_EXISTANT` |
| PUT | `/personnel/{id}` | Administrateur | `StaffMemberInput` → `StaffMember`. `409 EMAIL_EXISTANT` |
| PATCH | `/personnel/{id}/statut` | Administrateur | `{ statut: 'actif' \| 'desactive' }` → `StaffMember` |

Le rôle `PERSONNEL_ETABLISSEMENT` n'existe pas encore dans le backend. Il faut l'ajouter au jeton (claim `role`) et à `AutorisationRessources`, en lui donnant les droits de création des patients, des dossiers et des affectations que possède aujourd'hui `ADMINISTRATEUR_STRUCTURE`.

## 4. Mesures et seuils (`features/measurements/types/measurement.ts`)

Le frontend gère les quatre types du backend (`TypeMesure`) :

| Frontend (`kind`) | Backend (`typeMesure`) | Valeurs |
| --- | --- | --- |
| `tension` | `TENSION_ARTERIELLE` | `valeurPrincipale` = systolique, `valeurSecondaire` = diastolique (mmHg) |
| `glycemie` | `GLYCEMIE` | g/L. `contexteMesure` vaut `a_jeun` ou `post_prandiale`, et chaque contexte a son propre seuil. |
| `poids` | `POIDS` | kg, sans seuil d'alerte |
| `frequence_cardiaque` | `FREQUENCE_CARDIAQUE` | bpm |

Le champ `source` du frontend vaut `manuelle` (saisie par le patient) ou `montre` (montre connectée). Il correspond aux valeurs `PATIENT` et `APPAREIL_CONNECTE` de `SourceMesure`.

| Méthode | Route | Rôle | Réponse |
| --- | --- | --- | --- |
| GET | `/patients/{id}/mesures?depuis=` | Médecin | `Measurement[]`, la plus récente en premier |
| GET | `/mesures/dernieres` | Médecin | `{ [patientId]: Measurement }` : la dernière mesure de chaque patient, pour la liste et le tableau de bord |
| GET | `/patients/{id}/seuils` | Médecin | Seuils en vigueur : valeurs par défaut du CDC (§2.3.10) et personnalisations du patient |
| PUT | `/patients/{id}/seuils/{metrique}` | Médecin | `ThresholdRule` → seuils |
| DELETE | `/patients/{id}/seuils/{metrique}` | Médecin | Rétablit la valeur par défaut → seuils |

## 5. Alertes (`features/alerts/types/alert.ts`)

C'est **le backend** qui génère les alertes, à la réception d'une mesure hors seuils. La gravité vaut `attention` hors de la plage normale, et `critique` hors de la plage dangereuse.

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/alertes` | Médecin | `Alert[]` de ses patients, triées par gravité puis par date |
| GET | `/alertes/{id}` | Médecin | `Alert` |
| POST | `/alertes/{id}/vue` | Médecin | → `Alert`, qui passe de `nouvelle` à `vue`. Idempotent. |
| POST | `/alertes/{id}/traiter` | Médecin | `{ commentaire }` (obligatoire) → `Alert` au statut `traitee`, avec `handledAt` et `handledBy` |

## 6. Traitements (`features/treatments/types/treatment.ts`)

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/patients/{id}/traitements` | Médecin | `Treatment[]` |
| POST | `/patients/{id}/traitements` | Médecin | `TreatmentInput` → `Treatment` |
| PUT | `/traitements/{id}` | Médecin | `TreatmentInput` → `Treatment` |
| POST | `/traitements/{id}/arreter` | Médecin | → `Treatment` au statut `termine` |
| GET | `/patients/{id}/prises?depuis=` | Médecin | `Intake[]`, les prises confirmées par le patient dans l'application |

## 7. Documents (`features/documents/types/document.ts`)

| Méthode | Route | Rôle | Réponse |
| --- | --- | --- | --- |
| GET | `/patients/{id}/documents` | Médecin | `PatientDocument[]`. Le navigateur doit pouvoir lire `url` (URL signée ou route authentifiée). |

Le patient ajoute ses documents dans l'application mobile. Le portail web ne fait que les consulter.

## 8. Notes (`features/notes/types/note.ts`)

Une note `privee` n'est visible que de son auteur. Une note `partagee` est visible du patient et de l'équipe soignante.

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/patients/{id}/notes` | Médecin | `ClinicalNote[]`, sans les notes privées des autres auteurs |
| POST | `/patients/{id}/notes` | Médecin | `{ texte, visibilite }` → `ClinicalNote` |
| PUT | `/notes/{id}` | Auteur de la note | `{ texte, visibilite }` → `ClinicalNote` |
| DELETE | `/notes/{id}` | Auteur de la note | `204` |

## 9. Messagerie et appels (`features/messaging/types/`)

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/conversations` | Médecin | `Conversation[]`, avec `lastMessage` et `unreadCount` |
| POST | `/patients/{id}/conversation` | Médecin | → `Conversation`. Crée la conversation si besoin. Idempotent. |
| GET | `/conversations/{id}/messages` | Médecin | `Message[]`, du plus ancien au plus récent, avec `readAt` pour l'accusé de lecture |
| POST | `/conversations/{id}/messages` | Médecin | `{ texte }` → `Message` |
| POST | `/conversations/{id}/messages` (multipart) | Médecin | Photo ou document : `fichier` et `texte` facultatif. Message vocal : `audio`, `dureeSecondes` et `formeOnde` facultatif. → `Message` |
| POST | `/conversations/{id}/lue` | Médecin | `204` : marque les messages du patient comme lus |
| GET | `/conversations/{id}/appels` | Médecin | `CallRecord[]` |
| POST | `/conversations/{id}/appels` | Médecin | `{ type: 'audio' \| 'video' }` → `CallSession`, qui désigne la salle WebRTC |
| POST | `/appels/{id}/terminer` | Médecin | `{ dureeSecondes }` (facultatif) → `CallRecord` |

Le frontend attend une réception en temps réel (nouveaux messages, appel entrant) par WebSocket ou SSE. Le mécanisme reste à définir avec l'équipe mobile.

## 10. Rendez-vous (`features/appointments/types/appointment.ts`)

Décision d'équipe : le médecin publie ses disponibilités, le patient réserve un créneau libre dans l'application mobile, puis le médecin confirme ou refuse la demande.

Cycle d'un rendez-vous : `demande` (réservé par le patient) → `confirme` ou `refuse` (par le médecin) → `realise`. Un rendez-vous confirmé peut être `annule` par le médecin ou par le patient. Un rendez-vous demandé ou confirmé occupe son créneau ; refusé ou annulé, il le libère.

Une disponibilité est une plage (`startsAt` → `endsAt`) découpée en créneaux de `slotMinutes` minutes. Un créneau commence à `startsAt` plus un nombre entier de créneaux.

**Côté médecin (portail web)**

| Méthode | Route | Corps → réponse |
| --- | --- | --- |
| GET | `/disponibilites` | `Availability[]` du médecin connecté, pas encore terminées |
| POST | `/disponibilites` | `AvailabilityInput` et `repetitionSemaines` (1 à 8, même jour et mêmes heures chaque semaine) → `Availability[]`. `409 CHEVAUCHEMENT` si une plage chevauche une plage existante (rien n'est créé), `400 DATE_PASSEE`, `400 PLAGE_TROP_COURTE` |
| DELETE | `/disponibilites/{id}` | `204`. `409 CRENEAUX_RESERVES` si un créneau est demandé ou confirmé |
| GET | `/rendez-vous` | `Appointment[]` des patients du médecin |
| POST | `/rendez-vous/{id}/confirmer` | → `Appointment` (`demande` → `confirme`). `409 ETAT_INVALIDE` si la demande a changé entre-temps |
| POST | `/rendez-vous/{id}/refuser` | `{ motif }` → `Appointment` (`refuse`) |
| POST | `/rendez-vous/{id}/annuler` | `{ motif }` → `Appointment` (`annule`, `cancelledBy: medecin`) |
| POST | `/rendez-vous/{id}/realise` | → `Appointment` (`realise`), pour un rendez-vous confirmé déjà commencé |

**Côté patient (application mobile)**

| Méthode | Route | Corps → réponse |
| --- | --- | --- |
| GET | `/moi/medecin-referent/creneaux-libres?du=&au=` | `[{ disponibiliteId, debut, dureeMinutes }]` : créneaux libres et à venir de son médecin référent |
| POST | `/rendez-vous` | `{ disponibiliteId, debut, motif }` → `Appointment` au statut `demande`. `409 CRENEAU_PRIS` si le créneau vient d'être réservé |
| GET | `/moi/rendez-vous` | `Appointment[]` du patient, avec `refusalReason` et `cancellationReason` |
| POST | `/rendez-vous/{id}/annuler` | `{ motif }` → `Appointment` (`annule`, `cancelledBy: patient`) |

Le patient est notifié quand sa demande est confirmée, refusée ou annulée ; le médecin, quand il reçoit une demande.

## 11. Articles (`features/articles/types/article.ts`)

Un article est publié dès son envoi : il n'y a pas de brouillon.

| Méthode | Route | Rôle | Corps → réponse |
| --- | --- | --- | --- |
| GET | `/articles` | Médecin | `Article[]` : tous les articles de la plateforme, du plus récent au plus ancien |
| GET | `/articles/{id}` | Médecin | `Article` |
| POST | `/articles` | Médecin | `ArticleInput` → `Article`, publié tout de suite (`publishedAt` = date d'envoi) |
| PUT | `/articles/{id}` | Auteur de l'article | `ArticleInput` → `Article` |
| DELETE | `/articles/{id}` | Auteur de l'article | `204` : l'article disparaît aussi de l'application mobile |

L'application mobile lit les articles avec la même route `GET /articles`.
