import { useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ReasonDialog } from '@/features/appointments/components/AppointmentDialogs'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import { awaitsAnswer, awaitsOutcome, isExpired, isUpcoming } from '@/features/appointments/labels'
import {
  AppointmentStateError,
  completeAppointment,
  confirmAppointment,
} from '@/features/appointments/services/appointmentService'
import type { Appointment } from '@/features/appointments/types/appointment'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDateTime } from '@/utils/formatDateTime'
import { formatTime } from '@/utils/localDate'

interface AppointmentItemProps {
  appointment: Appointment
  now: number
  /** Affiche le patient et le lien vers son dossier (agenda) plutôt que la date complète. */
  showPatient?: boolean
  onChange: (appointment: Appointment) => void
}

/**
 * Un rendez-vous et les actions du médecin : confirmer ou refuser une demande, annuler un
 * rendez-vous confirmé, puis le marquer comme réalisé une fois passé.
 */
export function AppointmentItem({
  appointment,
  now,
  showPatient = false,
  onChange,
}: AppointmentItemProps) {
  const [dialog, setDialog] = useState<'refus' | 'annulation' | null>(null)
  const [busy, setBusy] = useState(false)
  const feedback = useFeedback()
  const end = new Date(
    new Date(appointment.scheduledAt).getTime() + appointment.durationMinutes * 60_000,
  )
  const pendingAnswer = awaitsAnswer(appointment, now)
  const pendingOutcome = awaitsOutcome(appointment, now)
  const cancellable = appointment.status === 'confirme' && isUpcoming(appointment, now)

  const run = async (action: () => Promise<Appointment>, success: string, detail?: string) => {
    setBusy(true)
    try {
      onChange(await action())
      feedback.success(success, detail)
    } catch (error) {
      feedback.error(
        "Le rendez-vous n'a pas pu être mis à jour",
        error instanceof AppointmentStateError
          ? 'Le patient a peut-être annulé entre-temps. Rechargez la page.'
          : 'Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-5">
      <div className={`flex shrink-0 flex-col ${showPatient ? 'sm:w-32' : 'sm:w-52'}`}>
        <p className="font-display text-lg font-bold text-ink tabular-nums">
          {showPatient
            ? formatTime(appointment.scheduledAt)
            : formatDateTime(appointment.scheduledAt)}
        </p>
        <p className="text-xs text-muted">
          {showPatient
            ? `jusqu'à ${formatTime(end.toISOString())}`
            : `${appointment.durationMinutes} minutes`}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {showPatient && (
          <Link
            to={`/patients/${appointment.patientId}`}
            className="self-start font-semibold text-ink underline-offset-2 hover:text-primary-strong hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {appointment.patientName}
            <span className="font-normal text-muted"> · n° {appointment.patientFileNumber}</span>
          </Link>
        )}
        <p className="text-sm text-ink">
          <span className="text-muted">Motif du patient : </span>
          {appointment.reason}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {isExpired(appointment, now) ? (
            <Badge tone="red">Sans réponse</Badge>
          ) : (
            <AppointmentStatusBadge status={appointment.status} />
          )}
        </div>
        {appointment.status === 'demande' && (
          <p className="text-xs text-muted">Demandé le {formatDateTime(appointment.requestedAt)}</p>
        )}
        {appointment.refusalReason && (
          <p className="text-xs text-muted">Motif du refus : {appointment.refusalReason}</p>
        )}
        {appointment.cancellationReason && (
          <p className="text-xs text-muted">
            {appointment.cancelledBy === 'patient' ? 'Annulé par le patient' : 'Annulé par vous'} :{' '}
            {appointment.cancellationReason}
          </p>
        )}
      </div>

      {(pendingAnswer || pendingOutcome || cancellable) && (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {pendingAnswer && (
            <>
              <Button
                size="sm"
                loading={busy}
                onClick={() =>
                  void run(
                    () => confirmAppointment(appointment.id),
                    'Rendez-vous confirmé',
                    'Le patient en est informé dans l’application.',
                  )
                }
              >
                Confirmer
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => setDialog('refus')}
              >
                Refuser
              </Button>
            </>
          )}
          {pendingOutcome && (
            <Button
              size="sm"
              loading={busy}
              onClick={() =>
                void run(
                  () => completeAppointment(appointment.id),
                  'Rendez-vous marqué comme réalisé',
                )
              }
            >
              Marquer réalisé
            </Button>
          )}
          {(cancellable || pendingOutcome) && (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setDialog('annulation')}
            >
              Annuler
            </Button>
          )}
        </div>
      )}

      {dialog && (
        <ReasonDialog
          appointment={appointment}
          kind={dialog}
          onClose={() => setDialog(null)}
          onDone={onChange}
        />
      )}
    </li>
  )
}
