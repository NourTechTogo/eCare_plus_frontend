import { requireDoctor, visiblePatients } from '@/demo/access'
import { mutate, PlatformError, query, type Database } from '@/demo/database'
import { holdsSlot, slotStarts } from '@/features/appointments/slots'
import type {
  Appointment,
  Availability,
  AvailabilityInput,
} from '@/features/appointments/types/appointment'

/*
 * Disponibilités publiées par le médecin et rendez-vous réservés par les patients dans
 * l'application mobile. Le médecin confirme ou refuse chaque demande. Routes attendues : voir
 * docs/CONTRAT_API.md, section « Rendez-vous ».
 */

/** La plage chevauche une autre plage du médecin. */
export class OverlappingAvailabilityError extends Error {}

/** Une plage ne peut pas commencer dans le passé. */
export class PastDateError extends Error {}

/** La plage est trop courte pour contenir un seul créneau. */
export class EmptyAvailabilityError extends Error {}

/** La plage contient des créneaux réservés : il faut d'abord refuser ou annuler ces rendez-vous. */
export class AvailabilityInUseError extends Error {}

/** La demande a changé d'état entre-temps (annulée par le patient, déjà traitée…). */
export class AppointmentStateError extends Error {}

const WEEK_MS = 7 * 86_400_000

const overlaps = (a: AvailabilityInput, b: AvailabilityInput) =>
  new Date(a.startsAt).getTime() < new Date(b.endsAt).getTime() &&
  new Date(b.startsAt).getTime() < new Date(a.endsAt).getTime()

const shift = (iso: string, ms: number) => new Date(new Date(iso).getTime() + ms).toISOString()

function ownAppointment(db: Database, id: string) {
  const doctor = requireDoctor(db)
  const appointment = db.appointments.find((candidate) => candidate.id === id)
  if (!appointment || appointment.doctorId !== doctor.id)
    throw new PlatformError('Rendez-vous introuvable')
  return appointment
}

/** Plages du médecin qui ne sont pas encore terminées, de la plus proche à la plus lointaine. */
export async function listAvailabilities(): Promise<Availability[]> {
  return query((db) => {
    const doctor = requireDoctor(db)
    const now = Date.now()
    return db.availabilities
      .filter(
        (availability) =>
          availability.doctorId === doctor.id && new Date(availability.endsAt).getTime() > now,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  })
}

/**
 * Publie une plage, répétée le même jour et aux mêmes heures pendant `weeks` semaines.
 * Aucune plage n'est créée si l'une d'elles chevauche une plage existante.
 */
export async function createAvailabilities(
  input: AvailabilityInput,
  weeks = 1,
): Promise<Availability[]> {
  if (new Date(input.startsAt).getTime() < Date.now()) throw new PastDateError()
  if (slotStarts(input).length === 0) throw new EmptyAvailabilityError()
  return mutate((db) => {
    const doctor = requireDoctor(db)
    const mine = db.availabilities.filter((availability) => availability.doctorId === doctor.id)
    const created = Array.from({ length: weeks }, (_, week): Availability => ({
      ...input,
      startsAt: shift(input.startsAt, week * WEEK_MS),
      endsAt: shift(input.endsAt, week * WEEK_MS),
      id: `dispo-${crypto.randomUUID().slice(0, 8)}`,
      doctorId: doctor.id,
      createdAt: new Date().toISOString(),
    }))
    if (created.some((candidate) => mine.some((existing) => overlaps(candidate, existing)))) {
      throw new OverlappingAvailabilityError()
    }
    db.availabilities.push(...created)
    return created
  })
}

export async function deleteAvailability(id: string): Promise<void> {
  await mutate((db) => {
    const doctor = requireDoctor(db)
    const availability = db.availabilities.find((candidate) => candidate.id === id)
    if (!availability || availability.doctorId !== doctor.id)
      throw new PlatformError('Disponibilité introuvable')
    if (
      db.appointments.some(
        (appointment) => appointment.availabilityId === id && holdsSlot(appointment),
      )
    ) {
      throw new AvailabilityInUseError()
    }
    db.availabilities = db.availabilities.filter((candidate) => candidate.id !== id)
  })
}

/** Rendez-vous des patients du médecin, du plus proche au plus lointain. */
export async function listAppointments(): Promise<Appointment[]> {
  return query((db) => {
    const ids = new Set(visiblePatients(db).map((patient) => patient.id))
    return db.appointments
      .filter((appointment) => ids.has(appointment.patientId))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  })
}

/** Le patient est prévenu dans l'application que son rendez-vous est confirmé. */
export async function confirmAppointment(id: string): Promise<Appointment> {
  return mutate((db) => {
    const appointment = ownAppointment(db, id)
    if (appointment.status !== 'demande') throw new AppointmentStateError()
    appointment.status = 'confirme'
    appointment.confirmedAt = new Date().toISOString()
    return appointment
  })
}

/** Le créneau redevient libre ; le patient voit le motif et peut réserver un autre créneau. */
export async function refuseAppointment(id: string, reason: string): Promise<Appointment> {
  return mutate((db) => {
    const appointment = ownAppointment(db, id)
    if (appointment.status !== 'demande') throw new AppointmentStateError()
    appointment.status = 'refuse'
    appointment.refusalReason = reason
    return appointment
  })
}

/** Annulation d'un rendez-vous confirmé par le médecin ; le créneau redevient libre. */
export async function cancelAppointment(id: string, reason: string): Promise<Appointment> {
  return mutate((db) => {
    const appointment = ownAppointment(db, id)
    if (appointment.status !== 'confirme') throw new AppointmentStateError()
    appointment.status = 'annule'
    appointment.cancelledBy = 'medecin'
    appointment.cancellationReason = reason
    return appointment
  })
}

export async function completeAppointment(id: string): Promise<Appointment> {
  return mutate((db) => {
    const appointment = ownAppointment(db, id)
    if (appointment.status !== 'confirme') throw new AppointmentStateError()
    appointment.status = 'realise'
    return appointment
  })
}
