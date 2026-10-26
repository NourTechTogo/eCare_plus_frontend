import {
  listAppointments,
  listAvailabilities,
} from '@/features/appointments/services/appointmentService'
import { useAsyncData } from '@/hooks/useAsyncData'

export function useAppointments() {
  return useAsyncData('appointments', listAppointments)
}

export function useAvailabilities() {
  return useAsyncData('availabilities', listAvailabilities)
}
