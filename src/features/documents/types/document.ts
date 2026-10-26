export type DocumentType =
  'ordonnance' | 'resultat_analyse' | 'compte_rendu' | 'carnet_suivi' | 'autre'

/**
 * Numérisation de l'historique papier à la création du dossier (EF-W1-5), ou nouveau document
 * déposé pendant le suivi (EF-W1-14).
 */
export type DocumentOrigin = 'numerisation' | 'ajout'

export interface PatientDocument {
  id: string
  patientId: string
  type: DocumentType
  title: string
  /** Date du document lui-même (ordonnance, analyse…), au format `AAAA-MM-JJ`. */
  documentDate: string
  url: string
  mimeType: string
  sizeBytes: number
  origin: DocumentOrigin
  uploadedAt: string
}
