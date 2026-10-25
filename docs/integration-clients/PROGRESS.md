> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Ledger — plan: docs/superpowers/plans/2026-10-25-integration-clients.md

25 octobre 2026 : autorisation utilisateur « OK FAI CA » pour la suite annoncée. Plan d'intégration enregistré ; exécution directe. Les fournisseurs externes restent à identifier/configurer ; question textuelle envoyée en parallèle du travail local.

Ruling: conserver les interfaces et technologies, intégrer les contrats livrés ; pas de refonte visuelle, de serveur fictif ni de suppression d'anciens documents locaux. Le flux principal de documents devient distant ; les archives locales restent accessibles séparément.

Pre-flight: C1 transporte les pièces de C5 ; C2 produit les réponses de C7 ; C3 notifie les ressources de C5/C6 ; C4 doit rester accessible avant dossier/affectation. Tous utilisent génération/révision de session commune. Les anciennes observations restent distinctes des nouvelles notes ciblées.

Utilisateur : aucun fournisseur choisi ; préparer la configuration, ne pas provisionner un service externe. SDK LiveKit JS 2.x et Flutter 2.13.1 ajoutés car nécessaires au média interopérable, qr_flutter 4.1.0 pour rendre le secret temporaire en QR.

C1 : transport privé multipart/binaire, carnet distant branché dans main.dart, export et suppression, onglet documents médecin ; archives locales conservées avec copie volontaire. Trois tests Flutter et deux Node verts après échec initial pour API absente. Correction du fixture XFile : sous IO, le nom vient du chemin, le paramètre name est ignoré par cross_file ; test corrigé avec path.
C2 : planning et observance réels, réponses versionnées et date de report ; configuration fuseau/jours et prescription médecin par étapes. Deux tests Flutter et un contrat Node verts. Une configuration inconnue reste explicitement à préciser.
C3/C4 : boîte /compte, préférences et effacement/retrait ; page QR avant rattachement, génération manuelle et expiration ; résolution puis confirmation gestionnaire. Contrats de préférences/QR verts.
C5 : pièces authentifiées et notes ciblées (messages/appels/mesures/alertes), observations anciennes conservées ; deux contrats Node verts. Contrôles UI de chargement/erreur et auteur seul pour modifications.
C6 : API et SDK LiveKit branchés, accès média seulement après acceptation et geste utilisateur, historique, entrants en premier plan, refus/fin et nettoyage à la fermeture. Tests contrats Node et Flutter verts, fournisseur absent 503 explicite ; aucune preuve de média réel à ce stade.
C7 : file en mémoire de session, lots typés et acquittements partiels, pas de payload médical dans shared_preferences/localStorage. Les mesures à accusé direct incertain sont rejouées sur leur route directe avec la sourceRef et le corps originaux : les convertir en lot changerait la clé serveur et créerait des doublons. Tests de réseau/conflit/retrait de compte verts.

Première vérification : 27 tests Node verts ; build web réussi. Analyse Flutter sans problème après qualification de ConnectionState. Suite Flutter : 111 réussites, 1 test LIVE opt-in ignoré et 3 échecs ; deux timeouts ont pour cause le rechargement IO inutile d'un carnet local déjà chargé dans le fake async des tests. Réserver reload au carnet distant corrige ce point ; libellé du carnet local précisé en conservant sa séparation par patient. Nouvelle vérification ciblée en cours.

Ruling : la file hors ligne actuelle n'est pas durable après fermeture/redémarrage ; ce choix évite d'introduire un stockage de santé en clair. Limite visible dans l'écran de synchronisation et à conserver au bilan ; rappels système hors ligne, acquisition montre et réception push réelle ne sont pas couverts par les SDK d'appel.

## Recette réelle et revue indépendante

La recette HTTP du backend isolé 8081 passe 28 requêtes réelles. Les adaptateurs React et Flutter sont ensuite exécutés sans mocks contre ce serveur. Ils ont révélé l'absence de MIME par partie dans les multipart Flutter et les fichiers navigateur dont le type est vide : correction dans les transports, maintien de la validation de contenu serveur. Tests LIVE désormais verts. QR, planning, documents communs, pièces et notes partagées/privées sont vérifiés ; l'appel sans fournisseur doit répondre 503.

QA navigateur Edge/Playwright (plugin Browser absent) : login médecin, résumé API, téléchargement d'un document précis, dépôt web réellement persisté, planning, message enrichi/notes, erreur fournisseur et largeur 390 px. Débordement du formulaire documentaire reproduit puis corrigé ; aucun pageerror dans le parcours final. Connexion Flutter via son arbre d'accessibilité également vérifiée contre le vrai backend, captures hors dépôt.

Revue en lecture seule de deux snapshots immuables (696 puis 705 fichiers). Trois constats initiaux acceptés : prise active UTC avant validation du planning, version de reprise devenue périmée après perte de réponse, reconnexion Flutter refusée par une salle encore référencée. Prescription remplacée par un POST atomique/idempotent serveur (V28, receipt, patient verrouillé et droits recontrôlés, transaction globale). Cinq tests RED (route absente) puis cinq verts H2 et cinq verts PostgreSQL. La configuration invalide ne laisse aucun traitement/prise/médicament ; une même clé/commande retourne les mêmes IDs, y compris sous concurrence.

Le contrôleur média Flutter utilise une frontière CallMediaRoom pour son SDK réel et son test ; une déconnexion terminale libère la salle puis permet une nouvelle autorisation. Test rouge : 1 autorisation au lieu de 2 ; vert après correction. La destruction est différée à une microtask pour ne pas détruire ChangeNotifier dans notifyListeners.

La revue complémentaire a révélé l'omission de la première dose à 00:30 dans un fuseau positif : test rouge attendu 1 occurrence, obtenu 0. Correction du début de validité de la seule révision initiale, sans occurrence, selon le début civil et son fuseau ; les révisions historiques multiples ne sont pas réécrites. Test hérité aussi dans PostgreSQL ; suite complète finale en cours.

Contrôle d'accessibilité du parcours réel : la route /treatments n'était pas encore enregistrée malgré la présence de la page. Test d'application rouge puis vert ; route, raccourci accueil et entrée paramètres ajoutés. Les catégories de suivi locales ne sont plus proposées à l'import distant car ce contrat documentaire ne les persiste pas.

Après formatage, les 22 suggestions Dart de blocs/null-aware sont corrigées ; analyse sans problème. Les tests LIVE restent opt-in ; leur exécution séparée est tracée pour ne pas faire passer des tests ignorés pour des validations réseau.

## Derniers contrôles de livraison

La suite backend finale est verte : 162 tests, dont 15 PostgreSQL, zéro échec/erreur/ignoré (`backend-final-complete.log`). La prescription à 00:30 Europe/Paris est vérifiée sur H2 et PostgreSQL ; la reprise UI après réponse volontairement perdue est vérifiée dans Edge, avec un vrai commit et une occurrence unique.

La recette Flutter navigateur a ensuite révélé une différence absente des tests IO : l'en-tête de requête Cache-Control provoquait une prérequête demandant authorization,cache-control, alors que le serveur ne renvoyait qu'authorization dans Access-Control-Allow-Headers. Le statut OPTIONS était 200, mais le navigateur refusait le transfert. En-tête supprimé côté Flutter ; politique CORS et réponse privée no-store du backend préservées. Test rouge puis vert du transport, prérequêtes enregistrées dans `cors-proof.json`, puis téléchargement et import réels verts dans Flutter web, avec le document retrouvé par l'API du médecin.

Ruling : Playwright.fill sur les champs sémantiques Flutter ne synchronise pas toujours le contrôleur de texte avant la validation ; les scripts utilisent désormais focus et vraies frappes clavier, sans modifier l'état interne de l'application. Ce point de pilote n'est pas déclaré comme un correctif produit.

Le raccrochage local n'attend plus une réponse réseau : test rouge puis vert avec accusé serveur retardé, même protection dans React. La fermeture du média et la confirmation serveur sont affichées distinctement. Les notices et le guide sont alignés sur le carnet distant, les pièces/notes, le retrait/demande d'effacement et les limites réelles ; version affichée/envoyée 2026-10-25. La transmission d'un document est annoncée dans le formulaire. Aucun avis de conformité juridique n'est donné.

Compilation Android debug réussie, puis recompilation ciblant l'émulateur via 10.0.2.2:8081. ADB ne trouve aucun appareil connecté ; aucune recette native réelle ni iOS n'est revendiquée. Les avertissements de versions Gradle/AGP/Kotlin et dépendances Java concernent la maintenance future ; ils n'ont pas empêché le build actuel. L'instance PostgreSQL de test 55432 est arrêtée après validation ; API 8081, web 5183 et Flutter web 5184 restent actifs, avec données fictives H2 en mémoire.

### Clôture vérifiée

`export-proof.py` a contrôlé les rapports et les marqueurs de build, puis exporté `verification.json`, `source-manifest.json` (767 fichiers de code/configuration), trois journaux verts et cinq preuves synthétiques. Résultat final : backend 162 réussites dont 15 PostgreSQL, zéro ignoré ; web 28 réussites et 1 test LIVE désactivé par défaut ; Flutter 122 réussites et 2 tests LIVE désactivés par défaut. Les nouveaux adaptateurs réels ont chacun été exécutés séparément avec succès (un Node, un Flutter). L'ancien test LIVE visant la prévisualisation historique n'est pas déclaré exécuté.

Les notices ont leur version 2026-10-25, l'aide vérifie les formats PDF/JPG/PNG de 5 Mo au lieu de l'ancien contrat Word/20 Mo. Tests de lecture obligatoire des deux notices préservés ; suite Flutter définitive verte et analyse sans problème. APK et Flutter web reconstruits après ces textes. Captures du portail et du carnet Flutter inspectées visuellement ; aucune erreur JavaScript non gérée dans les parcours. Les empreintes des artefacts livrés sont dans le manifeste de vérification.

C1 à C8 terminés pour le périmètre local et la préparation de configuration autorisés ; limites externes maintenues ouvertes dans le plan et BILAN.md. Aucun déploiement, abonnement ou compte fournisseur créé. Aucun changement Git/PR : workspace d'archives conservé en place.
