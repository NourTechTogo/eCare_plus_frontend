# API backend eCare+ — registre de réalisation

Référence prioritaire : cahier des charges (`audit/reference-1.txt`). Contrat antérieur : `docs/implementation/CONTRACT.md`. Les ajouts sont documentés ici à mesure de leur vérification ; le plan n'est pas une preuve de disponibilité.

## Conventions

Base `/api/v1`, JWT Bearer ; UUID serveur, JSON français camelCase, dates ISO8601 UTC et dates civiles YYYY-MM-DD. Collections `content,totalElements,totalPages,number,size`. Erreurs ProblemDetail avec `status,title,detail,erreurs` ; 401 session invalide, 403 droits insuffisants, 404 ressource absente, 409 conflit de version/état/idempotence, 413 fichier excessif. Les identifiants d'auteur et de patient des routes `/me` proviennent exclusivement de la session.

## Matrice des droits

| Ressource | Patient titulaire | Professionnel affecté actif | Autre professionnel/structure | Administrateur |
|---|---|---|---|---|
| Profil administratif | Lecture/modification autorisée | Selon affectation | Refus | Dans sa structure |
| Données cliniques/documents | Consentement et rattachement requis | Consentement + rattachement + structure active | Refus | Refus par le seul rôle |
| Prescription du médecin | Lecture | Écriture selon habilitation métier | Refus | Refus |
| Réponse à une prise | Écriture de sa réponse | Lecture de l'historique | Refus | Refus |
| Message et pièce jointe | Participant encore habilité | Participant encore habilité | Refus | Pas de support implicite |
| Note privée | Son auteur uniquement | Son auteur uniquement | Refus | Refus |
| Préférences de notification | Son compte | Son compte | Son compte uniquement | Son compte uniquement |

L'accès support exceptionnel mentionné au CDC n'est pas une habilitation générale d'administrateur : il reste non activé sans parcours dédié, justification et audit.

## Inventaire initial

Déjà exposés et couverts par la première passe : authentification/OTP/réinitialisation, compte/mot de passe/déconnexion, admission/affectation, profil/consentement, mesures/historique, alertes/clôture, observations, conversation texte/lecture, boîte de notifications interne et rappels. Routes principales dans CONTRACT.md.

Partiels à compléter : traitements/médicaments/prises et confirmations (API professionnelles et entités existantes), règles d'alerte personnalisées, consentements et partage, journalisation, synchronisation qui stocke actuellement un contenu sans l'appliquer au métier.

Absents au démarrage de ce plan : documents distants privés, planning patient versionné, réponses patient idempotentes et observance par occurrence, terminaux push/outbox/fournisseurs, référencement QR, pièces jointes distantes, sessions d'appel et notes ciblées.

Le catalogue détaillé des anciennes routes reste disponible via OpenAPI ; chaque nouveau contrôleur conserve les routes déjà utilisées. Une route existante ne dispense pas de vérifier les autorisations de sa façade et de son service.

## Contrats ajoutés par le plan backend

Toutes les routes ci-dessous sont relatives à `/api/v1`. Les endpoints `/compte` concernent le compte authentifié, patient ou professionnel. Une référence de navigation n'autorise pas à lire sa cible : les droits sont vérifiés à nouveau à l'ouverture.

| Domaine | Méthode et route | Entrée / résultat |
|---|---|---|
| Documents patient | POST multipart `/mobile/me/documents` | `fichier,typeDocument,titre,dateDocument,sourceRef` → DocumentVue, 201 |
| Numérisation assistée | POST multipart `/portail/patients/{patientId}/documents` | Même contrat, professionnel affecté avec droits cliniques |
| Documents | GET `/mobile/me/documents` ou `/portail/patients/{patientId}/documents` | Page<DocumentVue> |
| Binaire document | GET route précédente + `/{id}/contenu` | Lecture privée authentifiée, sans cache public |
| Retrait document | DELETE `/mobile/me/documents/{id}` | 204, retrait logique immédiat, nettoyage physique repris |
| Planning | GET `/mobile/me/planning-traitements?du=&au=` ou équivalent `/portail/patients/{patientId}/planning-traitements` | PlanningVue, période inclusive de 1 à 90 jours |
| Configuration précise | PUT `/portail/prises/{priseId}/planning` | `version,fuseau,joursSemaine:[1..7]` → PrisePlanningVue ; médecin du dossier |
| Prescription atomique | POST `/portail/patients/{patientId}/prescriptions` | `sourceRef,traitement,medicament,prise` avec fuseau/jours explicites → identifiants et version ; médecin affecté, transaction unique |
| Historique prises | GET `/mobile/me/prises?du=&au=` ou `/portail/patients/{patientId}/prises` | Occurrences de la période |
| Réponse à une prise | POST `/mobile/me/prises/{id}/reponse` | `action,dateAction,reporteeAu?,sourceRef,version` → OccurrenceVue |
| Observance | GET `/mobile/me/observance?du=&au=` ou équivalent portail | `prisesPrevues,prisesConfirmees,prisesIgnorees,prisesNonConfirmees,taux` |
| Préférences | GET/PATCH `/compte/preferences-notifications` | PATCH `pushActif?,whatsappActif?,versionConsentement?` |
| Terminaux | GET `/compte/terminaux`, PUT/DELETE `/compte/terminaux/{installationId}` | PUT `plateforme:ANDROID|IOS|WEB,jetonPush` ; jeton jamais renvoyé |
| Boîte commune | GET `/compte/notifications`, POST `/compte/notifications/{id}/lecture` | Page des seules notifications du compte ; lecture idempotente |
| Synchronisation | POST `/mobile/me/synchronisations` | Lot typé, résultat par élément, 1 à 100 éléments |
| QR personnel | POST `/mobile/me/referencements` | `{jeton,expireLe}` ; nouveau jeton révoque le précédent |
| Résolution QR | POST `/portail/referencements/resolution` | `{jeton}` → identité administrative minimale, dossierId/versionDossier |
| Référencement | POST `/portail/referencements` | `{jeton,professionnelId,versionDossier}` → PatientVue ; version null s'il n'existe pas encore de dossier |
| Pièces jointes | POST multipart et GET `/mobile/conversations/{conversationId}/pieces-jointes` | Dépôt `fichier,sourceRef`, liste paginée des pièces visibles |
| Binaire de pièce | GET route précédente + `/{id}/contenu` | Brouillon réservé à son auteur ; après rattachement, participants habilités |
| Messages enrichis | POST `/mobile/conversations/{id}/messages` | `contenu?,piecesJointes?:[UUID]`, au plus cinq pièces ; conserve le contrat texte |
| Notes | POST/GET `/notes`, PATCH/DELETE `/notes/{id}` | Cible MESSAGE/APPEL/MESURE/ALERTE, contenu, visibilité PRIVEE/PARTAGEE ; seul auteur modifie/supprime |
| Appels | POST/GET `/mobile/conversations/{id}/appels` | Création `type:AUDIO|VIDEO,sourceRef`, historique paginé |
| Transitions appel | POST `/appels/{id}/acceptation`, `/refus`, `/fin` | Acceptation/refus par destinataire ; états contrôlés et historisés |
| Connexion appel | GET `/appels/{id}/connexion` | `{url,jeton,expireLe}` après acceptation, participants habilités seulement |
| Télésuivi | GET `/portail/patients/{patientId}/resume` | Profil, mesures récentes, alertes ouvertes, planning, observance et références des conversations |
| Effacement | POST `/compte/demandes-effacement`, GET `/compte/demandes-effacement/{id}` | Demande suivie, 202 ; aucune destruction immédiate annoncée |

### Documents et pièces

DocumentVue : `id,patientId,typeDocument,titre,dateDocument,nomOriginal,typeMime,tailleOctets,dateCreation,auteurId`. Types : ORDONNANCE, RESULTAT_ANALYSE, COMPTE_RENDU, CARNET, AUTRE. Formats JPEG/PNG/PDF contrôlés d'après le contenu ; plafond par défaut 5 × 1024 × 1024 octets, configurable et provisoire selon le CDC. Le nom d'origine ne détermine jamais le chemin. `sourceRef` documentaire : 128 caractères maximum, unique par patient ; un contenu différent sous la même clé donne 409.

PieceVue : `id,nomOriginal,typeMime,tailleOctets,dateCreation`. Les messages gardent `id,expediteurId,contenu,envoyeLe,luLe` et ajoutent `piecesJointes`. Les pièces ne deviennent pas automatiquement des documents du carnet. Les brouillons expirés sont nettoyés avec verrouillage pour éviter une suppression concurrente avec leur rattachement.

### Planning et réponses

PlanningVue : `version,du,au,traitements,occurrences`. Le fuseau est porté par chaque prise et occurrence, pas par un champ global qui supposerait que tous les horaires ont la même origine. `joursSemaine` suit ISO : lundi=1, dimanche=7. Les fréquences historiques libres non interprétables portent `configurationRequise=true` ; elles ne donnent pas lieu à des doses inventées.

OccurrenceVue : `id,traitementId,priseId,prevueLe,reporteeAu,quantite,unite,medicament,dosage,uniteDosage,forme,voieAdministration,statut,annulee,version,fuseau,dateActionClient,dateConfirmation`. PRIS → PRISE, IGNORER → OUBLIEE, REPORTER → REPORTEE ; ATTENTE reste distinct d'un oubli explicite. Un report conserve l'identifiant et la date initiale, et déplace seulement l'échéance concernée ; cette échéance reste visible après confirmation. L'heure d'action déclarée par le client est distincte de sa réception/confirmation serveur. Les horaires et identités temporelles de prises sont normalisés à la microseconde pour rester compatibles avec PostgreSQL. Une même réponse/sourceRef rejouée rend le résultat enregistré ; autre contenu = 409.

Les révisions effectives d'une prescription servent à générer ses occurrences historiques. Un changement ne recrée pas le passé avec les horaires actuels. Arrêt/désactivation annulent les occurrences futures en transaction ; une réactivation peut rétablir les occurrences futures compatibles, avec une nouvelle version. Les confirmations déjà traitées restent inchangées. Pour les données antérieures sans historique, seule la configuration effectivement connue est capturée, sans reconstitution d'un dosage ou d'une date inconnus.

Observance : doses confirmées prises / doses échues prévues non annulées. Le taux est exprimé sur 100 et vaut null si le dénominateur est nul. Les réponses tardives restent tracées ; aucune prescription n'est modifiée automatiquement à partir de l'observance. Les rappels hors ligne et l'acquisition montre sont des étapes client ultérieures.

### Synchronisation et QR

Complément de l'intégration client (migration V28) : la création de prescription regroupe traitement, médicament, prise et configuration dans une seule transaction. `traitement` reprend les champs de création existants ; `medicament` reprend `nomCommercial,denomination,forme,dosage,uniteDosage` ; `prise` porte `quantite,unite,heurePrevue,voieAdministration,fuseau,joursSemaine`. `sourceRef` (1–128 caractères) est conservée pendant un réessai, avec exactement le même contenu. Réponse : `traitementId,medicamentId,priseId,versionPrise,fuseau,joursSemaine`. Le même acteur/patient/clé renvoie le résultat enregistré ; un autre contenu donne 409. Toute erreur annule les écritures et notifications de cette commande. Une prise provisoire n'est jamais rendue active en UTC avant validation du fuseau.

Lot : `{identifiantAppareil,elements:[{identifiantLocal,typeOperation,versionSchema,dateCreationLocale,contenu}]}`. Schéma 1, opérations CREER_MESURE et REPONDRE_PRISE. Réponse `{elements:[{identifiantLocal,typeOperation,statut,ressourceId,versionServeur,codeErreur,message}]}`. États SUCCES/REJETE/CONFLIT ; les erreurs métier attendues ne perdent pas les accusés des éléments valides. Une transaction par élément. La clé comprend compte/appareil/type/identifiantLocal. La provenance APPAREIL_CONNECTE est déclarée et non certifiée médicalement.

Le secret QR n'est ni un identifiant patient ni un consentement. Durée technique par défaut 10 minutes. Le serveur en stocke l'empreinte, résout par POST et consomme atomiquement seulement au rattachement final. Un dossier ambigu ou dans une autre structure produit 409 et nécessite un rapprochement humain ; aucun transfert silencieux.

### Alertes et droits

Les priorités internes sont conservées. `gravite` ajoute ATTENTION/CRITIQUE et `statutSuivi` ajoute NOUVELLE/VUE/TRAITEE sans renommer les enums existants. Les listes sont filtrées en SQL avant pagination et triées par gravité puis date. Une réévaluation identique ne crée pas ensuite une alerte de gravité inférieure. Une règle de variation de poids utilise un historique dans sa fenêtre, sans seuil absolu de poids inventé.

Voir [NOTIFICATIONS.md](NOTIFICATIONS.md), [APPELS.md](APPELS.md), [CONSERVATION.md](CONSERVATION.md) et [RECETTE.md](RECETTE.md) pour les fournisseurs, callbacks, limites et preuves. Les exemples OpenAPI sont accessibles via `/v3/api-docs` et Swagger en profil de développement ; désactivés par défaut en production.


## Compléments de restauration du 25 octobre 2026

- `GET /api/v1/rendez-vous?patientId=...` : liste réelle réservée au professionnel actif, limitée à ses affectations et consentements valides. Le filtre patient est facultatif.
- `POST /api/v1/mobile/conversations/{id}/messages` accepte `sourceRef` UUID facultatif pour compatibilité. Les clients actuels le conservent par brouillon inchangé : même contenu/pièces retourne le même message ; clé réutilisée avec une commande différente renvoie 409. La migration V29 ajoute la contrainte unique.
- `POST /api/v1/auth/deconnexion` termine aussi les appels du compte après validation de la révocation ; les fermetures fournisseur échouées restent à reprendre par la maintenance.

## Boîte de notifications : lecture, archives et suppression (V30)

Toutes les routes sont authentifiées et limitées au propriétaire de la notification.

| Action | Route |
| --- | --- |
| Boîte courante | `GET /api/v1/compte/notifications` |
| Archives | `GET /api/v1/compte/notifications?archivees=true` |
| Marquer lue | `POST /api/v1/compte/notifications/{id}/lecture` |
| Archiver | `POST /api/v1/compte/notifications/{id}/archivage` |
| Désarchiver | `POST /api/v1/compte/notifications/{id}/desarchivage` |
| Supprimer de la boîte | `DELETE /api/v1/compte/notifications/{id}` |
| Annuler la suppression | `POST /api/v1/compte/notifications/{id}/restauration` |

Les mutations réussies retournent 204 et sont idempotentes. Une notification supprimée disparaît des listes courante et archivée ; sa restauration retrouve son état d'archivage précédent. La suppression est logique et ne supprime ni message, ni appel, ni alerte clinique liée. `dateArchivage` est ajouté à la réponse. Le statut de lecture reste indépendant de l'archivage. Les mutations d'une autre personne sont refusées ; les lignes sont verrouillées pendant la mutation.

La migration Flyway V30 ajoute `date_archivage`, `date_suppression` et un index de boîte, sans effacer les notifications existantes. L'ancienne liste mobile masque également archives et suppressions ; le portail web conserve sa requête courante et bénéficie du même filtrage.
