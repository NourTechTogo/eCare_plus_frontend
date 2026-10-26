/** Une note privée n'est visible que de son auteur ; partagée, l'autre partie la voit (EF-W3-14). */
export type NoteVisibility = 'privee' | 'partagee'

/** Commentaire ou note rattaché au suivi d'un patient, rédigé par le médecin ou par le patient. */
export interface ClinicalNote {
  id: string
  patientId: string
  authorId: string
  author: string
  authorRole: 'medecin' | 'patient'
  visibility: NoteVisibility
  createdAt: string
  updatedAt?: string
  text: string
}
