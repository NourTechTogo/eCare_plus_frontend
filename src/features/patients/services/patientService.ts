import { requirePersonnel, visiblePatients } from '@/demo/access'
import { mutate, PlatformError, query, type Database } from '@/demo/database'
import type {
  Condition,
  Patient,
  PatientInput,
  PendingRegistration,
} from '@/features/patients/types/patient'

/*
 * Dossiers patients, sur la base locale. Routes attendues du backend : voir docs/CONTRAT_API.md
 * (GET|POST /patients, GET|PATCH /patients/{id}, GET /patients/inscriptions/{code},
 * POST /patients/inscriptions/{code}/referencement).
 */

/** Un dossier au même nom, prénom et date de naissance existe déjà. */
export class DuplicatePatientError extends Error {}

/** Code QR inconnu, déjà utilisé ou expiré (RG-W1-6). */
export class InvalidRegistrationCodeError extends Error {}

function nextFileNumber(db: Database) {
  db.lastFileNumber += 1
  return `ECP-${String(db.lastFileNumber).padStart(5, '0')}`
}

/** Code remis au patient pour activer son compte dans l'application, par exemple « 4827-6195 ». */
function activationCode() {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(8)), (value) => value % 10).join(
    '',
  )
  return `${digits.slice(0, 4)}-${digits.slice(4)}`
}

const sameIdentity = (
  patient: Patient,
  input: Pick<PatientInput, 'lastName' | 'firstName' | 'birthDate'>,
) =>
  patient.lastName.trim().toLowerCase() === input.lastName.trim().toLowerCase() &&
  patient.firstName.trim().toLowerCase() === input.firstName.trim().toLowerCase() &&
  patient.birthDate === input.birthDate

export async function listPatients(): Promise<Patient[]> {
  return query((db) =>
    [...visiblePatients(db)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  return query((db) => visiblePatients(db).find((patient) => patient.id === id))
}

/** Création du compte et du dossier par l'établissement, avec le médecin référent (EF-W1-12). */
export async function createPatient(input: PatientInput): Promise<Patient> {
  const patient = await mutate((db) => {
    requirePersonnel(db)
    if (db.patients.some((existing) => sameIdentity(existing, input))) return null
    const created: Patient = {
      ...input,
      id: `pat-${crypto.randomUUID().slice(0, 8)}`,
      fileNumber: nextFileNumber(db),
      createdAt: new Date().toISOString(),
      status: 'en_attente_activation',
      origin: 'etablissement',
      activationCode: activationCode(),
    }
    db.patients.push(created)
    return created
  })
  if (!patient) throw new DuplicatePatientError()
  return patient
}

export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  return mutate((db) => {
    requirePersonnel(db)
    const index = db.patients.findIndex((patient) => patient.id === id)
    if (index === -1) throw new PlatformError('Dossier patient introuvable')
    // Numéro de dossier, statut et origine ne dépendent pas du formulaire.
    const patient: Patient = { ...db.patients[index], ...input }
    db.patients[index] = patient
    return patient
  })
}

/** Compte en attente de référencement correspondant au code QR, s'il est encore valable. */
export async function findRegistration(code: string): Promise<PendingRegistration> {
  const registration = await query((db) =>
    db.pendingRegistrations.find(
      (candidate) =>
        candidate.code === code.trim().toUpperCase() &&
        new Date(candidate.expiresAt).getTime() > Date.now(),
    ),
  )
  if (!registration) throw new InvalidRegistrationCodeError()
  return registration
}

/**
 * Référencement d'un compte créé dans l'application (scénario B) : l'établissement complète le
 * dossier et affecte le médecin référent ; le code QR ne peut plus être réutilisé.
 */
export async function referenceRegistration(
  code: string,
  details: { condition: Condition; referentDoctorId: string },
): Promise<Patient> {
  const patient = await mutate((db) => {
    requirePersonnel(db)
    const index = db.pendingRegistrations.findIndex((candidate) => candidate.code === code)
    const registration = db.pendingRegistrations[index]
    if (!registration || new Date(registration.expiresAt).getTime() <= Date.now()) return null
    const created: Patient = {
      id: `pat-${crypto.randomUUID().slice(0, 8)}`,
      fileNumber: nextFileNumber(db),
      firstName: registration.firstName,
      lastName: registration.lastName,
      sex: registration.sex,
      birthDate: registration.birthDate,
      phone: registration.phone,
      email: registration.email,
      condition: details.condition,
      referentDoctorId: details.referentDoctorId,
      createdAt: new Date().toISOString(),
      status: 'actif',
      origin: 'auto_inscription',
      // Les CGU ont été acceptées dans l'application lors de l'inscription.
      consentAcceptedAt: registration.registeredAt,
    }
    db.patients.push(created)
    db.pendingRegistrations.splice(index, 1)
    return created
  })
  if (!patient) throw new InvalidRegistrationCodeError()
  return patient
}
