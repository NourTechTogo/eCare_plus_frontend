import { requireAdmin } from '@/demo/access'
import { mutate, PlatformError, query, type Database, type StaffAccount } from '@/demo/database'
import { currentAccount } from '@/demo/session'
import type { AccountStatus, Doctor, DoctorInput } from '@/features/staff/types/doctor'
import type { StaffMember, StaffMemberInput } from '@/features/staff/types/staffMember'

/*
 * Comptes des médecins et du personnel de l'établissement, gérés par l'administrateur (CDC §1.6.1 :
 * création, validation, désactivation). Le personnel lit la liste des médecins pour affecter un
 * médecin référent. Routes attendues : voir docs/CONTRAT_API.md, section « Comptes ».
 */

/** Une adresse e-mail ne peut correspondre qu'à un seul compte (RG-W1-1). */
export class DuplicateEmailError extends Error {}

function toDoctor(account: StaffAccount, db: Database): Doctor {
  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    phone: account.phone,
    specialty: account.specialty ?? '',
    status: account.status,
    createdAt: account.createdAt,
    patientCount: db.patients.filter((patient) => patient.referentDoctorId === account.id).length,
  }
}

const doctorsOf = (db: Database) => db.accounts.filter((account) => account.role === 'medecin')

/** Médecins de l'établissement, actifs d'abord, puis par ordre alphabétique. */
export async function listDoctors(): Promise<Doctor[]> {
  return query((db) => {
    currentAccount(db)
    return doctorsOf(db)
      .map((account) => toDoctor(account, db))
      .sort(
        (a, b) =>
          Number(a.status !== 'actif') - Number(b.status !== 'actif') ||
          a.lastName.localeCompare(b.lastName, 'fr'),
      )
  })
}

/** Le mot de passe est choisi par l'administrateur ; le médecin le change depuis son profil. */
export async function createDoctor(input: DoctorInput, password: string): Promise<Doctor> {
  const created = await mutate((db) => {
    requireAdmin(db)
    const email = input.email.trim().toLowerCase()
    if (db.accounts.some((account) => account.email.toLowerCase() === email)) return null
    const account: StaffAccount = {
      id: `med-${crypto.randomUUID().slice(0, 8)}`,
      role: 'medecin',
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: input.phone?.trim() || undefined,
      password,
      status: 'actif',
      createdAt: new Date().toISOString(),
      specialty: input.specialty.trim(),
    }
    db.accounts.push(account)
    return toDoctor(account, db)
  })
  if (!created) throw new DuplicateEmailError()
  return created
}

/** Une adresse e-mail déjà prise par un autre compte. */
const emailTaken = (db: Database, email: string, exceptId?: string) =>
  db.accounts.some(
    (account) => account.id !== exceptId && account.email.toLowerCase() === email.toLowerCase(),
  )

export async function updateDoctor(id: string, input: DoctorInput): Promise<Doctor> {
  const updated = await mutate((db) => {
    requireAdmin(db)
    const account = doctorsOf(db).find((candidate) => candidate.id === id)
    if (!account) throw new PlatformError('Médecin introuvable')
    const email = input.email.trim().toLowerCase()
    if (emailTaken(db, email, id)) return null
    Object.assign(account, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: input.phone?.trim() || undefined,
      specialty: input.specialty.trim(),
    })
    return toDoctor(account, db)
  })
  if (!updated) throw new DuplicateEmailError()
  return updated
}

export async function setDoctorStatus(id: string, status: AccountStatus): Promise<Doctor> {
  return mutate((db) => {
    requireAdmin(db)
    const account = doctorsOf(db).find((candidate) => candidate.id === id)
    if (!account) throw new PlatformError('Médecin introuvable')
    account.status = status
    return toDoctor(account, db)
  })
}

function toStaffMember(account: StaffAccount): StaffMember {
  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    phone: account.phone,
    status: account.status,
    createdAt: account.createdAt,
  }
}

const personnelOf = (db: Database) => db.accounts.filter((account) => account.role === 'personnel')

/** Membres du personnel, actifs d'abord, puis par ordre alphabétique. */
export async function listStaffMembers(): Promise<StaffMember[]> {
  return query((db) => {
    requireAdmin(db)
    return personnelOf(db)
      .map(toStaffMember)
      .sort(
        (a, b) =>
          Number(a.status !== 'actif') - Number(b.status !== 'actif') ||
          a.lastName.localeCompare(b.lastName, 'fr'),
      )
  })
}

export async function createStaffMember(
  input: StaffMemberInput,
  password: string,
): Promise<StaffMember> {
  const created = await mutate((db) => {
    requireAdmin(db)
    const email = input.email.trim().toLowerCase()
    if (db.accounts.some((account) => account.email.toLowerCase() === email)) return null
    const account: StaffAccount = {
      id: `per-${crypto.randomUUID().slice(0, 8)}`,
      role: 'personnel',
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: input.phone?.trim() || undefined,
      password,
      status: 'actif',
      createdAt: new Date().toISOString(),
    }
    db.accounts.push(account)
    return toStaffMember(account)
  })
  if (!created) throw new DuplicateEmailError()
  return created
}

export async function setStaffMemberStatus(
  id: string,
  status: AccountStatus,
): Promise<StaffMember> {
  return mutate((db) => {
    requireAdmin(db)
    const account = personnelOf(db).find((candidate) => candidate.id === id)
    if (!account) throw new PlatformError('Membre du personnel introuvable')
    account.status = status
    return toStaffMember(account)
  })
}

export async function updateStaffMember(id: string, input: StaffMemberInput): Promise<StaffMember> {
  const updated = await mutate((db) => {
    requireAdmin(db)
    const account = personnelOf(db).find((candidate) => candidate.id === id)
    if (!account) throw new PlatformError('Membre du personnel introuvable')
    const email = input.email.trim().toLowerCase()
    if (emailTaken(db, email, id)) return null
    Object.assign(account, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: input.phone?.trim() || undefined,
    })
    return toStaffMember(account)
  })
  if (!updated) throw new DuplicateEmailError()
  return updated
}
