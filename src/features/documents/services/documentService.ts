import { requirePatient } from '@/demo/access'
import { query } from '@/demo/database'
import type { PatientDocument } from '@/features/documents/types/document'

/*
 * Documents du patient : numérisation de l'existant à la création du dossier et ajouts pendant le
 * suivi, déposés depuis l'application mobile (EF-W1-5, EF-W1-14). Le médecin les consulte
 * (EF-W1-8). Route attendue : GET /patients/{id}/documents, fichiers servis par un endpoint
 * authentifié (ENF-SEC-6).
 */

/** Documents d'un patient, du plus récent au plus ancien. */
export async function listDocuments(patientId: string): Promise<PatientDocument[]> {
  return query((db) => {
    requirePatient(db, patientId)
    return db.documents
      .filter((document) => document.patientId === patientId)
      .sort((a, b) => b.documentDate.localeCompare(a.documentDate))
  })
}
