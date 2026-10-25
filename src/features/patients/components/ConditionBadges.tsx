import { Badge } from '@/components/ui/Badge'
import type { Condition } from '@/features/patients/types/patient'

/** Pastilles de pathologie, aux couleurs de la maquette : bleu pour le diabète, violet pour l'hypertension. */
export function ConditionBadges({ condition }: { condition: Condition | '' }) {
  if (!condition) return <span className="text-xs text-muted">Non renseignée</span>
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {condition !== 'hypertension' && <Badge tone="blue">Diabète</Badge>}
      {condition !== 'diabete' && <Badge tone="violet">Hypertension</Badge>}
    </span>
  )
}
