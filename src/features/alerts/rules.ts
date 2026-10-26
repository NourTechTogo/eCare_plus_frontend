import type { Alert, AlertSeverity } from '@/features/alerts/types/alert'
import { formatMeasurementValue, formatMetricValue } from '@/features/measurements/labels'
import {
  levelOf,
  metricLabels,
  metricUnits,
  metricValues,
  type ThresholdSet,
} from '@/features/measurements/thresholds'
import type { Measurement } from '@/features/measurements/types/measurement'
import type { Patient } from '@/features/patients/types/patient'

/*
 * Moteur d'alertes : une alerte par mesure hors seuil (EF-W2-13), avec la gravité de la valeur la
 * plus défavorable. Côté plateforme, cette évaluation revient au serveur (RG-W2-2).
 */

export function buildAlert(
  measurement: Measurement,
  patient: Patient,
  thresholds: ThresholdSet,
  id: string,
): Alert | null {
  let worst: { severity: AlertSeverity; trigger: string; threshold: string } | null = null

  for (const [metric, value] of metricValues(measurement)) {
    const rule = thresholds[metric]
    const level = levelOf(value, rule)
    if (level === 'normal' || (worst?.severity === 'critique' && level === 'attention')) continue
    const above = value > rule.normalMax
    const unit = metricUnits[metric]
    const limit =
      level === 'critique'
        ? above
          ? rule.criticalMax
          : rule.criticalMin
        : above
          ? rule.normalMax
          : rule.normalMin
    worst = {
      severity: level,
      trigger: `${metricLabels[metric]} ${above ? 'au-dessus' : 'en dessous'} ${
        level === 'critique' ? 'du seuil critique' : 'de la plage normale'
      }`,
      threshold: `${above ? '>' : '<'} ${formatMetricValue(limit, unit)}`,
    }
  }

  if (!worst) return null
  return {
    id,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientFileNumber: patient.fileNumber,
    doctorId: patient.referentDoctorId,
    measurementId: measurement.id,
    kind: measurement.kind,
    trigger: worst.trigger,
    value: formatMeasurementValue(measurement),
    threshold: worst.threshold,
    severity: worst.severity,
    status: 'nouvelle',
    triggeredAt: measurement.recordedAt,
  }
}
