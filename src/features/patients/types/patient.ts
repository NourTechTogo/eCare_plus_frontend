export type Sex = 'F' | 'M'

export type Condition = 'diabete' | 'hypertension' | 'diabete_hypertension'

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

/**
 * Un dossier créé par l'établissement attend que le patient active son compte dans l'application
 * mobile (scénario A, étape 3) ; il devient actif une fois les CGU acceptées.
 */
export type PatientStatus = 'en_attente_activation' | 'actif'

/** Création par l'établissement (scénario A) ou auto-inscription référencée par code QR (scénario B). */
export type PatientOrigin = 'etablissement' | 'auto_inscription'

/** Informations saisies à la création d'un dossier patient (EF-W1-3, EF-W1-4, EF-W1-12). */
export interface PatientInput {
  lastName: string
  firstName: string
  sex: Sex
  /** Date au format `AAAA-MM-JJ`. */
  birthDate: string
  phone: string
  condition: Condition
  /** Médecin référent affecté par l'établissement (EF-W1-6). */
  referentDoctorId: string
  email?: string
  address?: string
  city?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  heightCm?: number
  weightKg?: number
  bloodGroup?: BloodGroup
  allergies?: string
  /** Antécédents médicaux connus. */
  history?: string
}

export interface Patient extends PatientInput {
  id: string
  fileNumber: string
  createdAt: string
  status: PatientStatus
  origin: PatientOrigin
  /** Code remis au patient pour activer son compte dans l'application mobile. */
  activationCode?: string
  /** Acceptation des CGU et du consentement, horodatée (EF-W1-2). */
  consentAcceptedAt?: string
}

/**
 * Compte créé par le patient lui-même dans l'application, en attente de référencement par
 * l'établissement grâce au code QR affiché après l'inscription (EF-W1-13, RG-W1-6).
 */
export interface PendingRegistration {
  /** Contenu du code QR : personnel, à usage unique et limité dans le temps. */
  code: string
  firstName: string
  lastName: string
  sex: Sex
  birthDate: string
  phone: string
  email?: string
  registeredAt: string
  expiresAt: string
}
