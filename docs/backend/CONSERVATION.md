> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Conservation et demandes d'effacement

`POST /api/v1/compte/demandes-effacement` enregistre une demande du titulaire authentifié. Une demande en attente est réutilisée ; `GET /api/v1/compte/demandes-effacement/{id}` est réservé à son auteur. L'accusé ne prétend pas que les données ont été effacées.

Avant effacement physique d'un compte, le responsable du traitement doit fixer et valider les durées applicables : dossier clinique, messages/pièces, notes privées des professionnels, audit, consentements, obligations éventuelles de conservation et sauvegardes. Aucun délai juridique n'est inventé dans le code. Cette configuration et le traitement administratif effectif d'une demande restent à établir avant une mise en production.

Le retrait de consentement existe et bloque les nouvelles consultations cliniques. Il ne supprime pas automatiquement les informations ni la preuve de retrait. Les préférences WhatsApp ont leur preuve séparée et ne valent pas consentement clinique.

La suppression d'un document retire immédiatement sa disponibilité et laisse une tâche de nettoyage physique à reprendre en cas de panne. Les fichiers temporaires et binaires sans référence SQL âgés de plus de 24 heures sont candidats au nettoyage ; les pièces non rattachées expirent aussi après 24 heures. Ces délais sont techniques et ne remplacent pas la politique de conservation clinique.

La sauvegarde doit couvrir ensemble PostgreSQL et le stockage privé. Une restauration doit être réalisée et vérifiée dans un environnement isolé avant la recette de production. Ni une migration H2 ni un JAR construit ne prouvent la restauration d'une sauvegarde réelle.
