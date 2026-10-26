/*
 * Prise de rendez-vous (décision d'équipe) :
 * 1. le médecin publie ses plages de disponibilité, découpées en créneaux ;
 * 2. le patient réserve un créneau libre dans l'application mobile (statut « demandé ») ;
 * 3. le médecin confirme ou refuse la demande ; il peut ensuite annuler un rendez-vous confirmé, puis
 *    le marquer comme réalisé une fois passé.
 */

export type AppointmentStatus = 'demande' | 'confirme' | 'refuse' | 'annule' | 'realise'

/** Plage saisie par le médecin. */
export interface AvailabilityInput {
  /** Début de la plage, au format ISO-8601. */
  startsAt: string
  /** Fin de la plage, au format ISO-8601. */
  endsAt: string
  /** Durée de chaque créneau réservable, en minutes. */
  slotMinutes: number
}

/** Plage de disponibilité publiée : les patients y réservent des créneaux. */
export interface Availability extends AvailabilityInput {
  id: string
  doctorId: string
  createdAt: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientFileNumber: string
  doctorId: string
  /** Plage dans laquelle le créneau a été réservé. */
  availabilityId: string
  /** Début du créneau réservé, au format ISO-8601. */
  scheduledAt: string
  durationMinutes: number
  /** Motif saisi par le patient à la réservation. */
  reason: string
  status: AppointmentStatus
  /** Réservation par le patient. */
  requestedAt: string
  confirmedAt?: string
  /** Motif donné par le médecin quand il refuse la demande. */
  refusalReason?: string
  cancelledBy?: 'patient' | 'medecin'
  cancellationReason?: string
}
