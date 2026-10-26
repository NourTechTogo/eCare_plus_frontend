import { useState, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { AppointmentItem } from '@/features/appointments/components/AppointmentItem'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import { useAppointments } from '@/features/appointments/hooks/useAppointments'
import { isUpcoming } from '@/features/appointments/labels'
import type { Appointment } from '@/features/appointments/types/appointment'
import { formatDateTime } from '@/utils/formatDateTime'

interface PatientAppointmentsProps {
  patientId: string
  /** N'affiche que le prochain rendez-vous à venir. */
  summary?: boolean
  /** Action placée dans l'en-tête du résumé, par exemple l'accès à tous les rendez-vous. */
  action?: ReactNode
}

/** Rendez-vous réservés par un patient, dans son dossier : le prochain, ou tous. */
export function PatientAppointments({
  patientId,
  summary = false,
  action,
}: PatientAppointmentsProps) {
  const state = useAppointments()
  const [now] = useState(() => Date.now())
  const [changed, setChanged] = useState<Record<string, Appointment>>({})
  const remember = (appointment: Appointment) =>
    setChanged((current) => ({ ...current, [appointment.id]: appointment }))

  const all = (state.status === 'success' ? state.data : [])
    .map((appointment) => changed[appointment.id] ?? appointment)
    .filter((appointment) => appointment.patientId === patientId)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const upcoming = all.filter((appointment) => isUpcoming(appointment, now))
  const past = all.filter((appointment) => !isUpcoming(appointment, now)).reverse()

  const body =
    state.status === 'loading' ? (
      <ListSkeleton label="Chargement des rendez-vous…" />
    ) : state.status === 'error' ? (
      <Alert variant="error" title="Les rendez-vous n'ont pas pu être chargés.">
        Rechargez la page pour réessayer.
      </Alert>
    ) : null

  if (summary) {
    const next = upcoming[0]
    return (
      <Card title="Prochain rendez-vous" action={action}>
        {body ??
          (next ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-page p-4">
              <p className="text-sm font-semibold text-ink">{formatDateTime(next.scheduledAt)}</p>
              <p className="text-sm text-ink">{next.reason}</p>
              <div className="flex flex-wrap gap-2">
                <AppointmentStatusBadge status={next.status} />
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted">
              Aucun rendez-vous à venir. Le patient réserve ses créneaux dans l'application.
            </p>
          ))}
      </Card>
    )
  }

  return (
    <>
      <Card title="Rendez-vous à venir">
        {body ??
          (upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Aucun rendez-vous à venir. Le patient réserve ses créneaux dans l'application, parmi
              vos disponibilités.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((appointment) => (
                <AppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                  now={now}
                  onChange={remember}
                />
              ))}
            </ul>
          ))}
      </Card>
      {past.length > 0 && (
        <Card title="Rendez-vous passés">
          <ul className="flex flex-col gap-3">
            {past.map((appointment) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                now={now}
                onChange={remember}
              />
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
