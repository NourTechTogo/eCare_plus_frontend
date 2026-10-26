import type { AlertSeverity, AlertStatus } from '@/features/alerts/types/alert'

export const severityLabels: Record<AlertSeverity, string> = {
  critique: 'Critique',
  attention: 'Attention',
}

export const statusLabels: Record<AlertStatus, string> = {
  nouvelle: 'Nouvelle',
  vue: 'Vue',
  traitee: 'Traitée',
}
