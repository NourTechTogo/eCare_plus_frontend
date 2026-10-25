import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { TextareaField } from '@/components/ui/TextareaField'
import { addNote, listNotes } from '@/features/notes/services/noteService'
import type { ClinicalNote } from '@/features/notes/types/note'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDateTime } from '@/utils/formatDateTime'

interface PatientNotesProps {
  patientId: string
  /** Nom du professionnel connecté, enregistré comme auteur des nouvelles observations. */
  authorName: string
  /** N'affiche que la dernière observation, sans le formulaire d'ajout. */
  summary?: boolean
  /** Action placée dans l'en-tête, par exemple l'accès à toutes les observations. */
  action?: ReactNode
}

/** Observations cliniques d'un patient : notes existantes et ajout d'une nouvelle note. */
export function PatientNotes({ patientId, authorName, summary = false, action }: PatientNotesProps) {
  const state = useAsyncData(`notes:${patientId}`, () => listNotes(patientId))
  const fieldId = useId()
  const feedback = useFeedback()
  // Notes ajoutées depuis l'ouverture de l'écran, les plus récentes en premier.
  const [added, setAdded] = useState<ClinicalNote[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!text.trim()) {
      setError('Veuillez renseigner une observation.')
      document.getElementById(fieldId)?.focus()
      return
    }
    setSubmitting(true)
    try {
      const note = await addNote(patientId, text.trim(), authorName)
      setAdded((current) => [note, ...current])
      setText('')
      feedback.success('Observation ajoutée', 'Elle figure désormais dans le dossier du patient.')
    } catch (error) {
      feedback.error(
        "L'observation n'a pas pu être enregistrée",
        error instanceof Error ? error.message : 'Votre texte est conservé. Réessayez.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const allNotes =
    state.status === 'success'
      ? [...added.filter((note) => note.patientId === patientId), ...state.data]
      : []
  const notes = summary ? allNotes.slice(0, 1) : allNotes

  return (
    <Card
      title={summary ? 'Dernière observation' : 'Observations cliniques et notes de suivi'}
      action={action}
    >
      <div className="flex flex-col gap-5">
        {state.status === 'loading' && <ListSkeleton label="Chargement des observations…" />}
        {state.status === 'error' && (
          <Alert variant="error" title="Les observations n'ont pas pu être chargées.">
            Rechargez la page pour réessayer.
          </Alert>
        )}
        {state.status === 'success' && notes.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            Aucune observation pour ce patient.
          </p>
        )}
        {notes.length > 0 && (
          <ul className="flex flex-col gap-3" aria-live="polite">
            {notes.map((note) => (
              <li key={note.id} className="animate-enter rounded-2xl bg-page p-4">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {note.author} ({formatDateTime(note.createdAt)})
                </p>
                <p className="mt-2 text-sm whitespace-pre-line text-ink [overflow-wrap:anywhere]">{note.text}</p>
              </li>
            ))}
          </ul>
        )}

        {state.status === 'success' && !summary && (
          <form
            noValidate
            onSubmit={(event) => void handleSubmit(event)}
            className="flex flex-col gap-4"
          >
            <TextareaField
              id={fieldId}
              label="Nouvelle observation clinique"
              required
              placeholder="Saisissez vos notes cliniques ici…"
              value={text}
              error={error}
              disabled={submitting}
              onChange={(event) => {
                setText(event.target.value)
                if (error && event.target.value.trim()) setError(undefined)
              }}
            />
            <Button type="submit" loading={submitting}>
              {submitting ? 'Enregistrement en cours…' : "Ajouter l'observation"}
            </Button>
          </form>
        )}
      </div>
    </Card>
  )
}
