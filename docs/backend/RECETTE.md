> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Recette backend — exécution du plan T1–T13

## État initial vérifié le 25 octobre 2026

- `mvnw.cmd -o test` : 90 tests, zéro échec, zéro erreur, zéro ignoré. Preuve locale : `.maintenance/backend-complet/baseline.log`.
- Tests additionnels d'accès T1 : 2 réussis ; test PostgreSQL ignoré faute de `ECARE_TEST_POSTGRES_URL`. Preuve : `.maintenance/backend-complet/t1.log`.
- Docker CLI présent, moteur Docker non démarré. Aucune preuve PostgreSQL à ce stade.

## PostgreSQL isolé

Fournir `ECARE_TEST_POSTGRES_URL`, `ECARE_TEST_POSTGRES_USER`, `ECARE_TEST_POSTGRES_PASSWORD` vers une instance de test. Ne pas utiliser une base métier ou de production. `PostgresMigrationTests` crée puis supprime uniquement des schémas aléatoires préfixés `ecare_test_` ; le compte doit pouvoir créer ces schémas.

Commande depuis le backend : `mvnw.cmd -Dtest=PostgresMigrationTests test`. Ce test vérifie la migration complète et la mise à niveau depuis V14 sans perte du témoin. Le profil `postgres-test` impose Flyway et JPA validate pour la recette applicative complémentaire ; celle-ci reste distincte du test de migration.

## Critère de livraison

Les réussites sont enregistrées avec la commande et son résultat actuels. Les appels réels entre appareils, notifications externes, migrations PostgreSQL, performance et restauration ne sont pas considérés vérifiés par des tests H2 ou des transports contrôlés. Les tâches et limites sont suivies dans PROGRESS.md.

## Résultat final — 25 octobre 2026

L'absence initiale de PostgreSQL a été levée en utilisant une distribution portable de test PostgreSQL 18.6 dans `.maintenance/backend-complet`, téléchargée depuis Maven Central avec son SHA-256 vérifié. Instance liée uniquement à `127.0.0.1:55432`, utilisateur/mot de passe de test ; aucun service Windows ni installation système modifiés. Les schémas de chaque test sont aléatoires et supprimés à leur fin.

Commande finale, depuis le backend : `mvnw.cmd -o verify`, variables `ECARE_TEST_POSTGRES_URL`, `ECARE_TEST_POSTGRES_USER`, `ECARE_TEST_POSTGRES_PASSWORD` définies vers cette instance isolée. **150 tests, 0 échec, 0 erreur, 0 ignoré ; BUILD SUCCESS.** Résultat à 09:31:40 UTC. Détails dans verification.json (preuve locale non publiee) et verification-maven.log (preuve locale non publiee).

Les contrôles PostgreSQL réellement exécutés sont :

1. Base neuve et montée depuis V14 avec utilisateurs, patient, médecin, affectation, dossier, traitement, médicament, prises, confirmations et mesure fictifs conservés.
2. Démarrage de l'application avec Flyway actif et JPA validate, dans un schéma isolé.
3. Cinq scénarios concurrence/transaction : dépôt documentaire, consommation QR, confirmation de prise, réservation d'outbox et rollback d'un message avec sa notification.
4. Horaire fractionnaire persistant sans création de dose en double au réessai.
5. Copie logique JDBC d'un jeu fictif, archive du fichier privé et restauration dans un autre schéma migré : contenu des tables et binaire vérifiés. Ce test n'emploie pas pg_dump et ne simule pas une sauvegarde d'exploitation sous écritures concurrentes.

Le parcours HTTP et OpenAPI sont vérifiés sur un vrai serveur local éphémère, et les fournisseurs d'appel/notification sont des serveurs HTTP contrôlés. Les défauts sont reproduits avant correction dans les journaux RED, puis repassés dans la suite finale ; voir [REVUE.md](REVUE.md).

À ne pas extrapoler : réception push/WhatsApp réelle, son/vidéo bidirectionnels, performance sous charge représentative et configuration d'hébergement HTTPS. Ces points restent des recettes de configuration/exploitation et d'intégration client. Les rappels hors ligne et la montre ne sont pas déclarés livrés par le serveur.
