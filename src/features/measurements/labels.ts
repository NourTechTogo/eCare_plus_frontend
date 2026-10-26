import type {
  Measurement,
  MeasurementKind,
  MeasurementLevel,
  MeasurementSource,
} from '@/features/measurements/types/measurement'

export const kindLabels: Record<MeasurementKind, string> = {
  tension: 'Tension artérielle',
  frequence_cardiaque: 'Fréquence cardiaque',
  glycemie: 'Glycémie',
  poids: 'Poids',
}

export const sourceLabels: Record<MeasurementSource, string> = {
  manuelle: 'Saisie manuelle',
  montre: 'Montre connectée',
}

export const levelLabels: Record<MeasurementLevel, string> = {
  normal: 'Normal',
  attention: 'Attention',
  critique: 'Critique',
}

const decimal = (digits: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const twoDecimals = decimal(2)
const oneDecimal = decimal(1)

/** Libellé précis de la mesure, avec le moment de la prise pour la glycémie. */
export function measurementLabel(measurement: Measurement) {
  if (measurement.kind !== 'glycemie') return kindLabels[measurement.kind]
  return measurement.context === 'a_jeun' ? 'Glycémie à jeun' : 'Glycémie post-prandiale'
}

/** Valeur exacte avec son unité, sans interprétation. */
export function formatMeasurementValue(measurement: Measurement) {
  switch (measurement.kind) {
    case 'glycemie':
      return `${twoDecimals.format(measurement.value)} g/L`
    case 'tension':
      return `${measurement.systolic}/${measurement.diastolic} mmHg`
    case 'poids':
      return `${oneDecimal.format(measurement.value)} kg`
    case 'frequence_cardiaque':
      return `${measurement.value} bpm`
  }
}

/** Nombre avec la précision usuelle de sa grandeur, pour les seuils et les axes. */
export function formatMetricValue(value: number, unit: string) {
  const formatted =
    unit === 'g/L'
      ? twoDecimals.format(value)
      : unit === '°C'
        ? oneDecimal.format(value)
        : String(value)
  return `${formatted} ${unit}`
}

/** Couleur du texte d'une valeur selon son état. */
export const levelTextClassName: Record<MeasurementLevel, string> = {
  normal: 'text-ink',
  attention: 'text-warning',
  critique: 'text-danger',
}
