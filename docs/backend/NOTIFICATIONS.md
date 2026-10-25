> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Distribution des notifications

La boîte interne existante demeure la source de lecture authentifiée. Les événements externes sont persistés dans `envoi_notification` dans la transaction métier. Le worker réserve un envoi avec un bail, relit le compte, le consentement, l'affectation, les préférences et la session du terminal, puis contacte le transport hors de la transaction de réservation.

L'adaptateur actuellement fourni vise une passerelle HTTP explicitement configurée : `app.notifications.gateway-url` et `app.notifications.gateway-secret`. HTTPS est requis hors `127.0.0.1`. Il ne constitue pas à lui seul un compte Firebase, un service Web Push ou une intégration WhatsApp provisionnés.

Contrat passerelle : POST JSON `{envoiId,canal,destination,titre,message,notificationId}`, en-têtes `Authorization: Bearer <secret>` et `Idempotency-Key: <envoiId>`. `destination` contient le jeton du terminal ou le numéro consenti ; les titres/messages externes restent génériques et sans mesure/diagnostic. Le fournisseur répond `{reference,statut}` avec `ACCEPTE`, `LIVRE` si attesté, ou `JETON_INVALIDE`. Un jeton invalide est désactivé.

États : EN_ATTENTE → EN_COURS → ACCEPTE/LIVRE ; échec temporaire → A_REESSAYER, puis ECHEC à épuisement ; droits retirés → ANNULE. La reprise est progressive et bornée. La livraison exactement une fois n'est pas garantie si le fournisseur ignore la clé d'idempotence après un accusé perdu.

Callback : POST `/api/v1/integrations/notifications/callback`, corps `{envoiId,reference,statut}` où le statut est LIVRE ou ECHEC. `X-Ecare-Timestamp` = secondes Unix ; `X-Ecare-Signature` = hex HMAC-SHA256 du texte exact `timestamp.corpsBrut`, clé `gateway-secret`. Tolérance de 5 minutes. Référence inconnue/non encore enregistrée : 409, à réessayer. Rejouer LIVRE ne duplique pas une livraison ; un échec tardif ne dégrade pas LIVRE.

Les tests couvrent une panne 503, une reprise avec même clé et des callbacks signés. Il reste à provisionner la passerelle/fournisseur, les identifiants et les modèles WhatsApp consentis, puis à prouver la réception réelle. SMS n'est pas ajouté par défaut. Les rappels locaux hors ligne restent à implémenter dans les clients à partir du planning backend.
