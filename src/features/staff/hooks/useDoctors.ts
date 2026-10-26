import { listDoctors } from '@/features/staff/services/staffService'
import { useAsyncData } from '@/hooks/useAsyncData'

export function useDoctors() {
  return useAsyncData('doctors', listDoctors)
}
