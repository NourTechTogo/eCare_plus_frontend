# Rapports et comptes rendus transmis - portail web

Livraison locale du 28 octobre 2026, sans commit/push et sans nouvelle permission backend.

Dans Documents du dossier patient, le filtre « Rapports et comptes rendus » affiche les documents COMPTE_RENDU déjà transmis dans le carnet. Le filtre Tous conserve le parcours documentaire existant ; le formulaire de dépôt et les téléchargements privés restent disponibles. Type, date et taille sont affichés. Une actualisation manuelle permet de retrouver une copie ajoutée depuis Flutter.

Le portail professionnel n'appelle pas les routes des synthèses personnelles /mobile/me/rapports-consultation. Une affectation ne donne pas accès à leur JSON privé. Le patient peut déposer volontairement une copie PDF depuis Mes rapports dans Flutter après confirmation ; elle devient alors un document soumis aux droits existants du dossier, comme tout autre compte rendu transmis.

Le filtre parcourt les pages de métadonnées documentaires autorisées avant de filtrer et de paginer localement (20 éléments par page). Un rapport situé sur une page serveur ultérieure ne disparaît donc pas du filtre. Le mode Tous conserve la pagination serveur initiale. Cette approche requiert de charger toutes les métadonnées autorisées lors d'un filtrage ; elle n'est pas une recherche serveur optimisée pour un très gros volume documentaire.

L'état du formulaire et du filtre est réinitialisé quand le patient change, via une sous-vue identifiée par patientId. useAsyncData et les transferts privés conservent leurs gardes de session existantes. Aucun nouveau stockage persistant de données médicales ni URL publique.

Fichiers : features/documents/components/PatientDocuments.tsx, services/documentService.ts ; test tests/report-documents.test.mjs. Composants et styles eCare+ existants conservés.

La recette navigateur utilise un patient fictif et son médecin autorisé, avec le même backend local que Flutter. Résultats, tailles d'écran et limites dans [VALIDATION.md](VALIDATION.md).
