> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Revue indépendante du backend — 25 octobre 2026

Revue en lecture seule du snapshot `.maintenance/backend-complet/review-20261025`, manifesté sur 449 fichiers ; aucun dépôt Git ni SHA inventé. Réalisée selon les compétences executing-plans et requesting-code-review. Première suite complète : 127 tests, 0 échec/erreur, 2 tests PostgreSQL ignorés.

Les sept constats ont été rapprochés des exigences et retenus pour correction avec régression :

| Constat | Effet | Correction suivie |
|---|---|---|
| Horaire actuel réappliqué au passé | Doses historiques doublées et observance fausse | Révisions de planning avec dates d'effet |
| Arrêt non répercuté immédiatement | Dose future encore confirmable | Annulation transactionnelle au changement et contrôle des réponses |
| Contrôle patient insuffisant pour dossier tiers | Prescriptions/notes accessibles entre structures | Filtrage du dossier réel et contrôles de mutation |
| Nettoyage concurrent avec rattachement d'une pièce | Binaire supprimé malgré message validé | Verrouillage et relecture du brouillon avant suppression |
| Jeton créé après fin/révocation d'appel | Réouverture possible avec un jeton tardif | Émission sérialisée avec l'état de session |
| Erreur d'un élément de synchronisation propagée au lot | Accusés perdus et suite du lot interrompue | Résultats individuels pour erreurs métier attendues |
| Réactivation sans rétablissement des occurrences | Dose future annulée définitivement | Rétablissement explicite des doses futures compatibles |

Compléments de recette retenus : fixture V14 contenant de vraies lignes métier et validation JPA séparée ; parcours HTTP couvrant les nouveaux modules ; référencement d'un compte réellement sans dossier ; tests PostgreSQL de concurrence prêts à exécuter lorsque l'instance existe.

Les documents de conservation, les identifiants fournisseur, la réception push et le média audio/vidéo réels restent des prérequis externes. La revue ne déclare pas le backend prêt pour la production.

Statut initial : corrections et preuves en cours, résultats définitifs à inscrire dans RECETTE.md.

## Clôture des corrections

Les sept constats ont été reproduits avec échec attendu, puis corrigés. Les révisions du planning sont effectives et conservées même pour un changement avant son démarrage ; l'arrêt avant le début ne crée pas de date de fin invalide. Le nettoyage verrouille/recharge la pièce avant toute suppression, et l'émission du jeton d'appel garde le verrou d'état jusqu'à sa création.

Les compléments de recette ont aussi été réalisés : vrai compte auto-inscrit sans dossier, parcours HTTP de bout en bout et OpenAPI, fixture métier V14 non vide, PostgreSQL réel, JPA validate, concurrence et restauration logique avec fichier privé. La suite finale compte 150 tests réussis, zéro échec/erreur/ignoré. Le test PostgreSQL sur horaire fractionnaire a en outre révélé un conflit de précision, corrigé par normalisation à la microseconde avant comparaison/persistance.

La revue porte sur le snapshot indiqué ; les corrections sont vérifiées par les tests et le manifeste final, sans prétendre qu'une seconde revue indépendante du code modifié a été effectuée. Les limites de fournisseur, de clinique et d'intégration client restent celles du bilan.
