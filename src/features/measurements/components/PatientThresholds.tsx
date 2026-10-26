import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { TextField } from '@/components/ui/TextField'
import { useThresholds } from '@/features/measurements/hooks/useThresholds'
import { formatMetricValue } from '@/features/measurements/labels'
import {
  saveThreshold,
  type PatientThresholds as Thresholds,
} from '@/features/measurements/services/measurementService'
import {
  defaultThresholds,
  metricLabels,
  metricUnits,
  thresholdMetrics,
} from '@/features/measurements/thresholds'
import type { ThresholdMetric, ThresholdRule } from '@/features/measurements/types/measurement'
import { useFeedback } from '@/hooks/useFeedback'

type RuleField = keyof ThresholdRule

const ruleFields: { field: RuleField; label: string }[] = [
  { field: 'criticalMin', label: 'Critique en dessous de' },
  { field: 'normalMin', label: 'Plage normale : de' },
  { field: 'normalMax', label: 'Plage normale : à' },
  { field: 'criticalMax', label: 'Critique au-dessus de' },
]

const parse = (value: string) => Number(value.replace(',', '.'))

function ThresholdDialog({
  patientId,
  metric,
  rule,
  customized,
  onClose,
  onSaved,
}: {
  patientId: string
  metric: ThresholdMetric
  rule: ThresholdRule
  customized: boolean
  onClose: () => void
  onSaved: (thresholds: Thresholds) => void
}) {
  const unit = metricUnits[metric]
  const [values, setValues] = useState<Record<RuleField, string>>(() => ({
    criticalMin: String(rule.criticalMin).replace('.', ','),
    normalMin: String(rule.normalMin).replace('.', ','),
    normalMax: String(rule.normalMax).replace('.', ','),
    criticalMax: String(rule.criticalMax).replace('.', ','),
  }))
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const feedback = useFeedback()

  const submit = async (next: ThresholdRule | null) => {
    setSaving(true)
    try {
      onSaved(await saveThreshold(patientId, metric, next))
      feedback.success(
        next ? 'Seuils personnalisés enregistrés' : 'Seuils par défaut rétablis',
        'Ils s’appliquent dès la prochaine mesure du patient.',
      )
    } catch {
      feedback.error(
        "Les seuils n'ont pas pu être enregistrés",
        'Vérifiez votre connexion puis réessayez.',
      )
      setSaving(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = {
      criticalMin: parse(values.criticalMin),
      normalMin: parse(values.normalMin),
      normalMax: parse(values.normalMax),
      criticalMax: parse(values.criticalMax),
    }
    if (Object.values(next).some((value) => Number.isNaN(value))) {
      return setError('Saisissez une valeur numérique dans chaque champ.')
    }
    if (!(
      next.criticalMin <= next.normalMin &&
      next.normalMin < next.normalMax &&
      next.normalMax <= next.criticalMax
    )) {
      return setError(
        'Les seuils doivent se suivre : critique bas ≤ normal bas < normal haut ≤ critique haut.',
      )
    }
    void submit(next)
  }

  return (
    <Dialog
      title={metricLabels[metric]}
      description={`Seuils du patient, en ${unit}`}
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2">
          {ruleFields.map(({ field, label }) => (
            <TextField
              key={field}
              label={label}
              inputMode="decimal"
              showRequirement={false}
              value={values[field]}
              onChange={(event) => {
                setValues((current) => ({ ...current, [field]: event.target.value }))
                setError(undefined)
              }}
            />
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <p className="text-xs text-muted">
          Par défaut : plage normale de{' '}
          {formatMetricValue(defaultThresholds[metric].normalMin, unit)} à{' '}
          {formatMetricValue(defaultThresholds[metric].normalMax, unit)}, critique en dessous de{' '}
          {formatMetricValue(defaultThresholds[metric].criticalMin, unit)} ou au-dessus de{' '}
          {formatMetricValue(defaultThresholds[metric].criticalMax, unit)}.
        </p>
        <div className="flex flex-wrap justify-between gap-3">
          {customized ? (
            <Button variant="secondary" disabled={saving} onClick={() => void submit(null)}>
              Revenir aux seuils par défaut
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" disabled={saving} onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              Enregistrer
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}

/** Seuils d'alerte du patient ; le médecin peut les personnaliser (EF-W2-11, RG-W2-3). */
export function PatientThresholds({ patientId }: { patientId: string }) {
  const state = useThresholds(patientId)
  const [updated, setUpdated] = useState<Thresholds>()
  const [editing, setEditing] = useState<ThresholdMetric>()

  if (state.status === 'loading') {
    return (
      <Card title="Seuils d'alerte">
        <ListSkeleton label="Chargement des seuils…" />
      </Card>
    )
  }
  if (state.status === 'error') {
    return (
      <Alert variant="error" title="Les seuils n'ont pas pu être chargés.">
        Rechargez la page pour réessayer.
      </Alert>
    )
  }

  const thresholds = updated ?? state.data

  return (
    <Card title="Seuils d'alerte">
      <p className="mb-5 text-sm text-muted">
        Une mesure hors de la plage normale déclenche une alerte « attention » ; au-delà des seuils
        critiques, une alerte « critique ». Les seuils par défaut sont indicatifs : adaptez-les à ce
        patient si besoin.
      </p>
      <ul className="grid gap-3 lg:grid-cols-2">
        {thresholdMetrics.map((metric) => {
          const rule = thresholds.rules[metric]
          const unit = metricUnits[metric]
          const customized = thresholds.customized.includes(metric)
          return (
            <li key={metric} className="flex flex-col gap-3 rounded-2xl bg-page p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{metricLabels[metric]}</p>
                <Badge tone={customized ? 'violet' : 'blue'}>
                  {customized ? 'Personnalisé' : 'Par défaut'}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Plage normale</dt>
                  <dd className="font-semibold text-success">
                    {formatMetricValue(rule.normalMin, unit)} à{' '}
                    {formatMetricValue(rule.normalMax, unit)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Critique</dt>
                  <dd className="font-semibold text-danger">
                    {`< ${formatMetricValue(rule.criticalMin, unit)} ou > ${formatMetricValue(rule.criticalMax, unit)}`}
                  </dd>
                </div>
              </dl>
              <div>
                <Button variant="soft" size="sm" onClick={() => setEditing(metric)}>
                  Modifier
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {editing && (
        <ThresholdDialog
          patientId={patientId}
          metric={editing}
          rule={thresholds.rules[editing]}
          customized={thresholds.customized.includes(editing)}
          onClose={() => setEditing(undefined)}
          onSaved={(next) => {
            setUpdated(next)
            setEditing(undefined)
          }}
        />
      )}
    </Card>
  )
}
