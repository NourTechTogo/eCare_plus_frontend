import { requireDoctor, requirePatient, visiblePatients } from '@/demo/access'
import { mutate, query, type Database } from '@/demo/database'
import { displayName } from '@/demo/session'
import { defaultThresholds, type ThresholdSet } from '@/features/measurements/thresholds'
import type {
  Measurement,
  ThresholdMetric,
  ThresholdRule,
} from '@/features/measurements/types/measurement'

/*
 * Mesures transmises par l'application mobile (saisie manuelle ou montre connectée) et seuils
 * d'alerte. Routes attendues : GET /patients/{id}/mesures?type=&du=&au=,
 * GET|PUT /patients/{id}/seuils (voir docs/CONTRAT_API.md).
 */

/** Seuils appliqués à un patient, et grandeurs dont le médecin a personnalisé le seuil. */
export interface PatientThresholds {
  rules: ThresholdSet
  customized: ThresholdMetric[]
}

function thresholdsOf(db: Database, patientId: string): PatientThresholds {
  const rules: ThresholdSet = { ...defaultThresholds }
  const customized: ThresholdMetric[] = []
  for (const override of db.thresholds) {
    if (override.patientId !== patientId) continue
    rules[override.metric] = override.rule
    customized.push(override.metric)
  }
  return { rules, customized }
}

/** Mesures d'un patient, de la plus récente à la plus ancienne. */
export async function listMeasurements(patientId: string): Promise<Measurement[]> {
  return query((db) => {
    requirePatient(db, patientId)
    return db.measurements
      .filter((measurement) => measurement.patientId === patientId)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  })
}

/** Dernière mesure reçue de chaque patient visible, indexée par identifiant de patient. */
export async function listLatestMeasurements(): Promise<Record<string, Measurement>> {
  return query((db) => {
    const ids = new Set(visiblePatients(db).map((patient) => patient.id))
    const latest: Record<string, Measurement> = {}
    for (const measurement of db.measurements) {
      if (!ids.has(measurement.patientId)) continue
      const known = latest[measurement.patientId]
      if (!known || measurement.recordedAt > known.recordedAt)
        latest[measurement.patientId] = measurement
    }
    return latest
  })
}

export async function getThresholds(patientId: string): Promise<PatientThresholds> {
  return query((db) => {
    requirePatient(db, patientId)
    return thresholdsOf(db, patientId)
  })
}

/** Personnalise le seuil d'une grandeur pour un patient (EF-W2-11), ou revient au seuil par défaut. */
export async function saveThreshold(
  patientId: string,
  metric: ThresholdMetric,
  rule: ThresholdRule | null,
): Promise<PatientThresholds> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    requirePatient(db, patientId)
    db.thresholds = db.thresholds.filter(
      (override) => !(override.patientId === patientId && override.metric === metric),
    )
    if (rule) {
      db.thresholds.push({
        patientId,
        metric,
        rule,
        updatedAt: new Date().toISOString(),
        updatedBy: displayName(doctor),
      })
    }
    return thresholdsOf(db, patientId)
  })
}
