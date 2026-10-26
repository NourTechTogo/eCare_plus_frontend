import { Badge } from '@/components/ui/Badge'
import { severityLabels, statusLabels } from '@/features/alerts/labels'
import type { AlertSeverity, AlertStatus } from '@/features/alerts/types/alert'

/** Gravité, avec les couleurs d'état communes à toute l'application (EF-UI-5). */
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge tone={severity === 'critique' ? 'red' : 'amber'}>{severityLabels[severity]}</Badge>
}

const statusTones = { nouvelle: 'blue', vue: 'violet', traitee: 'green' } as const

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
}
