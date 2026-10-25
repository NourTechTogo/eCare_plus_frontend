import { Badge } from '@/components/ui/Badge'
import type { AlertPriority } from '@/features/alerts/types/alert'
export function PriorityBadge({priority}:{priority:AlertPriority}) {
 return <Badge tone={priority==='haute' || priority==='critique'?'red':priority==='moyenne'?'amber':'green'}>{{haute:'Haute priorité',critique:'Critique',moyenne:'Priorité moyenne',faible:'Priorité faible'}[priority]}</Badge>
}
