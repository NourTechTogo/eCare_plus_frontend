import type { Appointment, Availability } from '@/features/appointments/types/appointment'

/** Un rendez-vous demandé ou confirmé occupe son créneau ; refusé ou annulé, il le libère. */
export const holdsSlot = (appointment: Appointment) =>
  appointment.status === 'demande' || appointment.status === 'confirme'

export interface Slot {
  /** Début du créneau, au format ISO-8601. */
  start: string
  /** Rendez-vous qui occupe le créneau, s'il y en a un. */
  appointment?: Appointment
}

/** Débuts des créneaux d'une plage ; un reste trop court pour un créneau entier est ignoré. */
export function slotStarts(
  availability: Pick<Availability, 'startsAt' | 'endsAt' | 'slotMinutes'>,
) {
  const start = new Date(availability.startsAt).getTime()
  const end = new Date(availability.endsAt).getTime()
  const step = availability.slotMinutes * 60_000
  const starts: string[] = []
  for (let time = start; time + step <= end; time += step) {
    starts.push(new Date(time).toISOString())
  }
  return starts
}

/** Créneaux d'une plage, avec le rendez-vous qui occupe chacun d'eux. */
export function slotsOf(availability: Availability, appointments: Appointment[]): Slot[] {
  const held = appointments.filter(
    (appointment) => appointment.availabilityId === availability.id && holdsSlot(appointment),
  )
  return slotStarts(availability).map((start) => ({
    start,
    appointment: held.find(
      (appointment) => new Date(appointment.scheduledAt).getTime() === new Date(start).getTime(),
    ),
  }))
}
