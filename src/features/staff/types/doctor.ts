/** Un compte désactivé ne peut plus se connecter ; son historique est conservé. */
export type AccountStatus = 'actif' | 'desactive'

/** Informations saisies par l'établissement à la création du compte d'un médecin. */
export interface DoctorInput {
  lastName: string
  firstName: string
  email: string
  phone?: string
  /** Spécialité, utilisée pour affecter un médecin selon la pathologie du patient (EF-W1-6). */
  specialty: string
}

export interface Doctor extends DoctorInput {
  id: string
  status: AccountStatus
  createdAt: string
  /** Patients dont il est le médecin référent. */
  patientCount: number
}
