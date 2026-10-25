> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# SDD ledger — plan: docs/superpowers/plans/2026-10-24-backend-complet.md

Début : 25 octobre 2026. Autorisation utilisateur : implémenter T1–T13, backend seulement.

Ruling: archives sans dépôt Git — exécution en place et preuves sous .maintenance/backend-complet, pas de worktree/commit fictif — sauvegarde initiale .maintenance/before-integration.zip conservée.
Ruling: scripts de suivi du skill fondés sur Git remplacés par ce registre — contexte sans dépôt — mêmes jalons et preuves, aucun état inventé.
Pre-flight: T2 produit StockagePrive consommé par T3/T10, compatible ; T4 produit occurrences stables consommées par T5/T8, conserver occurrenceId après report ; T6 fournit préférences relues par T7 ; T7 produit distribution consommée par T11 ; T9 réutilise affectation existante ; T12/T13 consomment tous les contrats. Aucun conflit bloquant.
Ruling: T10 précède T11, donc cible de note APPEL valide seulement après création réelle d'une session T11 — aucun appel fictif créé pour permettre une note.
T1: en cours. Docker installé mais moteur absent ; PostgreSQL réel reste à valider. Poursuivre les tâches testables comme prévu par T1.

T1: matrice et tests d'accès ajoutés ; 2 tests verts. PostgresMigrationTests créé, ignoré explicitement faute d'instance. JPA validate PostgreSQL et migrations réelles restent ouverts.
T2/T3: routes de documents implémentées ; RED 4 assertions HTTP 404 attendues, GREEN 4 tests ; tests de panne de suppression et compensation rollback SQL 2 verts. Lecture authentifiée, tombstone immédiate et nettoyage repris. Nettoyage planifié/orphelins et tests approfondis restants à fermer avant recette finale.
T4/T5: planning/occurrences/réponses/observance implémentés. RED 3 routes HTTP 404, GREEN 3 tests fonctionnels et 37 régressions de domaine/cliniques, avec documents = 46 tests verts. Test supplémentaire ajouté pour jours adjacents/fuseau et version renvoyée ; correction en cours.
Ruling: les fréquences historiques libres ne sont pas interprétées automatiquement — seules QUOTIDIEN/QUOTIDIENNE/TOUS_LES_JOURS ou des jours structurés configurés génèrent des occurrences — évite d'inventer des horaires de prescription.
Ruling: le fuseau initial des horaires existants est UTC, valeur technique explicite modifiable par médecin ; toute prescription réelle doit confirmer ce fuseau.
Ruling: les confirmations reportées historiques ne conservaient pas leur date initiale ; V16 reprend leur date actuellement connue et ne reconstruit pas une date historique inconnue.

T6: préférences et terminaux ajoutés ; 2 tests verts avec vérification des versions/périodes T4, total 6 tests verts (notifications-green.log). Déconnexion désactive uniquement les terminaux liés au JWT courant ; les autres sessions ne sont pas désactivées par cette action.
Ruling: preuve de consentement canal dans ConsentementCanal, distincte du consentement clinique Patient existant — les professionnels ont aussi des préférences et un accord WhatsApp ne doit jamais accorder un accès clinique.
Ruling: aucun fournisseur de notification ni identifiants livrés dans le workspace — implémenter un adaptateur HTTP vers une passerelle explicitement configurée et testée en boucle locale ; activation/livraison externe réelle reste un prérequis de recette, jamais simulée comme acquise.

T7: outbox et transport HTTP réels sur boucle locale : test panne 503 → A_REESSAYER → ACCEPTE avec même clé d'idempotence, aucun contenu médical dans payload. Tests T4/T6/T7 = 7 verts. Pas de livraison externe attestée. Callbacks signés et tests concurrence/rollback encore à compléter.
T8/T9: RED 4 routes manquantes ; GREEN 4 tests (sync-qr-green.log). Synchronisation valide appliquée aux mesures avec accusé rejouable ; lot partiel et conflits explicites. QR renouvelable/révocable, secret stocké uniquement par empreinte, consommation atomique et réutilisation du dossier vérifiées.
Ruling: journal historique opaque ElementSynchronisation conservé pour compatibilité ; nouveaux accusés métier dans OperationSynchronisation, sans transformer rétroactivement les anciennes entrées non vérifiées en succès métier.
T10: pièces jointes privées et notes implémentées ; vérifications en cours.

T10: tests pièces/notes et régressions messagerie/contrats = 14 verts (medias-notes-green.log).
T11: orchestration LiveKit testée en HTTP local, token participant restreint au micro pour AUDIO, idempotence de création, refus tiers et transitions après fin ; 2 verts. Webhooks signés/intégrité/rejeu ajoutés et testés verts (complements-green.log, classe AppelIntegrationTests : 3 verts).
T12: résumé et pagination SQL patients/professionnels/mesures/observations/alertes ajoutés ; test gravité puis date vert. Demande d'effacement persistante privée et sans destruction ajoutée. Correction d'un retrait de consentement dont le JSON exigeait encore des champs de lecture/version en cours de validation.
Ruling: appels activables seulement avec fournisseur/configuration et révocation confirmée par configuration ; jetons courts 60 s, suppression de salle et révocation des participants, fermeture distante persistée/reprise. Aucun enregistrement média par défaut. Documentation source LiveKit officielle consultée pour grants, Twirp et webhooks.

Revue : sept constats confirmés dans docs/backend/REVUE.md. Les tests RevueBackendRegressionTests sont passés de 5 échecs métier attendus à 5 verts, avec 17 régressions planning/cliniques = 22 tests verts (revue-green.log). Révisions de planning effectives persistées (V26), arrêt/activation synchronisent les occurrences dans la transaction de prescription, requêtes et mutations bornées à la structure réelle du dossier, erreurs attendues de synchronisation rendues par élément.
Ruling: une prescription initiale explicitement datée dans le passé permet de générer ses doses prévues ; après toute modification, seules les révisions applicables à la date de chaque occurrence déterminent ce planning. Les versions inconnues d'avant cette capture ne sont pas reconstruites.
Ruling: la toute première confirmation du fuseau/jours avant la matérialisation d'une occurrence peut préciser le planning initial provisoire UTC ; les changements suivants prennent effet à leur horodatage serveur et préservent le passé.

## Clôture de la réalisation backend — 25 octobre 2026

Les sept constats de revue ont été reproduits puis corrigés, y compris les courses entre nettoyage et rattachement de pièce, et entre fin d'appel et émission de jeton. Les régressions supplémentaires couvrent le changement de planning avant son démarrage, l'arrêt avant début et la précision des horaires PostgreSQL.

T13 est vérifié localement : PostgreSQL 18.6 portable isolé (archive vérifiée par SHA256), migrations V1–V27 dont montée depuis une fixture V14 peuplée, JPA validate, cinq scénarios de concurrence/rollback, précision temporelle et restauration logique JDBC avec archive du fichier privé. Cela représente neuf tests sur PostgreSQL réel. La restauration n'est pas un pg_dump/PITR ni une sauvegarde sous écritures concurrentes.

Commande finale `mvnw.cmd -o verify` avec variables PostgreSQL de test : **150 tests, zéro échec, zéro erreur, zéro ignoré** ; JAR produit. Le manifeste compte 143 fichiers backend ajoutés/modifiés et zéro différence source des clients par rapport à la première intégration. Preuves : `verification.json` (dont empreinte du JAR), `verification-maven.log`, `parcours-http.json`, `source-changes.json`, `RECETTE.md` et `REVUE.md`.

Le workspace est une archive sans dépôt Git ; aucune branche, commit ou PR n'a été créé. Les sources sont conservées en place. Les serveurs de présentation existants ne sont pas redémarrés par cette réalisation. L'instance PostgreSQL créée uniquement pour les tests sur le port 55432 a été arrêtée avec `pg_ctl stop -m fast -w` : sortie `server stopped`, code 0. Ses données et journaux locaux sont conservés pour reproductibilité.

Les fournisseurs de notification et LiveKit réels, le média téléphone/navigateur, les seuils cliniques, la politique de conservation, la charge et l'hébergement restent à valider comme décrit dans `BILAN.md`. La demande d'effacement est persistée sans suppression physique automatique. L'intégration mobile puis web reste une étape distincte.

Suite du 25 octobre : intégration des fonctions livrées aux clients réalisée dans `docs/integration-clients/BILAN.md`. Ajout de la prescription atomique/idempotente (V28) pour éviter les écritures partielles et doublons après réponse perdue ; correction du début civil de la révision initiale dans son fuseau. Suite finale 162 tests réussis, dont 15 PostgreSQL, zéro ignoré ; preuves actuelles dans `docs/integration-clients/verification.json`. Les nombres précédents décrivent la première passe backend.
