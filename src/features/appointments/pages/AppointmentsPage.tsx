import { Fragment, useState } from 'react'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { StatTile } from '@/components/ui/StatTile'
import { Tabs } from '@/components/ui/Tabs'
import { tabId, tabPanelId } from '@/components/ui/tabIds'
import {
  AddAvailabilityDialog,
  DeleteAvailabilityDialog,
} from '@/features/appointments/components/AppointmentDialogs'
import { AppointmentItem } from '@/features/appointments/components/AppointmentItem'
import { AvailabilityList } from '@/features/appointments/components/AvailabilityList'
import { useAppointments, useAvailabilities } from '@/features/appointments/hooks/useAppointments'
import { awaitsAnswer, awaitsOutcome, isUpcoming } from '@/features/appointments/labels'
import { slotsOf } from '@/features/appointments/slots'
import type { Appointment, Availability } from '@/features/appointments/types/appointment'
import { dayKey, formatDayHeading } from '@/utils/localDate'

const pageDescription = 'Vos disponibilités et les rendez-vous réservés par vos patients'
const WEEK_MS = 7 * 86_400_000

const count = (total: number, one: string, many: string) => `${total} ${total === 1 ? one : many}`

function DayGroups({
  appointments,
  now,
  onChange,
}: {
  appointments: Appointment[]
  now: number
  onChange: (appointment: Appointment) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {appointments.map((appointment, index) => {
        const newDay =
          index === 0 ||
          dayKey(appointments[index - 1].scheduledAt) !== dayKey(appointment.scheduledAt)
        return (
          <Fragment key={appointment.id}>
            {newDay && (
              <h3 className="-mb-3 font-display text-sm font-bold tracking-wide text-muted uppercase">
                {formatDayHeading(appointment.scheduledAt)}
              </h3>
            )}
            <ul>
              <AppointmentItem
                appointment={appointment}
                now={now}
                showPatient
                onChange={onChange}
              />
            </ul>
          </Fragment>
        )
      })}
    </div>
  )
}

const empty = (text: string) => <p className="py-8 text-center text-sm text-muted">{text}</p>

/** Agenda du médecin : demandes à traiter, rendez-vous confirmés, disponibilités et historique. */
export function AppointmentsPage() {
  const appointmentsState = useAppointments()
  const availabilitiesState = useAvailabilities()
  const [now] = useState(() => Date.now())
  // Changements faits depuis l'ouverture de l'écran.
  const [changed, setChanged] = useState<Record<string, Appointment>>({})
  const [addedAvailabilities, setAddedAvailabilities] = useState<Availability[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Availability>()
  const [active, setActive] = useState('demandes')
  const remember = (appointment: Appointment) =>
    setChanged((current) => ({ ...current, [appointment.id]: appointment }))

  const action = <Button onClick={() => setAdding(true)}>Ajouter une disponibilité</Button>

  if (appointmentsState.status !== 'success' || availabilitiesState.status !== 'success') {
    const failed = appointmentsState.status === 'error' || availabilitiesState.status === 'error'
    return (
      <Page title="Rendez-vous" description={pageDescription}>
        {failed ? (
          <Alert variant="error" title="Les rendez-vous n'ont pas pu être chargés.">
            Rechargez la page pour réessayer.
          </Alert>
        ) : (
          <PageSkeleton label="Chargement des rendez-vous…" />
        )}
      </Page>
    )
  }

  const all = appointmentsState.data
    .map((appointment) => changed[appointment.id] ?? appointment)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const availabilities = [...availabilitiesState.data, ...addedAvailabilities]
    .filter((availability) => !deletedIds.includes(availability.id))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  const requests = all.filter((appointment) => awaitsAnswer(appointment, now))
  const toClose = all.filter((appointment) => awaitsOutcome(appointment, now))
  const agenda = all.filter(
    (appointment) =>
      appointment.status === 'confirme' &&
      isUpcoming(appointment, now) &&
      !awaitsOutcome(appointment, now),
  )
  const history = all
    .filter(
      (appointment) =>
        !awaitsAnswer(appointment, now) &&
        !awaitsOutcome(appointment, now) &&
        !(appointment.status === 'confirme' && isUpcoming(appointment, now)),
    )
    .reverse()
  const today = agenda.filter(
    (appointment) => dayKey(appointment.scheduledAt) === dayKey(new Date(now).toISOString()),
  )
  const freeThisWeek = availabilities
    .filter((availability) => new Date(availability.startsAt).getTime() - now <= WEEK_MS)
    .flatMap((availability) => slotsOf(availability, all))
    .filter((slot) => !slot.appointment && new Date(slot.start).getTime() > now).length

  const tabs = [
    { id: 'demandes', label: `Demandes${requests.length ? ` (${requests.length})` : ''}` },
    { id: 'agenda', label: 'Agenda' },
    { id: 'disponibilites', label: 'Mes disponibilités' },
    { id: 'historique', label: 'Historique' },
  ]

  return (
    <Page title="Rendez-vous" description={pageDescription} action={action}>
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          tone="amber"
          label="Demandes à confirmer"
          value={count(requests.length, 'demande', 'demandes')}
          hint="Réservées par vos patients"
        />
        <StatTile
          label="Aujourd'hui"
          value={count(today.length, 'rendez-vous', 'rendez-vous')}
          hint="Rendez-vous confirmés"
        />
        <StatTile
          tone="green"
          label="Créneaux libres"
          value={count(freeThisWeek, 'créneau', 'créneaux')}
          hint="Dans les 7 prochains jours"
        />
      </div>

      <Tabs label="Rendez-vous" tabs={tabs} active={active} onChange={setActive} />
      <div
        key={active}
        id={tabPanelId(active)}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        className="flex animate-enter flex-col gap-6"
      >
        {active === 'demandes' && (
          <Card title="Demandes à confirmer">
            {requests.length === 0 ? (
              empty('Aucune demande en attente.')
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">
                  Ces créneaux ont été réservés par vos patients dans l'application. Confirmez-les,
                  ou refusez-les en indiquant un motif.
                </p>
                <DayGroups appointments={requests} now={now} onChange={remember} />
              </>
            )}
          </Card>
        )}

        {active === 'agenda' && (
          <>
            {toClose.length > 0 && (
              <Card title="À clôturer">
                <p className="mb-4 text-sm text-muted">
                  Ces rendez-vous sont passés : indiquez s'ils ont eu lieu.
                </p>
                <ul className="flex flex-col gap-3">
                  {toClose.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      now={now}
                      showPatient
                      onChange={remember}
                    />
                  ))}
                </ul>
              </Card>
            )}
            <Card title="Rendez-vous confirmés">
              {agenda.length === 0 ? (
                empty('Aucun rendez-vous confirmé à venir.')
              ) : (
                <DayGroups appointments={agenda} now={now} onChange={remember} />
              )}
            </Card>
          </>
        )}

        {active === 'disponibilites' && (
          <Card title="Mes disponibilités" action={action}>
            {availabilities.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <p className="text-sm text-muted">
                  Aucune disponibilité publiée : vos patients ne peuvent pas réserver de
                  rendez-vous.
                </p>
                {action}
              </div>
            ) : (
              <AvailabilityList
                availabilities={availabilities}
                appointments={all}
                onDelete={setDeleting}
              />
            )}
          </Card>
        )}

        {active === 'historique' && (
          <Card title="Historique">
            {history.length === 0 ? (
              empty('Aucun rendez-vous passé.')
            ) : (
              <ul className="flex flex-col gap-3">
                {history.map((appointment) => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                    now={now}
                    showPatient
                    onChange={remember}
                  />
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {adding && (
        <AddAvailabilityDialog
          onClose={() => setAdding(false)}
          onCreated={(created) => {
            setAddedAvailabilities((current) => [...current, ...created])
            setActive('disponibilites')
          }}
        />
      )}
      {deleting && (
        <DeleteAvailabilityDialog
          availability={deleting}
          onClose={() => setDeleting(undefined)}
          onDeleted={(id) => setDeletedIds((current) => [...current, id])}
        />
      )}
    </Page>
  )
}
