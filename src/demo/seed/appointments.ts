import { MAIN_DOCTOR_ID } from '@/demo/seed/people'
import { at, minutesAgo } from '@/demo/time'
import type { Appointment, Availability } from '@/features/appointments/types/appointment'
import type { Patient } from '@/features/patients/types/patient'

/*
 * Disponibilités des médecins et rendez-vous réservés dans l'application mobile. Chaque rendez-vous
 * tombe sur un créneau de sa plage : début de plage + un nombre entier de créneaux.
 */

function plage(
  id: string,
  offsetDays: number,
  from: string,
  to: string,
  slotMinutes: number,
  doctorId = MAIN_DOCTOR_ID,
): Availability {
  return {
    id,
    doctorId,
    startsAt: at(offsetDays, from),
    endsAt: at(offsetDays, to),
    slotMinutes,
    createdAt: at(Math.min(offsetDays, 0) - 10, '18:00'),
  }
}

export const availabilities: Availability[] = [
  // Passées : elles portent l'historique.
  plage('dispo-p1', -7, '14:00', '16:00', 30),
  plage('dispo-p2', -4, '09:00', '11:00', 30),
  // À venir.
  plage('dispo-1', 0, '15:00', '17:00', 30),
  plage('dispo-2', 1, '08:00', '12:00', 30),
  plage('dispo-3', 2, '09:00', '12:00', 30),
  plage('dispo-4', 3, '15:00', '17:00', 20),
  plage('dispo-5', 6, '10:00', '12:00', 20),
  plage('dispo-6', 8, '08:00', '12:00', 30),
  plage('dispo-l1', 5, '08:00', '12:00', 30, 'med-lawson'),
]

type AppointmentSeed = Omit<
  Appointment,
  'patientName' | 'patientFileNumber' | 'doctorId' | 'durationMinutes'
>

const appointmentSeeds: AppointmentSeed[] = [
  {
    id: 'rdv-1',
    patientId: 'pat-akakpo',
    availabilityId: 'dispo-2',
    scheduledAt: at(1, '09:30'),
    reason: 'Contrôle de la tension après l’alerte du matin',
    status: 'demande',
    requestedAt: minutesAgo(30),
  },
  {
    id: 'rdv-2',
    patientId: 'pat-adjovi',
    availabilityId: 'dispo-3',
    scheduledAt: at(2, '10:00'),
    reason: 'Consultation de suivi trimestrielle',
    status: 'confirme',
    requestedAt: at(-14, '11:00'),
    confirmedAt: at(-14, '15:20'),
  },
  {
    id: 'rdv-3',
    patientId: 'pat-gbeassor',
    availabilityId: 'dispo-1',
    scheduledAt: at(0, '16:30'),
    reason: 'Point sur le pouls et la glycémie',
    status: 'confirme',
    requestedAt: at(-1, '19:10'),
    confirmedAt: at(-1, '19:40'),
  },
  {
    id: 'rdv-4',
    patientId: 'pat-amegah',
    availabilityId: 'dispo-5',
    scheduledAt: at(6, '11:00'),
    reason: 'Bilan des glycémies du mois',
    status: 'demande',
    requestedAt: at(-1, '08:45'),
  },
  {
    id: 'rdv-5',
    patientId: 'pat-sossou',
    availabilityId: 'dispo-4',
    scheduledAt: at(3, '15:20'),
    reason: 'Question sur les doses d’insuline du soir',
    status: 'demande',
    requestedAt: minutesAgo(140),
  },
  {
    id: 'rdv-6',
    patientId: 'pat-gbeassor',
    availabilityId: 'dispo-2',
    scheduledAt: at(1, '11:00'),
    reason: 'Renouvellement de l’ordonnance',
    status: 'confirme',
    requestedAt: at(-3, '10:05'),
    confirmedAt: at(-3, '12:30'),
  },
  {
    id: 'rdv-7',
    patientId: 'pat-sossou',
    availabilityId: 'dispo-p1',
    scheduledAt: at(-7, '14:00'),
    reason: 'Ajustement des doses d’insuline',
    status: 'realise',
    requestedAt: at(-15, '10:00'),
    confirmedAt: at(-15, '11:10'),
  },
  {
    id: 'rdv-8',
    patientId: 'pat-gbeassor',
    availabilityId: 'dispo-p2',
    scheduledAt: at(-4, '09:00'),
    reason: 'Consultation de suivi',
    status: 'annule',
    cancelledBy: 'patient',
    cancellationReason: 'Empêchement de la patiente.',
    requestedAt: at(-12, '10:00'),
    confirmedAt: at(-12, '14:00'),
  },
  {
    id: 'rdv-9',
    patientId: 'pat-amegah',
    availabilityId: 'dispo-p2',
    scheduledAt: at(-4, '10:00'),
    reason: 'Résultats de l’analyse de sang',
    status: 'refuse',
    refusalReason:
      'Résultats pas encore reçus du laboratoire : je vous propose d’en parler par message.',
    requestedAt: at(-9, '17:30'),
  },
  {
    id: 'rdv-10',
    patientId: 'pat-kpodar',
    availabilityId: 'dispo-l1',
    scheduledAt: at(5, '08:30'),
    reason: 'Suivi de l’hypertension',
    status: 'confirme',
    requestedAt: at(-9, '14:00'),
    confirmedAt: at(-8, '09:00'),
  },
]

export function buildAppointments(patients: Patient[]): Appointment[] {
  return appointmentSeeds.map((seed) => {
    const patient = patients.find((candidate) => candidate.id === seed.patientId)
    const availability = availabilities.find((candidate) => candidate.id === seed.availabilityId)
    if (!patient || !availability) throw new Error(`Rendez-vous de départ incohérent : ${seed.id}`)
    return {
      ...seed,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientFileNumber: patient.fileNumber,
      doctorId: availability.doctorId,
      durationMinutes: availability.slotMinutes,
    }
  })
}
