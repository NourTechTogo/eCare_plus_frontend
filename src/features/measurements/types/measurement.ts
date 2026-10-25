export type MeasurementKind = 'glycemie' | 'tension' | 'poids' | 'frequence_cardiaque' | 'temperature' | 'spo2'

interface MeasurementBase {
  source?: string
  comment?: string
  id: string
  patientId: string
  /** Date et heure d'enregistrement, attribuées automatiquement à la saisie. */
  recordedAt: string
}

export interface GlycemiaMeasurement extends MeasurementBase {
  kind: 'glycemie'
  /** En g/L. */
  value: number
  context: 'a_jeun' | 'post_prandiale' | 'non_precise'
}

export interface BloodPressureMeasurement extends MeasurementBase {
  kind: 'tension'
  /** En mmHg. */
  systolic: number
  diastolic: number
}

export interface WeightMeasurement extends MeasurementBase {
  kind: 'poids'
  /** En kg. */
  value: number
}

export interface HeartRateMeasurement extends MeasurementBase {
  kind: 'frequence_cardiaque'
  /** En battements par minute. */
  value: number
}

export type Measurement =
  | GlycemiaMeasurement
  | BloodPressureMeasurement
  | WeightMeasurement
  | HeartRateMeasurement
  | OtherMeasurement

export type OtherMeasurement = MeasurementBase & ({ kind: 'temperature'; value: number } | { kind: 'spo2'; value: number })
