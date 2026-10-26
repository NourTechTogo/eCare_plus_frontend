import { Fragment } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { trashIconPath } from '@/components/ui/icons'
import { slotsOf, type Slot } from '@/features/appointments/slots'
import type { Appointment, Availability } from '@/features/appointments/types/appointment'
import { dayKey, formatDayHeading, formatTime } from '@/utils/localDate'

const slotClassNames = {
  libre: 'border-success-line bg-success-soft text-success',
  demande: 'border-warning-line bg-warning-soft text-warning',
  confirme: 'border-primary bg-primary-soft text-primary-strong',
} as const

function slotState(slot: Slot) {
  if (!slot.appointment) return 'libre'
  return slot.appointment.status === 'demande' ? 'demande' : 'confirme'
}

function SlotChip({ slot }: { slot: Slot }) {
  const state = slotState(slot)
  const label =
    state === 'libre'
      ? `${formatTime(slot.start)}, libre`
      : `${formatTime(slot.start)}, ${state === 'demande' ? 'demandé' : 'réservé'} par ${slot.appointment?.patientName}`
  return (
    <li
      title={label}
      aria-label={label}
      className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${slotClassNames[state]}`}
    >
      {formatTime(slot.start)}
    </li>
  )
}

interface AvailabilityListProps {
  availabilities: Availability[]
  appointments: Appointment[]
  onDelete: (availability: Availability) => void
}

/** Plages publiées, groupées par jour, avec l'état de chacun de leurs créneaux. */
export function AvailabilityList({
  availabilities,
  appointments,
  onDelete,
}: AvailabilityListProps) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap gap-4 text-xs text-muted" aria-label="Légende des créneaux">
        <li className="flex items-center gap-2">
          <span className={`size-3 rounded-full border ${slotClassNames.libre}`} /> Libre
        </li>
        <li className="flex items-center gap-2">
          <span className={`size-3 rounded-full border ${slotClassNames.demande}`} /> Demande à
          confirmer
        </li>
        <li className="flex items-center gap-2">
          <span className={`size-3 rounded-full border ${slotClassNames.confirme}`} /> Réservé
        </li>
      </ul>
      {availabilities.map((availability, index) => {
        const slots = slotsOf(availability, appointments)
        const free = slots.filter((slot) => !slot.appointment).length
        const newDay =
          index === 0 ||
          dayKey(availabilities[index - 1].startsAt) !== dayKey(availability.startsAt)
        return (
          <Fragment key={availability.id}>
            {newDay && (
              <h3 className="-mb-3 font-display text-sm font-bold tracking-wide text-muted uppercase">
                {formatDayHeading(availability.startsAt)}
              </h3>
            )}
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="font-display text-base font-bold text-ink tabular-nums">
                  {formatTime(availability.startsAt)} – {formatTime(availability.endsAt)}
                </p>
                <span className="text-xs text-muted">
                  Créneaux de {availability.slotMinutes} min
                </span>
                <span className="text-xs font-semibold text-muted sm:ml-auto">
                  {free === 0
                    ? 'Complet'
                    : `${free} libre${free > 1 ? 's' : ''} sur ${slots.length}`}
                </span>
                <IconButton
                  label={`Supprimer la disponibilité de ${formatTime(availability.startsAt)} à ${formatTime(availability.endsAt)}`}
                  iconPath={trashIconPath}
                  tone="danger"
                  onClick={() => onDelete(availability)}
                />
              </div>
              <ul className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <SlotChip key={slot.start} slot={slot} />
                ))}
              </ul>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
