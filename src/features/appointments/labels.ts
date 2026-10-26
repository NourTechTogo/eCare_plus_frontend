import type { Appointment, AppointmentStatus } from '@/features/appointments/types/appointment'

export const statusLabels: Record<AppointmentStatus, string> = {
  demande: 'À confirmer',
  confirme: 'Confirmé',
  refuse: 'Refusé',
  annule: 'Annulé',
  realise: 'Réalisé',
}

/** Durées de créneau proposées, en minutes. */
export const slotDurationOptions = [15, 20, 30, 45, 60]

const endOf = (appointment: Appointment) =>
  new Date(appointment.scheduledAt).getTime() + appointment.durationMinutes * 60_000

/** Rendez-vous encore attendu : demandé ou confirmé, et pas encore terminé. */
export function isUpcoming(appointment: Appointment, now: number) {
  return (
    (appointment.status === 'demande' || appointment.status === 'confirme') &&
    endOf(appointment) >= now
  )
}

/** Demande du patient en attente de la réponse du médecin, pour un créneau pas encore passé. */
export function awaitsAnswer(appointment: Appointment, now: number) {
  return appointment.status === 'demande' && new Date(appointment.scheduledAt).getTime() > now
}

/** Demande restée sans réponse jusqu'à l'heure du créneau. */
export function isExpired(appointment: Appointment, now: number) {
  return appointment.status === 'demande' && new Date(appointment.scheduledAt).getTime() <= now
}

/** Rendez-vous confirmé et commencé, qui attend d'être marqué comme réalisé (ou annulé). */
export function awaitsOutcome(appointment: Appointment, now: number) {
  return appointment.status === 'confirme' && new Date(appointment.scheduledAt).getTime() <= now
}
