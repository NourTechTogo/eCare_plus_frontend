> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Backend eCare+ — bilan initial du 25 octobre 2026

> Suite de cette réalisation : [intégration Flutter/React et bilan actuel](../integration-clients/BILAN.md). La prescription atomique V28 et la correction du premier horaire en fuseau positif portent la suite backend à 162 tests réussis, dont 15 PostgreSQL. Les nombres et le périmètre ci-dessous décrivent la première passe backend, avant cette intégration.

Le backend commun a été complété suivant les lots T1 à T13 du plan, avec le cahier des charges comme référence principale. Cette passe porte sur le serveur ; aucun fichier source mobile ou web n'a été modifié par rapport à la première intégration.

## Fonctions réalisées

- Documents médicaux privés : dépôt patient ou professionnel habilité, métadonnées, liste, téléchargement authentifié, suppression et reprise du nettoyage.
- Traitements : planning précis avec fuseaux, révisions datées et instantanés de dosage ; réponses pris/reporter/ignorer, historique, idempotence et observance.
- Notifications : boîte commune patient/professionnel, références de navigation, préférences, terminaux liés à la session, outbox transactionnelle, réservations concurrentes, reprises et accusés signés.
- Synchronisation : opérations réellement appliquées aux mesures et aux prises, résultats individuels, conflits explicites et dédoublonnage.
- Référencement QR : compte existant réutilisé, création du dossier s'il manque, secret temporaire stocké par empreinte, révocation et consommation atomique.
- Communication : pièces jointes privées rattachées aux messages et notes privées/partagées sur échanges, appels, mesures et alertes.
- Appels : création de salle LiveKit, participants autorisés, jetons courts, acceptation/refus/fin/expiration, callbacks signés, historique et reprise de fermeture distante.
- Télésuivi : résumé patient, pagination et droits filtrés en SQL, gravités/statuts harmonisés, variation de poids sur une période et demande d'effacement suivie.

## Vérifications

`mvnw.cmd -o verify`, avec les tests PostgreSQL activés : **150 tests, 0 échec, 0 erreur, 0 ignoré**. Le JAR final est construit.

Les 9 tests PostgreSQL vérifient notamment la chaîne Flyway V1–V27, une montée depuis V14 avec données métier existantes, le mapping JPA en mode validate, les courses sur documents/prises/QR/outbox, le rollback métier, les horaires fractionnaires et une restauration logique des données avec un document privé. PostgreSQL 18.6 est exécuté dans un dossier de maintenance isolé, sans installation de service ni modification d'une base existante.

Le parcours HTTP réel utilise un port local éphémère : auto-inscription sans dossier → consentement/profil → QR/rattachement → document → traitement/prise → mesure/alerte/notification → message/pièce/note → appel sur fournisseur contrôlé → retrait de consentement → déconnexion/rejet de session. OpenAPI est aussi interrogé réellement.

La revue indépendante a relevé sept défauts, reproduits puis corrigés : historique doublé, arrêt non répercuté, accès entre structures, nettoyage concurrent de pièces, émission tardive de jeton d'appel, lot de synchronisation interrompu et réactivation de doses. Un défaut supplémentaire de précision temporelle PostgreSQL a été corrigé.

Preuves : vérification structurée (preuve locale non publiee), journal Maven (preuve locale non publiee), parcours HTTP (preuve locale non publiee), fichiers backend ajoutés/modifiés et empreintes (preuve locale non publiee), [revue et corrections](REVUE.md).

## Étapes externes et intégration à venir

- Le transport de notification fourni vise une passerelle HTTP documentée ; cette passerelle/fournisseur, les identifiants push et les modèles WhatsApp restent à fournir/configurer puis à tester réellement. Aucun Firebase, Web Push ou compte WhatsApp n'est provisionné.
- L'adaptateur d'appel est testé avec un fournisseur HTTP contrôlé. Une infrastructure LiveKit réelle avec politique de révocation vérifiée, puis l'échange audio/vidéo entre téléphone et navigateur, restent à valider.
- Les nouveaux parcours doivent être raccordés aux clients. Les rappels locaux hors ligne, la lecture montre, la capture caméra et les permissions d'appareil relèvent de cette étape suivante.
- Les seuils indicatifs demeurent des données de démonstration. Une validation clinique est nécessaire avant leur usage réel ; la politique de conservation doit aussi être fixée avant un effacement physique de comptes.
- La recette est locale, sur données fictives. La charge représentative, l'hébergement HTTPS et la procédure d'exploitation de sauvegarde/PITR ne sont pas certifiés par ces tests. La restauration vérifiée utilise une copie logique JDBC et une archive privée sur un jeu figé ; elle ne constitue pas une validation de pg_dump en production.

Les interfaces existantes et les anciennes migrations appliquées ont été conservées. Les nouvelles migrations sont additives. Aucun déploiement de production n'a été effectué.

Contrats et utilisation : [API](API.md), [recette](RECETTE.md), [notifications](NOTIFICATIONS.md), [appels](APPELS.md), [conservation](CONSERVATION.md).
