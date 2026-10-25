# Ajouts et corrections récents — Frontend web eCare+

## Revue complète du dossier patient — 25 octobre 2026

- En-tête adaptatif : le titre du dossier garde une ligne dédiée sur téléphone et petite tablette ; notifications et compte restent accessibles.
- Fiche d’identité compacte sur ordinateur, retours à la ligne pour noms/coordonnées longs et état explicite des informations absentes ; pas d’âge « NaN » si la date de naissance manque.
- Les sept onglets sont visibles sans défilement horizontal : grille sur petit écran, une ligne lorsque la largeur le permet. Les touches fléchées, Début et Fin sélectionnent les rubriques au clavier.
- Cartes, champs de date et boutons longs adaptés aux petites largeurs ; informations personnelles, rendez-vous et observations ne s’élargissent plus avec du texte sans espace.
- Graphiques : moins de dates sur les axes étroits, légendes disponibles au-dessus et infobulles maintenues dans leur cadre. Le tableau des mesures reste défilable et peut recevoir le focus clavier.
- Menus notifications/compte bornés à l’écran ; avis d’appel entrant réductible sans accepter ni refuser l’appel.
- Les contrôles couvrent Résumé, Mesures, Rendez-vous, Documents, Traitements, Observations et Informations ; scénarios de noms longs, date absente, texte agrandi et deux séries de mesures uniquement dans le navigateur, sans écritures cliniques.


## Mise à jour graphique du dossier patient — 25 octobre 2026

- Documents : bibliothèque et dépôt séparés en deux panneaux sur grand écran, empilés sur mobile ; cartes de fichiers lisibles, formulaire aéré, pagination affichée seulement si nécessaire.
- Traitements : barre de consultation compacte, panneau d’observance, prescriptions et horaires séparés, jours sélectionnables répartis régulièrement, prises du jour en cartes.
- Prescription : champs regroupés en Traitement, Médicament prescrit et Organisation des prises ; les noms de champs et commandes API sont conservés.
- Vérification : lint, TypeScript/build et 29 tests web réussis, 1 optionnel ignoré. Les panneaux Documents/Traitements ont été contrôlés à 1208 × 628 et 390 × 844, sans débordement horizontal ni erreur JavaScript ; saisie et sélection des jours exercées sans enregistrer de changement clinique.


## Dernière livraison : interfaces d’origine et fonctions API

- Retour de l’agenda dans la navigation, du panneau et des statistiques rendez-vous du tableau de bord et de l’onglet du patient ; données et actions réellement raccordées au backend.
- Messagerie : squelettes, états vides, barre arrondie, aperçus de fichiers, collage/dépôt et commandes rondes d’origine. Les nouveaux formulaires documents/traitements/notes reprennent les champs eCare+.
- Écran d’appel plein écran d’origine raccordé à l’API et au vrai média LiveKit ; micro/caméra après action explicite. Réception réelle des flux audio et vidéo du Samsung vérifiée, fin depuis le web vérifiée.
- Même brouillon : clé de message conservée lors d’un réessai ambigu, aucune duplication serveur.
- 29 tests réussis, 1 optionnel ignoré ; lint/TypeScript/build réussis. Contrôle visuel 1440/517/390 px sans erreur JavaScript détectée. Le microphone de composition vocale reste explicitement désactivé.

Bilan actuel : [restauration et vérifications](docs/restauration/BILAN.md). Les sections ci-dessous décrivent aussi des étapes historiques antérieures à cette livraison.

État documenté le 25 octobre 2026. Ce fichier concerne l'interface React des professionnels et gestionnaires. Le backend reste responsable des règles métier et des autorisations.

## Connexion au backend commun

- Alignement des services et types sur `/api/v1`, partagé avec Flutter.
- Transport authentifié des formulaires multipart et des fichiers privés.
- Isolation des réponses par session pour éviter d'afficher une réponse d'un ancien compte après déconnexion.
- Déduction du type MIME lorsque le navigateur ne renseigne pas celui du fichier ; libération des URL temporaires de téléchargement.

## Dossier patient et documents

- Raccordement du résumé patient à `/portail/patients/{patientId}/resume`.
- Onglet documents avec dépôt assisté, liste paginée et téléchargement authentifié.
- Gestion des états de chargement, absence de documents et erreurs serveur.
- Correction du débordement du formulaire documentaire sur un écran de 390 px.

## Traitements et prescriptions

- Onglet planning et observance du patient.
- Saisie explicite du fuseau et des jours de prise.
- Formulaire utilisant la création atomique de prescription côté serveur : aucun traitement partiel laissé actif si la configuration est invalide.
- Conservation de la commande et de sa référence lors d'un résultat réseau incertain ; le réessai reprend exactement la même prescription sans créer de doublon.
- Gestion des erreurs de validation et de conflit renvoyées par l'API.

## Notifications, profil et référencement

- Boîte de notifications du compte dans l'interface et lecture persistée.
- Navigation depuis une notification vers la ressource autorisée correspondante.
- Préférences de notification enregistrées sur le serveur.
- Demande d'effacement dans le profil, présentée comme une demande suivie.
- Parcours gestionnaire : résoudre le code QR/temporaire, vérifier l'identité administrative, choisir le médecin et confirmer le rattachement.

## Messagerie, notes et appels

- Pièces jointes privées aux messages avec dépôt et téléchargement.
- Notes ciblées avec visibilité explicite ; modification/suppression des notes de l'auteur avec contrôle de version.
- Conservation séparée des observations cliniques existantes.
- Création, acceptation, refus et fin des appels, historique et bannière d'appel entrant au premier plan.
- SDK LiveKit chargé à la demande ; arrêt du média local dès la fin de l'appel et nettoyage à la déconnexion ou à la fermeture du composant.
- Affichage explicite de l'indisponibilité si le service d'appel n'est pas configuré.

## Vérifications enregistrées

- **28 tests web réussis** dans la suite par défaut ; un test réseau optionnel ignoré par défaut n'est pas compté comme exécuté.
- Test d'adaptateur réseau exécuté séparément contre le backend local commun.
- Lint, TypeScript et build React vérifiés lors de la recette.
- Parcours navigateur à 1440 px et 390 px : connexion, documents, planning, notes et persistance commune avec Flutter.
- Simulation d'une perte de réponse après enregistrement réel d'une prescription : réessai avec la même commande, une seule occurrence conservée au bon fuseau.

Ces résultats sont ceux de la recette consignée ; la rédaction de ce document n'a pas relancé les suites.

## Prévisualisation et limites

Web : `http://127.0.0.1:5183/`. Backend commun : `http://127.0.0.1:8081/api/v1`. La configuration du client passe par `VITE_API_URL`, sans clés secrètes dans le navigateur.

Les comptes fictifs de développement utilisent désormais `m@e.test` pour le médecin et `a@e.test` pour le gestionnaire. Le patient mobile utilise `p@e.test`. Ces identifiants sont communs aux clients et configurés sur le backend local ; le frontend ne contourne pas l'authentification. Les anciennes sessions sont invalidées par le changement de mot de passe. Voir la [configuration backend](https://github.com/NourTechTogo/eCare_plus_backend/blob/ecare_backend_stable/AJOUTS_RECENTS.md#comptes-courts-de-développement) pour la remise en place après réinitialisation de la base de démonstration.

La réception push réelle et les appels audio/vidéo entre appareils attendent le choix et la configuration des fournisseurs. Les appels entrants sont gérés au premier plan ; le fonctionnement en arrière-plan n'est pas attesté. Les données de démonstration sont fictives, sur une base H2 en mémoire.

Le design existant est conservé. Ce bilan ne constitue ni une certification de production ni une garantie d'absence totale de bugs.

## Références

- [Bilan commun et limites](docs/integration-clients/BILAN.md)
- [Preuves de vérification](docs/VALIDATION.md)
- [Configuration](docs/integration-clients/CONFIGURATION.md)
- [Contrat API](docs/backend/API.md)
- [Ajouts backend](https://github.com/NourTechTogo/eCare_plus_backend/blob/ecare_backend_stable/AJOUTS_RECENTS.md) et [ajouts mobile](https://github.com/NourTechTogo/eCare_plus_mobile/blob/ecare_mobile_stable/AJOUTS_RECENTS.md)

## Publication indépendante — 25 octobre 2026

Branche `ecare_frontend_stable` publiée dans le dépôt frontend uniquement, sans fusion dans main. Documentation et exemples de configuration inclus dans ce dépôt ; clés, bases, fichiers privés et artefacts de compilation exclus. Voir [validation et limites](docs/VALIDATION.md).

## Contrat commun de boîte de notifications — V30

L'API commune ajoute l'archivage, le désarchivage, la suppression logique et la restauration des notifications personnelles. La requête web courante conserve son URL et exclut désormais les notifications archivées/supprimées. Le type de réponse documente le champ optionnel dateArchivage ; les routes et droits sont détaillés dans docs/backend/API.md. Les gestes et l'onglet d'archives demandés ici sont implémentés dans le client mobile.
