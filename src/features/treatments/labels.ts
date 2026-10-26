import type { DrugForm, Intake, IntakeStatus } from '@/features/treatments/types/treatment'

export const formLabels: Record<DrugForm, string> = {
  comprime: 'Comprimé',
  gelule: 'Gélule',
  sirop: 'Sirop',
  injection: 'Injection',
  sachet: 'Sachet',
  autre: 'Autre',
}

export const intakeStatusLabels: Record<IntakeStatus, string> = {
  pris: 'Pris',
  reporte: 'Reporté',
  ignore: 'Ignoré',
  non_confirme: 'Non confirmé',
}

/** Taux d'observance (EF-W2-24) : prises confirmées sur prises prévues, en pourcentage. */
export function adherenceRate(intakes: Intake[]) {
  if (intakes.length === 0) return null
  return Math.round(
    (intakes.filter((intake) => intake.status === 'pris').length / intakes.length) * 100,
  )
}

/** Niveau d'observance, pour les couleurs : bonne à partir de 80 %, à surveiller en dessous de 60 %. */
export function adherenceTone(rate: number) {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warning'
  return 'danger'
}
