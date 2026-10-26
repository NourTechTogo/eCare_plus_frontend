export type DrugForm = 'comprime' | 'gelule' | 'sirop' | 'injection' | 'sachet' | 'autre'

export type TreatmentStatus = 'en_cours' | 'termine'

/** Traitement saisi par le médecin (EF-W2-20, EF-W2-25). */
export interface TreatmentInput {
  drugName: string
  /** Dose par prise, par exemple « 500 mg » ou « 10 unités ». */
  dosage: string
  form: DrugForm
  /** Heures de prise, au format `HH:MM`, qui déclenchent les rappels du patient. */
  times: string[]
  /** Date au format `AAAA-MM-JJ`. */
  startDate: string
  endDate?: string
  instructions?: string
}

export interface Treatment extends TreatmentInput {
  id: string
  patientId: string
  status: TreatmentStatus
  prescribedBy: string
  createdAt: string
  updatedAt: string
}

/** Réponse du patient au rappel, ou absence de réponse dans le délai (EF-W2-22, EF-W2-23). */
export type IntakeStatus = 'pris' | 'reporte' | 'ignore' | 'non_confirme'

export interface Intake {
  id: string
  treatmentId: string
  patientId: string
  scheduledAt: string
  status: IntakeStatus
  /** Moment de la réponse du patient. */
  answeredAt?: string
}
