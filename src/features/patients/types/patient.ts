export type Sex = 'F' | 'M' | 'A' | 'N'

export type Condition = 'diabete' | 'hypertension' | 'diabete_hypertension'

/** Informations saisies à la création d'un dossier patient. */
export interface PatientInput {
  professionalId?: string
  professionalName?: string
  password?: string
  city?: string
  country?: string
  bloodGroup?: string
  heightCm?: string
  weightKg?: string
  allergies?: string
  history?: string
  consentAccepted?: boolean
  lastName: string
  firstName: string
  sex: Sex
  /** Date au format `AAAA-MM-JJ`. */
  birthDate: string
  phone: string
  condition: Condition | ''
  email?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface Patient extends PatientInput {
  id: string
  fileNumber: string
  createdAt: string
}
