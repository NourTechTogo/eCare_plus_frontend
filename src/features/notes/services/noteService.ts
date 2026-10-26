import { requireDoctor, requirePatient } from '@/demo/access'
import { mutate, PlatformError, query } from '@/demo/database'
import { currentAccount, displayName } from '@/demo/session'
import type { ClinicalNote, NoteVisibility } from '@/features/notes/types/note'

/*
 * Commentaires et notes (EF-W3-14) : chacun gère les siennes ; une note privée n'est visible que
 * de son auteur, une note partagée l'est aussi de l'autre partie. Routes attendues :
 * GET|POST /patients/{id}/notes, PATCH|DELETE /notes/{id} (voir docs/CONTRAT_API.md).
 */

/** Notes visibles par l'utilisateur connecté, de la plus récente à la plus ancienne. */
export async function listNotes(patientId: string): Promise<ClinicalNote[]> {
  return query((db) => {
    requirePatient(db, patientId)
    const viewer = currentAccount(db)
    return db.notes
      .filter(
        (note) =>
          note.patientId === patientId &&
          (note.visibility === 'partagee' || note.authorId === viewer.id),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })
}

export async function addNote(
  patientId: string,
  text: string,
  visibility: NoteVisibility,
): Promise<ClinicalNote> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    requirePatient(db, patientId)
    const note: ClinicalNote = {
      id: `note-${crypto.randomUUID().slice(0, 8)}`,
      patientId,
      authorId: doctor.id,
      author: displayName(doctor),
      authorRole: 'medecin',
      visibility,
      createdAt: new Date().toISOString(),
      text,
    }
    db.notes.push(note)
    return note
  })
}

function ownNote(noteId: string, authorId: string, notes: ClinicalNote[]) {
  const note = notes.find((candidate) => candidate.id === noteId)
  if (!note || note.authorId !== authorId) throw new PlatformError('Note introuvable')
  return note
}

export async function updateNote(
  noteId: string,
  text: string,
  visibility: NoteVisibility,
): Promise<ClinicalNote> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    const note = ownNote(noteId, doctor.id, db.notes)
    note.text = text
    note.visibility = visibility
    note.updatedAt = new Date().toISOString()
    return note
  })
}

export async function deleteNote(noteId: string): Promise<void> {
  await mutate((db) => {
    const doctor = requireDoctor(db)
    ownNote(noteId, doctor.id, db.notes)
    db.notes = db.notes.filter((note) => note.id !== noteId)
  })
}
