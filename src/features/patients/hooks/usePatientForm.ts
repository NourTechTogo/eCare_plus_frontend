import { useState } from 'react'
import type { Condition, PatientInput, Sex } from '@/features/patients/types/patient'

export type PatientFormField =
  | 'professionalId'
  | 'password'
  | 'city'
  | 'country'
  | 'bloodGroup'
  | 'heightCm'
  | 'weightKg'
  | 'allergies'
  | 'history'
  | 'lastName'
  | 'firstName'
  | 'sex'
  | 'birthDate'
  | 'phone'
  | 'email'
  | 'address'
  | 'condition'
  | 'emergencyContactName'
  | 'emergencyContactPhone'

export type PatientFormValues = Record<PatientFormField, string>
export type PatientFormErrors = Partial<Record<PatientFormField, string>>

/** Ordre d'affichage des champs, utilisé pour placer le focus sur la première erreur. */
export const patientFormFields: PatientFormField[] = [
  'professionalId',
  'password',
  'city',
  'country',
  'bloodGroup',
  'heightCm',
  'weightKg',
  'allergies',
  'history',
  'lastName',
  'firstName',
  'sex',
  'birthDate',
  'phone',
  'email',
  'address',
  'condition',
  'emergencyContactName',
  'emergencyContactPhone',
]

const emptyValues: PatientFormValues = {
  professionalId: '',
  password: '',
  city: '',
  country: '',
  bloodGroup: '',
  heightCm: '',
  weightKg: '',
  allergies: '',
  history: '',
  lastName: '',
  firstName: '',
  sex: 'N',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  condition: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
}

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
  return value === 'F' || value === 'M' || value === 'A' || value === 'N'
}

function isCondition(value: string): value is Condition | '' {
  return value === '' || value === 'diabete' || value === 'hypertension' || value === 'diabete_hypertension'
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
    case 'professionalId': return value ? undefined : 'Sélectionnez le médecin référent.'
    case 'password': return undefined
    case 'heightCm':
    case 'weightKg': return value && (!Number.isFinite(Number(value)) || Number(value) <= 0) ? 'Saisissez une valeur positive.' : undefined
    case 'city':
    case 'country':
    case 'bloodGroup':
    case 'allergies':
    case 'history': return undefined
    case 'lastName':
      return validateName(value, 'Saisissez le nom du patient.')
    case 'firstName':
      return validateName(value, 'Saisissez le ou les prénoms du patient.')
    case 'sex':
      return isSex(value) ? undefined : 'Sélectionnez le sexe du patient.'
    case 'birthDate':
      return validateBirthDate(value)
    case 'phone':
      return value ? validatePhone(value) : undefined
    case 'email':
      return value && !EMAIL_PATTERN.test(value)
        ? 'Saisissez une adresse e-mail valide, par exemple nom@exemple.com.'
        : undefined
    case 'condition':
      return isCondition(value) ? undefined : 'Sélectionnez la pathologie suivie.'
    case 'emergencyContactPhone':
      return value ? validatePhone(value) : 'Saisissez le numéro de la personne à prévenir.'
    case 'emergencyContactName': return validateName(value, 'Saisissez la personne à prévenir.')
    case 'address': return undefined
  }
}

export function validatePatientValues(values: PatientFormValues, creating: boolean): PatientFormErrors {
  const errors: PatientFormErrors = {}
  for (const field of patientFormFields) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  if (!values.phone.trim() && !values.email.trim()) errors.phone = 'Renseignez un téléphone ou un e-mail pour la connexion du patient.'
  if (creating && (values.password.length < 12 || new TextEncoder().encode(values.password).length > 72 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))) errors.password = 'De 12 caractères à 72 octets, avec une lettre et un chiffre.'
  return errors
}

function toPatientInput(values: PatientFormValues): PatientInput | null {
  const sex = values.sex
  const condition = values.condition
  if (!isSex(sex) || !isCondition(condition)) return null

  const optional = (value: string) => value.trim() || undefined
  return {
    professionalId: optional(values.professionalId),
    password: values.password || undefined,
    city: optional(values.city),
    country: optional(values.country),
    bloodGroup: optional(values.bloodGroup),
    heightCm: optional(values.heightCm),
    weightKg: optional(values.weightKg),
    allergies: optional(values.allergies),
    history: optional(values.history),
    lastName: values.lastName.trim(),
    firstName: values.firstName.trim(),
    sex,
    birthDate: values.birthDate,
    phone: values.phone.trim(),
    condition,
    email: optional(values.email),
    address: optional(values.address),
    emergencyContactName: optional(values.emergencyContactName),
    emergencyContactPhone: optional(values.emergencyContactPhone),
  }
}

function toFormValues(patient: PatientInput): PatientFormValues {
  return {
    professionalId: patient.professionalId ?? '',
    password: patient.password ?? '',
    city: patient.city ?? '',
    country: patient.country ?? '',
    bloodGroup: patient.bloodGroup ?? '',
    heightCm: patient.heightCm ?? '',
    weightKg: patient.weightKg ?? '',
    allergies: patient.allergies ?? '',
    history: patient.history ?? '',
    lastName: patient.lastName,
    firstName: patient.firstName,
    sex: patient.sex,
    birthDate: patient.birthDate,
    phone: patient.phone,
    email: patient.email ?? '',
    address: patient.address ?? '',
    condition: patient.condition,
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
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
    const nextErrors = validatePatientValues(values, !initialPatient)
    setErrors(nextErrors)
    const input = Object.keys(nextErrors).length === 0 ? toPatientInput(values) : null
    return input ? { input } : { errors: nextErrors }
  }

  const isDirty = patientFormFields.some((field) => values[field] !== initialValues[field])

  return { values, errors, isDirty, setValue, validateOnBlur, submit }
}
