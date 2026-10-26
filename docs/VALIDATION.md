# Validation et limites de la livraison du 25 octobre 2026

## Validation des messages vocaux — 26 octobre 2026

- Backend : 171 tests réussis, 0 échec et 0 ignoré, avec PostgreSQL 18.6 dédié et migrations V1 à V31.
- Mobile : 171 tests réussis, 2 tests réseau optionnels ignorés ; `flutter analyze` sans anomalie ; compilations Flutter web et APK Android debug réussies.
- Web : 41 tests réussis, 1 test réseau optionnel ignoré ; lint et compilation TypeScript/Vite réussis. Vite signale encore la taille de certains bundles.
- Recette réelle locale avec microphone synthétique : capture et annulation sans envoi sur chaque client, envoi web vers Flutter puis Flutter vers web, accès privé, durée calculée par le serveur, lecture/pause et déplacement de lecture. Contrôles visuels Flutter à 320, 360 et 604 px, web à 390 et 1280 px ; aucun débordement horizontal web constaté.
- Les tests de régression couvrent les permissions retardées, l'arrêt à la durée maximale sans envoi, les réessais, les changements de session et la concurrence entre lecteurs. Les contrôles backend refusent aussi les WAV falsifiés, trop courts, trop longs ou tronqués.

Ces essais utilisent des sons synthétiques et ne captent pas de conversation personnelle. Le microphone et la lecture sur téléphone physique Android et sur iOS restent à vérifier pour cette livraison vocale ; le Samsung n'était pas détecté par USB au contrôle final. L'APK est compilé, son installation physique n'est donc pas confirmée. Les limites historiques relatives aux fournisseurs de notifications, aux appels Internet TLS/TURN et aux réservations restent applicables.

Cette branche conserve les changements des travaux successifs du workspace eCare+.
Les journaux techniques, captures, bases et fichiers privés restent locaux et ne sont pas publiés.

- Backend : dernière recette complète avant publication, 167 tests réussis, dont les tests de migrations PostgreSQL 18.6 (V1 à V29).
- Web : 29 tests réussis, un test réseau optionnel ignoré ; compilation TypeScript/Vite et lint réussis. La recette navigateur précédente couvre les sept onglets patient de 320 à 1440 px.
- Mobile : 145 tests existants réussis (2 tests réseau optionnels ignorés), puis un test de régression ajouté pour les commandes de préappel. Portrait imposé ; backend commun pour les données de suivi et la messagerie.
- Appels : transport LiveKit local vérifié, avec médias synthétiques entre navigateurs et émission audio/vidéo du Samsung vers le navigateur. Cela ne valide pas tous les appareils ni les réseaux Internet.

## Limites explicites

Le push externe attend un fournisseur. Les tests iOS et les appels sur Internet (TLS/TURN, arrière-plan) restent à réaliser. L'agenda personnel mobile ne constitue pas une réservation médicale. Les interfaces de démonstration historiques ne prouvent pas l'existence d'un service réel. Les bilans historiques gardent leur date et doivent être lus avec ce document.

## Rejouer les contrôles

Backend : Java 21, `./mvnw test` depuis `backend_ecare_plus`. Les tests PostgreSQL nécessitent une instance dédiée et les variables ECARE_TEST_POSTGRES_URL, ECARE_TEST_POSTGRES_USER, ECARE_TEST_POSTGRES_PASSWORD.
Web : `npm ci`, `npm test`, `npm run lint`, `npm run build`.
Mobile : `flutter pub get`, `flutter analyze`, `flutter test`, puis compilation avec `--dart-define=API_URL=...`.

## Mise à jour finale des gestes de notification

Backend : 169 tests réussis, aucun ignoré, avec PostgreSQL 18.6 et migration V30.
Mobile : 151 tests réussis, 2 tests réseau optionnels ignorés ; analyse sans anomalie.
Recette navigateur avec l'API réelle sur 604/360/320 px : toucher pour lecture, gauche pour supprimer, Annuler pour restaurer, droite pour archiver, onglet Archivées et désarchivage, catégorie/recherche/détail. Aucune erreur JavaScript observée.
