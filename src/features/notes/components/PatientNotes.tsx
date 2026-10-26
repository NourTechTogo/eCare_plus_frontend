import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { TextareaField } from '@/components/ui/TextareaField'
import { addNote, deleteNote, listNotes, updateNote } from '@/features/notes/services/noteService'
import type { ClinicalNote, NoteVisibility } from '@/features/notes/types/note'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDateTime } from '@/utils/formatDateTime'

const NOTE_MAX_LENGTH = 2000

const visibilityOptions: { value: NoteVisibility; label: string; hint: string }[] = [
  { value: 'privee', label: 'Privée', hint: 'Visible par vous seul' },
  { value: 'partagee', label: 'Partagée', hint: 'Le patient la voit dans l’application' },
]

function VisibilityChoice({
  value,
  disabled,
  onChange,
}: {
  value: NoteVisibility
  disabled?: boolean
  onChange: (value: NoteVisibility) => void
}) {
  const name = useId()
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-muted">Visibilité</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {visibilityOptions.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer flex-col gap-0.5 rounded-2xl border px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-primary ${
              value === option.value
                ? 'border-primary bg-primary-soft'
                : 'border-line hover:bg-page'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-ink">{option.label}</span>
            <span className="text-xs text-muted">{option.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface NoteFormProps {
  initial?: ClinicalNote
  submitLabel: string
  /** Renvoie `false` si l'enregistrement a échoué : le texte saisi est alors conservé. */
  onSubmit: (text: string, visibility: NoteVisibility) => Promise<boolean>
  onCancel?: () => void
}

function NoteForm({ initial, submitLabel, onSubmit, onCancel }: NoteFormProps) {
  const fieldId = useId()
  const [text, setText] = useState(initial?.text ?? '')
  const [visibility, setVisibility] = useState<NoteVisibility>(initial?.visibility ?? 'privee')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!text.trim()) {
      setError('Saisissez le contenu de la note.')
      document.getElementById(fieldId)?.focus()
      return
    }
    setSubmitting(true)
    const saved = await onSubmit(text.trim(), visibility)
    setSubmitting(false)
    if (saved && !initial) {
      setText('')
      setVisibility('privee')
    }
  }

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <TextareaField
        id={fieldId}
        label={initial ? 'Note' : 'Nouvelle note'}
        required
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Observation, consigne, point à revoir…"
        value={text}
        error={error}
        disabled={submitting}
        onChange={(event) => {
          setText(event.target.value)
          if (error && event.target.value.trim()) setError(undefined)
        }}
      />
      <VisibilityChoice value={visibility} disabled={submitting} onChange={setVisibility} />
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Button variant="secondary" disabled={submitting} onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

interface PatientNotesProps {
  patientId: string
  /** Médecin connecté : seules ses propres notes sont modifiables. */
  currentUserId: string
  /** N'affiche que la dernière note, sans le formulaire d'ajout. */
  summary?: boolean
  /** Action placée dans l'en-tête, par exemple l'accès à toutes les notes. */
  action?: ReactNode
}

/** Notes du suivi (EF-W3-14) : privées ou partagées, celles du patient comprises. */
export function PatientNotes({
  patientId,
  currentUserId,
  summary = false,
  action,
}: PatientNotesProps) {
  const state = useAsyncData(`notes:${patientId}`, () => listNotes(patientId))
  const feedback = useFeedback()
  // Liste modifiée depuis l'ouverture de l'écran ; `null` tant que rien n'a changé.
  const [edited, setEdited] = useState<ClinicalNote[] | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [deletingId, setDeletingId] = useState<string>()

  const notes = edited ?? (state.status === 'success' ? state.data : [])
  const shown = summary ? notes.slice(0, 1) : notes

  const add = async (text: string, visibility: NoteVisibility) => {
    try {
      const note = await addNote(patientId, text, visibility)
      setEdited([note, ...notes])
      feedback.success(
        'Note ajoutée',
        visibility === 'partagee'
          ? 'Le patient la verra dans l’application.'
          : 'Elle n’est visible que par vous.',
      )
      return true
    } catch {
      feedback.error("La note n'a pas pu être enregistrée", 'Votre texte est conservé. Réessayez.')
      return false
    }
  }

  const save = async (id: string, text: string, visibility: NoteVisibility) => {
    try {
      const note = await updateNote(id, text, visibility)
      setEdited(notes.map((candidate) => (candidate.id === id ? note : candidate)))
      setEditingId(undefined)
      feedback.success('Note modifiée')
      return true
    } catch {
      feedback.error("La note n'a pas pu être modifiée", 'Vérifiez votre connexion puis réessayez.')
      return false
    }
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteNote(id)
      setEdited(notes.filter((note) => note.id !== id))
      feedback.success('Note supprimée')
    } catch {
      feedback.error(
        "La note n'a pas pu être supprimée",
        'Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setDeletingId(undefined)
    }
  }

  return (
    <Card title={summary ? 'Dernière note' : 'Notes du suivi'} action={action}>
      <div className="flex flex-col gap-5">
        {state.status === 'loading' && <ListSkeleton label="Chargement des notes…" />}
        {state.status === 'error' && (
          <Alert variant="error" title="Les notes n'ont pas pu être chargées.">
            Rechargez la page pour réessayer.
          </Alert>
        )}
        {state.status === 'success' && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Aucune note pour ce patient.</p>
        )}
        {shown.length > 0 && (
          <ul className="flex flex-col gap-3" aria-live="polite">
            {shown.map((note) => {
              const mine = note.authorId === currentUserId
              return (
                <li
                  key={note.id}
                  className={`animate-enter rounded-2xl p-4 ${note.authorRole === 'patient' ? 'border border-line bg-surface' : 'bg-page'}`}
                >
                  {editingId === note.id ? (
                    <NoteForm
                      initial={note}
                      submitLabel="Enregistrer"
                      onSubmit={(text, visibility) => save(note.id, text, visibility)}
                      onCancel={() => setEditingId(undefined)}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                          {note.authorRole === 'patient' ? `${note.author} (patient)` : note.author}{' '}
                          · {formatDateTime(note.createdAt)}
                          {note.updatedAt && ' · modifiée'}
                        </p>
                        <Badge tone={note.visibility === 'partagee' ? 'blue' : 'violet'}>
                          {note.visibility === 'partagee' ? 'Partagée' : 'Privée'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-line text-ink">{note.text}</p>
                      {mine && !summary && (
                        <div className="mt-3 flex gap-2">
                          <Button variant="soft" size="sm" onClick={() => setEditingId(note.id)}>
                            Modifier
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={deletingId === note.id}
                            onClick={() => void remove(note.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {state.status === 'success' && !summary && (
          <div className="border-t border-line pt-5">
            <NoteForm submitLabel="Ajouter la note" onSubmit={add} />
          </div>
        )}
      </div>
    </Card>
  )
}
