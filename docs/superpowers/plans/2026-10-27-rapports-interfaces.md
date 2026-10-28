# Rapports de consultation dans les interfaces

> Exécution : superpowers:executing-plans, tests avant implémentation, revue ciblée avant livraison.

**Goal:** Le patient prépare sa consultation dans Flutter, consulte une synthèse enregistrée et télécharge son PDF ; les professionnels retrouvent les copies volontairement déposées dans le carnet.

**Architecture:** Réutiliser exclusivement les routes personnelles /mobile/me/rapports-consultation et le dépôt de documents existant. Le web professionnel utilise /portail/patients/{id}/documents, jamais les rapports privés d'un autre compte. Une copie transmise est un COMPTE_RENDU distinct du snapshot original, soumise aux droits documentaires actuels.

**Tech Stack:** Flutter/Provider/http/file_picker, React/TypeScript et composants existants. Aucune nouvelle dépendance, aucun changement backend.

**Spec:** Choix utilisateur du 27 octobre : « Passer au mobile et au web : rapports et téléchargement PDF ». Conserver le style visuel eCare+, les interfaces existantes, les dépôts séparés et tous les changements locaux. Aucun commit/push.

## Décisions de réalisation

- Ajouter une entrée Mes rapports dans les paramètres et la page eCare+ mobile, sans remplacer la navigation principale.
- Page Flutter : période civile de 1 à 90 jours et fuseau IANA explicite, génération idempotente (même référence lors d'un réessai), liste paginée, détail du snapshot et graphiques descriptifs des séries. Ne pas recalculer les statistiques médicales.
- Télécharger les octets avec Bearer ; contrôler format PDF et borne 16 Mio. Enregistrement par le sélecteur de fichiers existant, pas d'URL publique/token en URL. Une annulation ne vaut pas succès.
- Le dépôt d'une copie requiert confirmation expliquant son accès par les professionnels autorisés au dossier. Borne documentaire actuelle 5 Mio. Les octets, date et sourceRef d'un envoi incertain sont conservés pour son réessai pendant la page/session ; aucune transmission automatique à la génération. Une nouvelle action après redémarrage peut créer une nouvelle copie.
- Tout chargement/action est lié à la génération de session ; purger les données et empêcher un résultat tardif, un téléchargement ou un dépôt sur le compte suivant.
- Web : filtres Tous / Rapports et comptes rendus, liste et pagination cohérentes sur l'ensemble des métadonnées autorisées, actualisation et téléchargement sécurisé existant. Afficher le type et distinguer le document transmis du rapport privé ; aucun partage implicite par affectation.

## Fichiers et tâches

- [x] 1. Mobile : tests de contrat dans test/consultation_reports_api_test.dart ; service services/consultation_reports_api.dart. Générer/lister/lire/PDF/dépôt, erreurs, réessais et changement de session.
- [x] 2. Mobile : views/reports/consultation_reports_page.dart et widgets de détail/graphique ; routes/main/paramètres/page eCare+. Tests widget petit écran, texte agrandi, période, erreurs, absence de données et confirmation avant dépôt.
- [x] 3. Web : service documentService.ts et PatientDocuments.tsx ; filtre sur toutes les pages autorisées, retours erreur/chargement/vide et téléchargement des comptes rendus. Tests Node du filtrage/pagination et parcours navigateur.
- [x] 4. Vérifier Flutter analyze/test/build web et build Android si disponible, npm test/lint/build ; recette locale mobile-web-API avec données fictives, contrôle responsive et droits, revue indépendante ciblée.
- [x] 5. Actualiser les Markdown à la racine de chaque projet modifié, consigner résultats exacts et limites. Backend et HEAD conservés ; aucun push.

## Résultat du 28 octobre 2026

Mobile : 186 tests réussis, 2 réseau optionnels ignorés, analyse sans anomalie, web/APK compilés. Web : 43 tests réussis et 1 optionnel ignoré, lint/build réussis. Recette réelle de génération/PDF/copie/lecture médecin et autonomie sans affectation validée ; captures responsive et console contrôlées. Référence de génération et Material des listes corrigés avec régressions. Aucun commit/push, aucun changement backend.
