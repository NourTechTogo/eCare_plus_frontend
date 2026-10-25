import type { Condition, Sex } from '@/features/patients/types/patient'

export const sexLabels: Record<Sex, string> = {
  A: 'Autre',
  N: 'Non renseigné',
  F: 'Féminin',
  M: 'Masculin',
}

export const conditionLabels: Record<Condition | '', string> = {
  '': 'Non renseignée',
  diabete: 'Diabète',
  hypertension: 'Hypertension artérielle',
  diabete_hypertension: 'Diabète et hypertension artérielle',
}
