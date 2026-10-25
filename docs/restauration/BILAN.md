> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Restauration eCare+ et appels locaux — 25 octobre 2026

Les présentations d’origine servent à nouveau de référence pour le mobile et le web. Les nouveaux contrats API sont conservés. Ce bilan décrit les vérifications réalisées ; il ne promet pas une absence totale de bugs.

## Interfaces

- Mobile : cartes/carrousel des médecins affectés, conversation bleue et barre arrondie, écrans audio/vidéo d’origine, grand avatar et champs du profil, catégories/recherche des notifications, présentation d’authentification pour la réinitialisation. Documents, mesures, traitements et réglages restent accessibles.
- Web : carte et statistiques de rendez-vous du tableau de bord, navigation agenda et onglet patient, liste/squelettes/états vides de messagerie, pièces jointes avec aperçu et collage/dépôt, boutons d’appel et écran plein écran d’origine. Les nouveaux formulaires reprennent les champs et couleurs eCare+.
- Les données viennent des API : pas de faux rendez-vous confirmés ni de faux médecins affectés. L’agenda personnel mobile reste explicitement local ; son bouton Planifier ne réserve pas une consultation médicale. Les informations légales restent conformes au fonctionnement actuel plutôt que reprendre des promesses inexactes de l’archive.

## Logique et appels

`GET /api/v1/rendez-vous` filtre les affectations et consentements avant exposition. Une clé UUID par brouillon garantit qu’un réessai de message inchangé retourne le même message et ne rattache pas deux fois ses pièces ; une commande différente avec la même clé donne 409. La migration V29 est ajoutée.

La déconnexion révoque la session, termine les appels du compte et demande leur fermeture distante après commit. Une fermeture fournisseur échouée reste persistée pour reprise. Un participant déjà absent n’empêche plus de fermer la salle.

LiveKit local 1.13.10 officiel transporte les médias ; notre API autorise les participants, crée les salles et émet les jetons. La création automatique des salles est interdite. La fermeture et le refus d’un ancien jeton non expiré sont vérifiés sur le serveur réel, y compris après déconnexion.

Sur le Samsung A55 et le portail médecin, VIDEO puis AUDIO ont été acceptés et connectés par les interfaces. Le navigateur reçoit la piste micro physique et une vidéo du téléphone décodée à 180 × 320. Le raccrochage web termine la session. Le navigateur utilise des périphériques synthétiques pour cette recette. Les flux RTP bidirectionnels sont aussi mesurés entre deux navigateurs synthétiques ; les statistiques du sens navigateur → téléphone n’ont pas été instrumentées sur le téléphone. Aucun enregistrement audiovisuel n’a été conservé.

## Vérifications

| Partie | Résultat |
|---|---|
| Backend | 167 tests, zéro échec/erreur, PostgreSQL 18.6 dédié, migrations jusqu’à V29 |
| Flutter | 134 tests réussis, 2 tests optionnels ignorés ; analyse sans anomalie |
| Web | 29 tests réussis, 1 test optionnel ignoré ; lint, TypeScript et build réussis |
| Navigateur | vues restaurées, largeurs 1440/517/390 ; aucune erreur JavaScript détectée |
| Livraison | APK final installé sans désinstallation de l’ancienne application ; aperçu Flutter 5184 actualisé |

Les preuves structurées et empreintes sont dans verification.json (preuve locale non publiee). Les journaux complets restent dans `.maintenance/interface-restoration/`. Les captures des interfaces restaurées sont dans le dossier local de visualisations du chat.

## Données locales et décisions

La précédente base H2 en mémoire a été constatée vide pendant la recette ; sa cause exacte n’a pas été démontrée. Les comptes et données fictives ont été recréés dans une base H2 sur disque. Les fichiers privés trouvés ont été sauvegardés et copiés dans le stockage dédié. Les anciens identifiants internes ne sont donc pas présentés comme conservés. Les connexions courtes restent `p@e.test`, `m@e.test`, `a@e.test`.

Le démarrage utilisait aussi des ressources de test avant les ressources applicatives : elles sont désormais exclues. Le secret JWT vient de la configuration privée et le stockage est séparé des tests. Un redémarrage a conservé le compte et son PDF privé, téléchargement authentifié vérifié.

Sans dépôt Git, les étapes commit/worktree de la compétence d’exécution sont inapplicables ; sources, archives, inventaire et preuves locales sont conservés. La revue finale indépendante a relevé les deux défauts réessai/logout : chacun a été reproduit par un test en échec puis corrigé, avec suite complète verte.

## Limites conservées

- Changement de caméra avant/arrière et passage d’un appel audio actif en vidéo encore désactivés ; démarrer un appel VIDEO permet d’utiliser la caméra.
- Messages vocaux et fournisseur externe de notifications push non raccordés. Les notifications internes utilisent l’API.
- Photo de profil locale à la session ; agenda personnel et synchronisation différée ne constituent pas une réservation médicale ni une file persistante garantie.
- Recette locale USB : pas de validation Internet, TURN, TLS, iOS, réseau mobile réel, charge ou exploitation. Avertissement de taille de bundle web et versions Gradle/Kotlin à faire évoluer séparément.

## Redémarrage de cette installation locale

API : `eCare_plus_backend-main/scripts/demarrer-demo-locale.ps1`, avec la configuration privée déjà préparée dans `.maintenance`. Ce script utilise H2 fichier et exclut les classes de test ; il ne constitue pas un provisionnement de production ni un installateur pour un autre ordinateur.

LiveKit : exécutable `.maintenance/livekit/1.13.10/livekit-server.exe`, argument `--config` vers le fichier privé `livekit.yaml` du même dossier. Garder `room.auto_create: false`, la limite de deux participants et les ports locaux ; ne publier aucune clé.

URLs : API `http://127.0.0.1:8081/api/v1`, portail `http://127.0.0.1:5183`, aperçu patient `http://127.0.0.1:5184`. Téléphone : tunnels ADB TCP 8081, 7880 et 7881 ; ordinateur et câble requis.
