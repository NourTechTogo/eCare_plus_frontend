import type {
  Measurement,
  MeasurementLevel,
  ThresholdMetric,
  ThresholdRule,
} from '@/features/measurements/types/measurement'

/*
 * Seuils par défaut du cahier des charges (§2.3.10). Valeurs indicatives, à faire valider par un
 * professionnel de santé avant tout usage réel. La glycémie post-prandiale n'y figure pas : sa plage
 * est une hypothèse de travail, plus large que celle de la glycémie à jeun.
 */
export const defaultThresholds: Record<ThresholdMetric, ThresholdRule> = {
  systolique: { normalMin: 90, normalMax: 139, criticalMin: 80, criticalMax: 179 },
  diastolique: { normalMin: 60, normalMax: 89, criticalMin: 50, criticalMax: 119 },
  frequence_cardiaque: { normalMin: 50, normalMax: 100, criticalMin: 40, criticalMax: 130 },
  glycemie_a_jeun: { normalMin: 0.7, normalMax: 1.1, criticalMin: 0.55, criticalMax: 1.99 },
  glycemie_post_prandiale: { normalMin: 0.7, normalMax: 1.4, criticalMin: 0.55, criticalMax: 1.99 },
}

export const metricLabels: Record<ThresholdMetric, string> = {
  systolique: 'Tension systolique',
  diastolique: 'Tension diastolique',
  frequence_cardiaque: 'Fréquence cardiaque au repos',
  glycemie_a_jeun: 'Glycémie à jeun',
  glycemie_post_prandiale: 'Glycémie post-prandiale',
}

export const metricUnits: Record<ThresholdMetric, string> = {
  systolique: 'mmHg',
  diastolique: 'mmHg',
  frequence_cardiaque: 'bpm',
  glycemie_a_jeun: 'g/L',
  glycemie_post_prandiale: 'g/L',
}

export const thresholdMetrics = Object.keys(defaultThresholds) as ThresholdMetric[]

export type ThresholdSet = Record<ThresholdMetric, ThresholdRule>

export function levelOf(value: number, rule: ThresholdRule): MeasurementLevel {
  if (value < rule.criticalMin || value > rule.criticalMax) return 'critique'
  if (value < rule.normalMin || value > rule.normalMax) return 'attention'
  return 'normal'
}

const levelRank: Record<MeasurementLevel, number> = { normal: 0, attention: 1, critique: 2 }

/** Valeurs d'une mesure soumises à un seuil ; le poids n'a pas de seuil absolu (§2.3.10). */
export function metricValues(measurement: Measurement): [ThresholdMetric, number][] {
  switch (measurement.kind) {
    case 'tension':
      return [
        ['systolique', measurement.systolic],
        ['diastolique', measurement.diastolic],
      ]
    case 'glycemie':
      return [
        [
          measurement.context === 'a_jeun' ? 'glycemie_a_jeun' : 'glycemie_post_prandiale',
          measurement.value,
        ],
      ]
    case 'frequence_cardiaque':
      return [['frequence_cardiaque', measurement.value]]
    case 'poids':
      return []
  }
}

/** État le plus défavorable des valeurs d'une mesure. */
export function measurementLevel(
  measurement: Measurement,
  thresholds: ThresholdSet,
): MeasurementLevel {
  return metricValues(measurement).reduce<MeasurementLevel>((worst, [metric, value]) => {
    const level = levelOf(value, thresholds[metric])
    return levelRank[level] > levelRank[worst] ? level : worst
  }, 'normal')
}
