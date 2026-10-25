import { useState, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import { useAppointments } from '@/features/appointments/hooks/useAppointments'
import { isUpcoming } from '@/features/appointments/labels'
import { formatDateTime } from '@/utils/formatDateTime'

interface PatientAppointmentsProps {
  patientId: string
  /** N'affiche que le prochain rendez-vous à venir. */
  summary?: boolean
  /** Action placée dans l'en-tête, par exemple l'accès à tous les rendez-vous. */
  action?: ReactNode
}

/** Rendez-vous d'un patient pour son dossier : le prochain, ou tous du plus récent au plus ancien. */
export function PatientAppointments({ patientId, summary = false, action }: PatientAppointmentsProps) {
  const state = useAppointments()
  const [now] = useState(() => Date.now())

  // La liste reçue va du plus proche au plus lointain.
  const all =
    state.status === 'success'
      ? state.data.filter((appointment) => appointment.patientId === patientId)
      : []
  const appointments = summary
    ? all.filter((appointment) => isUpcoming(appointment, now)).slice(0, 1)
    : [...all].reverse()

  return (
    <Card title={summary ? 'Prochain rendez-vous' : 'Rendez-vous'} action={action}>
      {state.status === 'loading' && <ListSkeleton label="Chargement des rendez-vous…" />}
      {state.status === 'error' && (
        <Alert variant="error" title="Les rendez-vous n'ont pas pu être chargés.">
          Rechargez la page pour réessayer.
        </Alert>
      )}
      {state.status === 'success' && appointments.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          {summary ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous pour ce patient.'}
        </p>
      )}
      {appointments.length > 0 && (
        <ul className="flex flex-col gap-3">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex flex-col gap-2 rounded-2xl bg-page p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {formatDateTime(appointment.scheduledAt)}
                </p>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
              <p className="text-sm text-ink [overflow-wrap:anywhere]">{appointment.reason}</p>
              {appointment.location && (
                <p className="text-xs text-muted">{appointment.location}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
