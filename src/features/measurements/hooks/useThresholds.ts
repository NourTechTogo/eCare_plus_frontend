import { getThresholds } from '@/features/measurements/services/measurementService'
import { useAsyncData } from '@/hooks/useAsyncData'

export function useThresholds(patientId: string) {
  return useAsyncData(`thresholds:${patientId}`, () => getThresholds(patientId))
}
