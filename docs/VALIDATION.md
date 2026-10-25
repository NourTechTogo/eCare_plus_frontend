# Validation et limites de la livraison du 25 octobre 2026

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
