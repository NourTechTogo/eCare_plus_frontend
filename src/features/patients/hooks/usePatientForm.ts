import { useState } from 'react'
import type { BloodGroup, Condition, PatientInput, Sex } from '@/features/patients/types/patient'

export type PatientFormField =
  | 'lastName'
  | 'firstName'
  | 'sex'
  | 'birthDate'
  | 'phone'
  | 'email'
  | 'address'
  | 'city'
  | 'condition'
  | 'referentDoctorId'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'heightCm'
  | 'weightKg'
  | 'bloodGroup'
  | 'allergies'
  | 'history'

export type PatientFormValues = Record<PatientFormField, string>
export type PatientFormErrors = Partial<Record<PatientFormField, string>>

/** Ordre d'affichage des champs, utilisé pour placer le focus sur la première erreur. */
export const patientFormFields: PatientFormField[] = [
  'lastName',
  'firstName',
  'sex',
  'birthDate',
  'phone',
  'email',
  'address',
  'city',
  'condition',
  'referentDoctorId',
  'emergencyContactName',
  'emergencyContactPhone',
  'heightCm',
  'weightKg',
  'bloodGroup',
  'allergies',
  'history',
]

const emptyValues: PatientFormValues = {
  lastName: '',
  firstName: '',
  sex: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  condition: '',
  referentDoctorId: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  heightCm: '',
  weightKg: '',
  bloodGroup: '',
  allergies: '',
  history: '',
}

export const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const MAX_AGE_YEARS = 120
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s]+$/

export function todayIsoDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function isSex(value: string): value is Sex {
  return value === 'F' || value === 'M'
}

function isCondition(value: string): value is Condition {
  return value === 'diabete' || value === 'hypertension' || value === 'diabete_hypertension'
}

function isBloodGroup(value: string): value is BloodGroup {
  return (bloodGroups as string[]).includes(value)
}

/** Valeur numérique facultative, comprise entre `min` et `max`. */
function validateRange(value: string, min: number, max: number, unit: string) {
  if (!value) return undefined
  const number = Number(value.replace(',', '.'))
  if (Number.isNaN(number) || number < min || number > max) {
    return `Saisissez une valeur entre ${min} et ${max} ${unit}.`
  }
  return undefined
}

function validatePhone(value: string) {
  const digits = value.replace(/\D/g, '').length
  if (!PHONE_PATTERN.test(value) || digits < 8 || digits > 15) {
    return 'Saisissez un numéro valide, par exemple +228 90 00 00 00.'
  }
  return undefined
}

function validateName(value: string, emptyMessage: string) {
  if (!value) return emptyMessage
  if (value.length < 2) return 'Saisissez au moins 2 caractères.'
  return undefined
}

function validateBirthDate(value: string) {
  if (!value) return 'Saisissez la date de naissance.'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Saisissez une date de naissance valide.'
  if (value > todayIsoDate()) return 'La date de naissance ne peut pas être dans le futur.'
  if (date.getFullYear() < new Date().getFullYear() - MAX_AGE_YEARS) {
    return "Vérifiez l'année de naissance."
  }
  return undefined
}

function validateField(field: PatientFormField, rawValue: string): string | undefined {
  const value = rawValue.trim()
  switch (field) {
    case 'lastName':
      return validateName(value, 'Saisissez le nom du patient.')
    case 'firstName':
      return validateName(value, 'Saisissez le ou les prénoms du patient.')
    case 'sex':
      return isSex(value) ? undefined : 'Sélectionnez le sexe du patient.'
    case 'birthDate':
      return validateBirthDate(value)
    case 'phone':
      return value ? validatePhone(value) : 'Saisissez le numéro de téléphone du patient.'
    case 'email':
      return value && !EMAIL_PATTERN.test(value)
        ? 'Saisissez une adresse e-mail valide, par exemple nom@exemple.com.'
        : undefined
    case 'condition':
      return isCondition(value) ? undefined : 'Sélectionnez la pathologie suivie.'
    case 'referentDoctorId':
      return value ? undefined : 'Choisissez le médecin référent du patient.'
    // Le contact d'urgence fait partie de l'identité minimale obligatoire (RG-W1-3).
    case 'emergencyContactName':
      return validateName(value, 'Saisissez le nom de la personne à prévenir.')
    case 'emergencyContactPhone':
      return value ? validatePhone(value) : 'Saisissez le téléphone de la personne à prévenir.'
    case 'heightCm':
      return validateRange(value, 50, 250, 'cm')
    case 'weightKg':
      return validateRange(value, 2, 300, 'kg')
    case 'bloodGroup':
      return value && !isBloodGroup(value) ? 'Sélectionnez un groupe sanguin.' : undefined
    case 'address':
    case 'city':
    case 'allergies':
    case 'history':
      return undefined
  }
}

function validateAll(values: PatientFormValues): PatientFormErrors {
  const errors: PatientFormErrors = {}
  for (const field of patientFormFields) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  return errors
}

function toPatientInput(values: PatientFormValues): PatientInput | null {
  const sex = values.sex
  const condition = values.condition
  if (!isSex(sex) || !isCondition(condition)) return null

  const optional = (value: string) => value.trim() || undefined
  const number = (value: string) => (value.trim() ? Number(value.replace(',', '.')) : undefined)
  const bloodGroup = values.bloodGroup
  return {
    lastName: values.lastName.trim(),
    firstName: values.firstName.trim(),
    sex,
    birthDate: values.birthDate,
    phone: values.phone.trim(),
    condition,
    referentDoctorId: values.referentDoctorId,
    email: optional(values.email),
    address: optional(values.address),
    city: optional(values.city),
    emergencyContactName: optional(values.emergencyContactName),
    emergencyContactPhone: optional(values.emergencyContactPhone),
    heightCm: number(values.heightCm),
    weightKg: number(values.weightKg),
    bloodGroup: isBloodGroup(bloodGroup) ? bloodGroup : undefined,
    allergies: optional(values.allergies),
    history: optional(values.history),
  }
}

function toFormValues(patient: PatientInput): PatientFormValues {
  return {
    lastName: patient.lastName,
    firstName: patient.firstName,
    sex: patient.sex,
    birthDate: patient.birthDate,
    phone: patient.phone,
    email: patient.email ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    condition: patient.condition,
    referentDoctorId: patient.referentDoctorId,
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
    heightCm: patient.heightCm === undefined ? '' : String(patient.heightCm),
    weightKg: patient.weightKg === undefined ? '' : String(patient.weightKg),
    bloodGroup: patient.bloodGroup ?? '',
    allergies: patient.allergies ?? '',
    history: patient.history ?? '',
  }
}

/** Sans patient initial, le formulaire démarre vide (création) ; sinon il est prérempli (modification). */
export function usePatientForm(initialPatient?: PatientInput) {
  const [initialValues] = useState<PatientFormValues>(() =>
    initialPatient ? toFormValues(initialPatient) : emptyValues,
  )
  const [values, setValues] = useState<PatientFormValues>(initialValues)
  const [errors, setErrors] = useState<PatientFormErrors>({})

  const setFieldError = (field: PatientFormField, error: string | undefined) => {
    setErrors((current) => {
      const next = { ...current }
      if (error) next[field] = error
      else delete next[field]
      return next
    })
  }

  const setValue = (field: PatientFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    // Une erreur déjà affichée est réévaluée à la saisie pour disparaître dès qu'elle est corrigée.
    if (errors[field]) setFieldError(field, validateField(field, value))
  }

  const validateOnBlur = (field: PatientFormField) => {
    setFieldError(field, validateField(field, values[field]))
  }

  /** Valide tout le formulaire. Retourne les données prêtes à envoyer, ou les erreurs. */
  const submit = (): { input: PatientInput } | { errors: PatientFormErrors } => {
    const nextErrors = validateAll(values)
    setErrors(nextErrors)
    const input = Object.keys(nextErrors).length === 0 ? toPatientInput(values) : null
    return input ? { input } : { errors: nextErrors }
  }

  const isDirty = patientFormFields.some((field) => values[field] !== initialValues[field])

  return { values, errors, isDirty, setValue, validateOnBlur, submit }
}
