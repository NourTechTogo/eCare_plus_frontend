import { listLatestMeasurements } from '@/features/measurements/services/measurementService'
import { useAsyncData } from '@/hooks/useAsyncData'

/** Dernière mesure reçue de chaque patient, indexée par identifiant de patient. */
export function useLatestMeasurements() {
  return useAsyncData('latest-measurements', listLatestMeasurements, 5000)
}
