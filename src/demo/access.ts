import { PlatformError, type Database } from '@/demo/database'
import { currentAccount } from '@/demo/session'

/*
 * Contrôle d'accès de la base locale, calqué sur celui attendu du backend (EF-AUTH-6, ENF-SEC-4) :
 * le personnel voit tous les dossiers de l'établissement, un médecin seulement les patients qui lui
 * sont rattachés ; l'administrateur gère les comptes et n'ouvre pas les dossiers.
 */

export function visiblePatients(db: Database) {
  const account = currentAccount(db)
  if (account.role === 'personnel') return db.patients
  if (account.role === 'admin') return []
  // Le médecin retrouve le patient dans sa liste une fois son compte activé (scénario A, étape 7).
  return db.patients.filter(
    (patient) => patient.referentDoctorId === account.id && patient.status === 'actif',
  )
}

/** Patient accessible à l'utilisateur connecté ; sinon, refus explicite. */
export function requirePatient(db: Database, patientId: string) {
  const patient = visiblePatients(db).find((candidate) => candidate.id === patientId)
  if (!patient) throw new PlatformError('Accès interdit à ce dossier')
  return patient
}

/** Médecin connecté ; les actes de suivi médical lui sont réservés. */
export function requireDoctor(db: Database) {
  const account = currentAccount(db)
  if (account.role !== 'medecin') throw new PlatformError('Action réservée au médecin')
  return account
}

/** Personnel de l'établissement : création des dossiers et affectation des médecins. */
export function requirePersonnel(db: Database) {
  const account = currentAccount(db)
  if (account.role !== 'personnel') throw new PlatformError('Action réservée au personnel')
  return account
}

/** Administrateur : gestion des comptes des médecins et du personnel. */
export function requireAdmin(db: Database) {
  const account = currentAccount(db)
  if (account.role !== 'admin') throw new PlatformError('Action réservée à l’administrateur')
  return account
}
