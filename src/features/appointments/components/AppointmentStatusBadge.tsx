import { Badge } from '@/components/ui/Badge'
import { statusLabels } from '@/features/appointments/labels'
import type { AppointmentStatus } from '@/features/appointments/types/appointment'

const tones = {
  demande: 'amber',
  confirme: 'blue',
  refuse: 'red',
  annule: 'red',
  realise: 'green',
} as const

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={tones[status]}>{statusLabels[status]}</Badge>
}
