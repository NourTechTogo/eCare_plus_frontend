import { listMeasurements } from '@/features/measurements/services/measurementService'
import { useAsyncData } from '@/hooks/useAsyncData'
export function useMeasurements(patientId:string) {
 const state=useAsyncData(`measurements:${patientId}`,()=>listMeasurements(patientId),5000)
 return state.status==='success' ? {status:'success' as const,measurements:state.data,refreshError:state.refreshError} : state
}
