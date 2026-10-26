/** Types de mesures suivis, alignés sur le backend (`TypeMesure`). */
export type MeasurementKind = 'tension' | 'frequence_cardiaque' | 'glycemie' | 'poids'

/** Origine d'une mesure : saisie par le patient, ou lue sur sa montre connectée (RG-W2-4). */
export type MeasurementSource = 'manuelle' | 'montre'

interface MeasurementBase {
  id: string
  patientId: string
  /** Date et heure de la mesure, au format ISO-8601. */
  recordedAt: string
  source: MeasurementSource
  /** Note libre du patient, par exemple « après effort » (EF-W2-8). */
  note?: string
}

export interface GlycemiaMeasurement extends MeasurementBase {
  kind: 'glycemie'
  /** En g/L. */
  value: number
  context: 'a_jeun' | 'post_prandiale'
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
  GlycemiaMeasurement | BloodPressureMeasurement | WeightMeasurement | HeartRateMeasurement

/** Grandeur soumise à un seuil d'alerte ; la tension en compte deux, la glycémie deux moments. */
export type ThresholdMetric =
  | 'systolique'
  | 'diastolique'
  | 'frequence_cardiaque'
  | 'glycemie_a_jeun'
  | 'glycemie_post_prandiale'

/**
 * Seuils d'une grandeur (EF-W2-10 à 12) : hors de la plage normale, la mesure est « attention » ;
 * hors de la plage critique, elle est « critique ».
 */
export interface ThresholdRule {
  normalMin: number
  normalMax: number
  criticalMin: number
  criticalMax: number
}

/** État d'une mesure au regard des seuils du patient, avec les mêmes couleurs partout (EF-UI-5). */
export type MeasurementLevel = 'normal' | 'attention' | 'critique'

/** Seuils personnalisés par le médecin pour un patient ; ils priment sur ceux par défaut (RG-W2-3). */
export interface PatientThreshold {
  patientId: string
  metric: ThresholdMetric
  rule: ThresholdRule
  updatedAt: string
  updatedBy: string
}
