import { Badge } from '@/components/ui/Badge'
import { levelLabels } from '@/features/measurements/labels'
import type { MeasurementLevel } from '@/features/measurements/types/measurement'

const tones = { normal: 'green', attention: 'amber', critique: 'red' } as const

/** État d'une mesure, avec les couleurs communes à toute l'application (EF-UI-5). */
export function LevelBadge({ level }: { level: MeasurementLevel }) {
  return <Badge tone={tones[level]}>{levelLabels[level]}</Badge>
}
