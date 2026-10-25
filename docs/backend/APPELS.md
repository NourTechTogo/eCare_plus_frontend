> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Appels backend

Adaptateur LiveKit via API Twirp et JWT HS256, sans enregistrement média par défaut. Sources techniques primaires consultées le 25 octobre 2026 : [jetons et permissions](https://docs.livekit.io/frontends/reference/tokens-grants/), [RoomService](https://docs.livekit.io/reference/other/roomservice-api/), [webhooks](https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events/).

Configuration Spring : `app.appels.livekit-url`, `app.appels.api-key`, `app.appels.api-secret` (au moins 32 octets), `app.appels.revocation-active`. Hors boucle locale : WSS/HTTPS. Aucun secret dans les sources ou exemples. L'activation exige une infrastructure dont la révocation a été vérifiée ; un simple booléen de configuration n'atteste pas cette vérification.

Les salles et identités fournisseur utilisent des identifiants opaques. Le backend crée une salle limitée aux deux participants ; il émet uniquement après acceptation un jeton court de 60 secondes. AUDIO autorise le microphone, VIDEO microphone et caméra. Fin/refus/expiration interdisent les nouveaux accès et demandent la révocation des participants puis la fermeture de salle. `fermetureConfirmee=false` indique une fermeture distante encore à reprendre. Le traitement planifié réessaie.

Sur LiveKit Cloud, la révocation explicite est utilisée avec son horodatage de coupure. Sur une installation autonome, la politique empêchant la reconnexion avec un ancien jeton doit être vérifiée avant activation ; ne pas déduire cette garantie de la seule suppression d'une salle. Réseau/TURN, régions, hébergement et coûts dépendent de l'infrastructure retenue et ne sont pas provisionnés ici.

Le webhook `/api/v1/integrations/appels/livekit` vérifie le JWT fournisseur, sa validité et l'empreinte du corps brut. Les événements identifiés sont dédoublonnés. Une salle démarrée n'est pas une preuve d'échange audio ; la durée reste inconnue tant que la connexion des participants n'a pas été observée.

Les anciens tests HTTP contrôlés sont complétés par la recette réelle ci-dessous.


## Recette locale réelle — 25 octobre 2026

LiveKit Windows 1.13.10 officiel est installé dans `.maintenance/livekit/1.13.10` après comparaison du SHA-256 publié. L’API 8081 crée les salles ; le serveur média utilise `room.auto_create: false`, deux participants maximum et des clés privées ignorées. Les ports 7880 (signalisation), 7881 (RTC TCP) et 7882 (RTC UDP) restent locaux. Les anciens jetons ne peuvent ainsi pas recréer une salle supprimée ; cette propriété a été testée réellement, pas déduite du booléen de configuration.

Les tests API → LiveKit → deux clients navigateur mesurent des octets RTP reçus dans les deux sens en AUDIO puis VIDEO, avec caméra/microphone synthétiques. Fin d’appel, absence d’un participant et refus d’un jeton encore valide après suppression sont vérifiés. Le 404 `not_found` de RemoveParticipant/DeleteRoom est idempotent ; les autres erreurs restent des échecs.

Le Samsung doit être relié en USB et les ports TCP 8081, 7880, 7881 inversés par ADB. Cette recette locale n’atteste pas une exploitation Internet, TURN, TLS, iOS ni la qualité des appels sur réseau mobile. Les résultats sur appareil physique sont consignés séparément dans le bilan de restauration.
