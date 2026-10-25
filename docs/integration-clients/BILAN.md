> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# eCare+ — intégration des clients, 25 octobre 2026

Les fonctions backend livrées ont été raccordées à Flutter et React, avec le cahier des charges comme référence principale. Les interfaces conservent leur structure et les anciennes archives locales. La configuration des services externes est préparée selon la décision du propriétaire : aucun fournisseur n'est encore choisi.

## Résultat visible

| Domaine | Flutter patient | React professionnel |
|---|---|---|
| Documents | Carnet serveur, import PDF/JPEG/PNG, téléchargement privé, retrait ; archives locales conservées et transfert volontaire | Onglet documents du dossier, dépôt assisté, pagination et téléchargement privé |
| Traitements | Planning par jour, prescriptions, pris/reporter/ignorer, versions, observance | Planning/observance du patient, configuration fuseau et jours, création de prescription atomique |
| Notifications | Boîte commune, lecture persistée, ouverture des ressources | Boîte commune du compte et navigation vers les ressources autorisées |
| Préférences et droits | Préférences serveur, demande d'effacement et retrait du consentement | Préférences serveur et demande d'effacement ; aucune suppression immédiate annoncée |
| QR | Code temporaire et QR affichés, expiration, accès avant rattachement et sans imposer le consentement clinique | Résolution administrative, choix du médecin, confirmation du rattachement par gestionnaire |
| Messages et notes | Pièces PDF/images privées, téléchargement, notes sur messages/appels/mesures/alertes, visibilité explicite | Même contrat de pièces et notes ciblées ; observations cliniques existantes conservées séparément |
| Appels | Création, acceptation/refus/fin, historique, entrants en premier plan et SDK LiveKit | Même parcours et transport LiveKit ; SDK chargé à la demande |
| Réessais | File en mémoire de session pour les opérations non confirmées, conflits visibles, acquittements partiels | Réessai de prescription avec commande/clé identiques, sans doublon |

Le formulaire médecin utilise désormais `POST /portail/patients/{patientId}/prescriptions` : traitement, médicament, prise, fuseau/jours et reçu d'idempotence sont enregistrés dans une transaction. La migration V28 est additive. Une erreur de configuration ne laisse aucune prescription partielle active. Le même réessai, même concurrent, retourne les identifiants enregistrés ; un contenu différent sous la même clé donne 409.

## Corrections prouvées pendant la recette

- Déclaration MIME des fichiers multipart conforme au contenu contrôlé par le serveur.
- Suppression d'un en-tête de requête Flutter incompatible avec CORS ; les réponses privées du backend gardent `Cache-Control: no-store`.
- Formulaire documentaire web sans débordement à 390 px.
- Prescription atomique, version de reprise et première prise après minuit dans un fuseau positif.
- Reconnexion Flutter avec une nouvelle autorisation et une nouvelle salle après déconnexion terminale.
- Arrêt du média local au clic Terminer sans attendre un réseau lent ; fermeture serveur suivie séparément.
- Route des traitements réellement enregistrée, accès depuis accueil/paramètres ; référencement accessible depuis l'écran de consentement.

Un relecteur indépendant a effectué une revue puis une contre-vérification des corrections sur deux snapshots immuables. Les constats confirmés ont été reproduits par des tests puis corrigés. La contre-vérification ne couvrait pas les fichiers SQL/tests non copiés dans son snapshot : ces fichiers sont couverts par la recette PostgreSQL, sans prétendre à leur revue indépendante.

## Vérifications

Les nombres et empreintes définitifs sont dans verification.json (preuve locale non publiee). Les journaux complets sont conservés dans `.maintenance/integration-clients/` ; les preuves synthétiques partageables sont dans ce dossier.

- Backend : suite Maven complète, PostgreSQL réel (migrations V1–V28, montée depuis V14 peuplée, JPA validate, concurrence, restauration logique), sans test ignoré.
- Clients : tests de contrats et widgets, analyse Flutter, lint/TypeScript/build React, build Flutter web et compilation APK Android debug.
- Adaptateurs réels : tests opt-in exécutés séparément pour Flutter et React contre le même backend 8081. Les tests réseau ignorés par défaut ne sont pas comptés comme des recettes exécutées.
- HTTP : 28 requêtes de préparation/validation sur données fictives, documents privés partagés, planning, pièces/notes et QR. Sans fournisseur d'appel, 503 attendu.
- Navigateur Edge/Playwright : parcours web à 1440 px et 390 px, puis Flutter web à 517 px. Pas de plugin Browser disponible ; Playwright existant utilisé. Imports, téléchargements privés et persistance croisée sont contrôlés. Une perte de réponse après un vrai commit de prescription est injectée : réessai avec même commande, une seule occurrence au bon fuseau.
- Contrôles visuels effectués sur les captures. Le scénario de perte réseau provoque volontairement `net::ERR_FAILED` ; aucune erreur JavaScript non gérée n'est admise.

## Prévisualisation locale

- Web : [http://127.0.0.1:5183/](http://127.0.0.1:5183/)
- Flutter navigateur : [http://127.0.0.1:5184/](http://127.0.0.1:5184/)
- Backend commun : [OpenAPI 8081](http://127.0.0.1:8081/swagger-ui.html)

Comptes fictifs : `medecin@ecare.test`, `admin@ecare.test`, `patient.integration.clients@ecare.test`. Le mot de passe reste celui configuré pour la démonstration locale (`APP_DEMO_PASSWORD`) ; il n'est pas recopié dans les rapports. Cette prévisualisation utilise une base H2 en mémoire et des fichiers de test : elle ne constitue pas un hébergement permanent. Les anciens ports 8080/5173/5174 ne sont pas remplacés.

L'APK debug se trouve dans `eCare_plus_mobile-main/build/app/outputs/flutter-apk/app-debug.apk`. Sa compilation finale vise l'émulateur Android via `http://10.0.2.2:8081/api/v1` ; un téléphone réel nécessite une URL accessible adaptée. Aucun appareil/émulateur n'était connecté lors de cette recette. Compilation iOS et essais sur téléphone non effectués sur cet environnement Windows.

## Ce qui attend une configuration ou un lot distinct

1. Notification externe : passerelle/fournisseur, clés, modèles WhatsApp, SDK push des clients, permission et jeton de terminal, puis réception réelle. Les préférences seules ne créent pas un terminal push.
2. Appels réels : instance LiveKit, secrets, WSS/TURN, webhook et révocation validée. Audio/vidéo téléphone ↔ navigateur et arrière-plan ne sont pas attestés ici. En leur absence, l'interface conserve une erreur explicite et la messagerie reste utilisable.
3. Mode hors ligne durable et rappels système : la file actuelle est en mémoire, effacée à la déconnexion et perdue à la fermeture. Le stockage chiffré après redémarrage, les rappels natifs et l'acquisition montre restent à réaliser/valider sur appareils ; ils ne sont pas présentés comme livrés.
4. Exploitation : HTTPS réel, charge représentative, sauvegardes d'exploitation/PITR, validation clinique des seuils et règles légales de conservation. L'effacement physique n'est pas automatisé par la demande suivie.

Le guide [CONFIGURATION.md](CONFIGURATION.md) et [l'exemple de variables](../../config/external-services.env.example) préparent la suite sans inclure de secret. Les tests verts et la recette locale ne constituent pas une garantie d'absence totale de bugs ou une certification de production.
