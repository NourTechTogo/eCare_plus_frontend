import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SelectField } from '@/components/ui/SelectField'
import { TextareaField } from '@/components/ui/TextareaField'
import { TextField } from '@/components/ui/TextField'
import { slotDurationOptions } from '@/features/appointments/labels'
import {
  AppointmentStateError,
  AvailabilityInUseError,
  cancelAppointment,
  createAvailabilities,
  deleteAvailability,
  EmptyAvailabilityError,
  OverlappingAvailabilityError,
  PastDateError,
  refuseAppointment,
} from '@/features/appointments/services/appointmentService'
import { slotStarts } from '@/features/appointments/slots'
import type { Appointment, Availability } from '@/features/appointments/types/appointment'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDateTime } from '@/utils/formatDateTime'
import { formatDayHeading, formatTime, fromDateAndTime, toDateInput } from '@/utils/localDate'

const durationSelectOptions = slotDurationOptions.map((minutes) => ({
  value: String(minutes),
  label: `${minutes} minutes`,
}))
const repeatOptions = [
  { value: '1', label: 'Non' },
  { value: '2', label: 'Pendant 2 semaines' },
  { value: '4', label: 'Pendant 4 semaines' },
  { value: '8', label: 'Pendant 8 semaines' },
]

function availabilityError(error: unknown) {
  if (error instanceof OverlappingAvailabilityError)
    return 'Cette plage chevauche une de vos disponibilités déjà publiées.'
  if (error instanceof PastDateError) return 'Choisissez une date et une heure à venir.'
  if (error instanceof EmptyAvailabilityError)
    return 'La plage est trop courte pour contenir un créneau.'
  return undefined
}

/** Le médecin publie une plage horaire ; les patients y réservent un créneau dans l'application. */
export function AddAvailabilityDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (availabilities: Availability[]) => void
}) {
  const [today] = useState(() => toDateInput(new Date()))
  const [date, setDate] = useState(today)
  const [from, setFrom] = useState('08:00')
  const [to, setTo] = useState('12:00')
  const [duration, setDuration] = useState('30')
  const [weeks, setWeeks] = useState('1')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const feedback = useFeedback()

  const valid = Boolean(date && from && to) && from < to
  const slotCount = valid
    ? slotStarts({
        startsAt: fromDateAndTime(date, from),
        endsAt: fromDateAndTime(date, to),
        slotMinutes: Number(duration),
      }).length
    : 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!valid) return setError("L'heure de fin doit être après l'heure de début.")
    setSubmitting(true)
    try {
      const created = await createAvailabilities(
        {
          startsAt: fromDateAndTime(date, from),
          endsAt: fromDateAndTime(date, to),
          slotMinutes: Number(duration),
        },
        Number(weeks),
      )
      onCreated(created)
      feedback.success(
        created.length > 1 ? 'Disponibilités publiées' : 'Disponibilité publiée',
        'Vos patients peuvent réserver ces créneaux dans l’application.',
      )
      onClose()
    } catch (caught) {
      const message = availabilityError(caught)
      if (message) setError(message)
      else
        feedback.error(
          "La disponibilité n'a pas pu être publiée",
          'Vérifiez votre connexion puis réessayez.',
        )
      setSubmitting(false)
    }
  }

  return (
    <Dialog title="Ajouter une disponibilité" size="lg" onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <fieldset disabled={submitting} className="grid min-w-0 gap-4 sm:grid-cols-3">
          <TextField
            label="Date"
            type="date"
            required
            min={today}
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setError(undefined)
            }}
          />
          <TextField
            label="De"
            type="time"
            required
            step={300}
            value={from}
            onChange={(event) => {
              setFrom(event.target.value)
              setError(undefined)
            }}
          />
          <TextField
            label="À"
            type="time"
            required
            step={300}
            value={to}
            onChange={(event) => {
              setTo(event.target.value)
              setError(undefined)
            }}
          />
          <div className="grid gap-4 sm:col-span-3 sm:grid-cols-2">
            <SelectField
              label="Durée d'un créneau"
              required
              placeholder="Choisir"
              options={durationSelectOptions}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
            <SelectField
              label="Répéter chaque semaine"
              required
              placeholder="Choisir"
              options={repeatOptions}
              value={weeks}
              onChange={(event) => setWeeks(event.target.value)}
            />
          </div>
        </fieldset>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : (
          <p className="text-sm text-muted">
            {slotCount > 0
              ? `${slotCount} créneau${slotCount > 1 ? 'x' : ''} de ${duration} minutes${
                  Number(weeks) > 1 ? `, chaque semaine pendant ${weeks} semaines` : ''
                }.`
              : 'La plage est trop courte pour contenir un créneau.'}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            Publier
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

/** Suppression d'une plage sans créneau réservé. */
export function DeleteAvailabilityDialog({
  availability,
  onClose,
  onDeleted,
}: {
  availability: Availability
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const feedback = useFeedback()

  const confirm = async () => {
    setSubmitting(true)
    try {
      await deleteAvailability(availability.id)
      onDeleted(availability.id)
      feedback.success('Disponibilité supprimée')
      onClose()
    } catch (caught) {
      if (caught instanceof AvailabilityInUseError)
        setError(
          'Des créneaux de cette plage sont réservés : refusez ou annulez d’abord ces rendez-vous.',
        )
      else
        feedback.error(
          "La disponibilité n'a pas pu être supprimée",
          'Vérifiez votre connexion puis réessayez.',
        )
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      title="Supprimer cette disponibilité ?"
      description={`${formatDayHeading(availability.startsAt)}, de ${formatTime(availability.startsAt)} à ${formatTime(availability.endsAt)}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink">Les patients ne pourront plus réserver ces créneaux.</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            Garder
          </Button>
          <Button loading={submitting} onClick={() => void confirm()}>
            Supprimer
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

interface ReasonDialogProps {
  appointment: Appointment
  kind: 'refus' | 'annulation'
  onClose: () => void
  onDone: (appointment: Appointment) => void
}

/** Refus d'une demande ou annulation d'un rendez-vous confirmé : le motif est transmis au patient. */
export function ReasonDialog({ appointment, kind, onClose, onDone }: ReasonDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const feedback = useFeedback()
  const refusing = kind === 'refus'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reason.trim()) return setError('Indiquez le motif, il sera transmis au patient.')
    setSubmitting(true)
    try {
      const updated = refusing
        ? await refuseAppointment(appointment.id, reason.trim())
        : await cancelAppointment(appointment.id, reason.trim())
      onDone(updated)
      feedback.success(
        refusing ? 'Demande refusée' : 'Rendez-vous annulé',
        'Le patient en est informé dans l’application, et le créneau redevient libre.',
      )
      onClose()
    } catch (caught) {
      feedback.error(
        refusing ? "La demande n'a pas pu être refusée" : "Le rendez-vous n'a pas pu être annulé",
        caught instanceof AppointmentStateError
          ? 'Le patient a peut-être annulé entre-temps. Rechargez la page.'
          : 'Vérifiez votre connexion puis réessayez.',
      )
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      title={refusing ? 'Refuser la demande' : 'Annuler le rendez-vous'}
      description={`${appointment.patientName}, ${formatDateTime(appointment.scheduledAt)}`}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <TextareaField
          label={refusing ? 'Motif du refus' : "Motif de l'annulation"}
          required
          maxLength={500}
          value={reason}
          error={error}
          disabled={submitting}
          hint="Par exemple, proposez au patient de réserver un autre créneau."
          onChange={(event) => {
            setReason(event.target.value)
            setError(undefined)
          }}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            Retour
          </Button>
          <Button type="submit" loading={submitting}>
            {refusing ? 'Refuser la demande' : 'Annuler le rendez-vous'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
