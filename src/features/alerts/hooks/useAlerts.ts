import { getAlert, listAlerts } from '@/features/alerts/services/alertService'
import { useAsyncData } from '@/hooks/useAsyncData'

export function useAlerts() {
  return useAsyncData('alerts', listAlerts, 5000)
}

/** `data` vaut `null` quand aucune alerte ne porte cet identifiant. */
export function useAlert(id: string | undefined) {
  return useAsyncData(`alert:${id ?? ''}`, async () => (id ? ((await getAlert(id)) ?? null) : null))
}
