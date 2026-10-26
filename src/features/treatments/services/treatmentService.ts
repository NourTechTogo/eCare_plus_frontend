import { requireDoctor, requirePatient } from '@/demo/access'
import { mutate, PlatformError, query } from '@/demo/database'
import { displayName } from '@/demo/session'
import type { Intake, Treatment, TreatmentInput } from '@/features/treatments/types/treatment'

/*
 * Traitements et historique des prises (EF-W2-20 à 25). Le planning des prises est synchronisé
 * vers l'application mobile, qui déclenche les rappels même hors ligne (RG-W2-5). Routes attendues :
 * GET|POST /patients/{id}/traitements, PATCH /traitements/{id}, GET /patients/{id}/prises
 * (voir docs/CONTRAT_API.md).
 */

/** Traitements d'un patient : en cours d'abord, puis du plus récent au plus ancien. */
export async function listTreatments(patientId: string): Promise<Treatment[]> {
  return query((db) => {
    requirePatient(db, patientId)
    return db.treatments
      .filter((treatment) => treatment.patientId === patientId)
      .sort(
        (a, b) =>
          Number(a.status !== 'en_cours') - Number(b.status !== 'en_cours') ||
          b.startDate.localeCompare(a.startDate),
      )
  })
}

/** Prises programmées d'un patient, de la plus récente à la plus ancienne. */
export async function listIntakes(patientId: string): Promise<Intake[]> {
  return query((db) => {
    requirePatient(db, patientId)
    return db.intakes
      .filter((intake) => intake.patientId === patientId)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  })
}

/** Le médecin prescrit un traitement ; le patient en est notifié dans l'application (EF-W2-25). */
export async function createTreatment(
  patientId: string,
  input: TreatmentInput,
): Promise<Treatment> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    requirePatient(db, patientId)
    const now = new Date().toISOString()
    const treatment: Treatment = {
      ...input,
      id: `trt-${crypto.randomUUID().slice(0, 8)}`,
      patientId,
      status: 'en_cours',
      prescribedBy: displayName(doctor),
      createdAt: now,
      updatedAt: now,
    }
    db.treatments.push(treatment)
    return treatment
  })
}

export async function updateTreatment(id: string, input: TreatmentInput): Promise<Treatment> {
  return mutate((db) => {
    requireDoctor(db)
    const treatment = db.treatments.find((candidate) => candidate.id === id)
    if (!treatment) throw new PlatformError('Traitement introuvable')
    requirePatient(db, treatment.patientId)
    Object.assign(treatment, input, { updatedAt: new Date().toISOString() })
    return treatment
  })
}

/** Arrêt d'un traitement : il reste dans l'historique, et les rappels cessent. */
export async function stopTreatment(id: string): Promise<Treatment> {
  return mutate((db) => {
    requireDoctor(db)
    const treatment = db.treatments.find((candidate) => candidate.id === id)
    if (!treatment) throw new PlatformError('Traitement introuvable')
    requirePatient(db, treatment.patientId)
    const now = new Date()
    treatment.status = 'termine'
    treatment.endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    treatment.updatedAt = now.toISOString()
    return treatment
  })
}
