> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Configuration des services externes

Le propriétaire a indiqué qu'aucun fournisseur n'est encore choisi. Cette livraison prépare la configuration ; elle ne crée ni abonnement ni compte externe et ne déclare aucune réception réelle.

## Même backend pour les clients

- Flutter : `flutter run --dart-define=API_URL=https://api.exemple.test/api/v1` ; pour émulateur Android local, défaut `http://10.0.2.2:8080/api/v1`. Un téléphone réel exige une adresse réseau accessible, jamais son propre localhost.
- React : `VITE_API_URL` selon `src/config/api.ts`. Autoriser exactement l'origine de l'interface avec `APP_CORS_ALLOWED_ORIGIN_PATTERNS`. HTTPS requis pour micro/caméra hors développement local.
- Flutter garde le JWT en mémoire ; le web conserve sa session dans sessionStorage de l'onglet, comportement existant, et l'efface à la déconnexion. Aucun secret fournisseur dans les variables VITE_ ou les dart-define. La session est exigée pour chaque téléchargement privé.

## Notifications

Utiliser `config/external-services.env.example` comme liste de paramètres, puis fournir les valeurs à l'environnement du processus Java, au gestionnaire de secrets ou au conteneur. Spring Boot ne charge pas automatiquement ce fichier .env.

`APP_NOTIFICATION_GATEWAY_URL` : URL HTTPS du service qui implémente le contrat de [distribution](../backend/NOTIFICATIONS.md). `APP_NOTIFICATION_GATEWAY_SECRET` : secret partagé serveur/passerelle pour Bearer et HMAC ; ne jamais l'envoyer aux clients. Les paramètres facultatifs de reprise sont `APP_NOTIFICATION_TENTATIVES_MAX` et `APP_NOTIFICATION_DELAI_REPRISE_SECONDES`.

La passerelle doit traduire ce contrat vers le fournisseur retenu (par exemple FCM/APNs/Web Push et/ou l'API officielle WhatsApp), respecter Idempotency-Key, gérer les jetons invalides et appeler les callbacks signés. L'adaptateur HTTP livré ne provisionne pas ces fournisseurs. Il faut également installer le SDK push du fournisseur dans les clients, demander la permission par une action explicite et enregistrer le jeton via `PUT /compte/terminaux/{installationId}`. Les préférences seules ne créent pas un terminal.

Recette externe : réception sur appareil réel, refus de permission, jeton renouvelé/invalide, déconnexion, consentement retiré, reprise après panne, callback dupliqué et absence de données médicales dans la notification externe. WhatsApp exige un numéro consenti et les modèles autorisés du fournisseur.

## LiveKit

- `APP_LIVEKIT_URL` : URL WSS joignable depuis téléphone et navigateur.
- `APP_LIVEKIT_API_KEY`, `APP_LIVEKIT_API_SECRET` : identifiants côté backend seulement ; secret d'au moins 32 octets.
- `APP_LIVEKIT_REVOCATION_ACTIVE` : laisser `false` jusqu'à vérification réelle de la révocation des anciens jetons. Définir `true` n'est pas une preuve de cette garantie.
- Webhook vers `https://api.exemple.test/api/v1/integrations/appels/livekit`, avec authentification fournisseur et intégrité activées. Le backend en vérifie la signature et le corps.

Les SDK officiels React/JS et Flutter sont raccordés : création, acceptation/refus, autorisation privée, connexion, microphone, caméra VIDEO, réception des pistes, fin et nettoyage des médias. Aucun nom patient ni secret de compte ne sert d'identité de salle.

Recette externe obligatoire : téléphone ↔ navigateur, audio dans les deux sens, vidéo, refus micro/caméra, accès après fin interdit, coupure réseau, révocation effective, NAT/TURN et retour en arrière. L'état serveur ACCEPTÉ ou « média connecté » n'atteste pas à lui seul un échange sonore entre deux personnes.

Documentation technique primaire : [SDK JS](https://docs.livekit.io/reference/client-sdk-js/), [SDK Flutter](https://github.com/livekit/client-sdk-flutter), [jetons](https://docs.livekit.io/frontends/reference/tokens-grants/), [webhooks](https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events/).

## Limites client à conserver visibles

Les rappels de traitement système hors ligne, la réception push en arrière-plan et l'acquisition montre ne sont pas livrés par le SDK d'appel. La file de réessai de cette passe reste en mémoire et est effacée à la déconnexion : l'écran le précise. Un vrai mode hors ligne après redémarrage exige un stockage chiffré et une recette sur appareils ; aucune donnée médicale n'est déposée en clair dans shared_preferences ou localStorage.

Les archives documentaires locales par compte sont conservées. La copie au serveur est volontaire ; les anciens fichiers non attribués ne sont pas associés automatiquement à un patient. Formats serveur PDF/JPEG/PNG, 5 MiB par défaut ; les anciens fichiers Word restent sur disque et doivent être convertis avant transmission.
