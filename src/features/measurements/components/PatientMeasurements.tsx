import { useState, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SelectField } from '@/components/ui/SelectField'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { LevelBadge } from '@/features/measurements/components/LevelBadge'
import { MeasurementTrends } from '@/features/measurements/components/MeasurementTrends'
import { useMeasurements } from '@/features/measurements/hooks/useMeasurements'
import { useThresholds } from '@/features/measurements/hooks/useThresholds'
import {
  formatMeasurementValue,
  kindLabels,
  levelLabels,
  levelTextClassName,
  measurementLabel,
  sourceLabels,
} from '@/features/measurements/labels'
import { measurementLevel, type ThresholdSet } from '@/features/measurements/thresholds'
import type { Measurement } from '@/features/measurements/types/measurement'
import { formatDateTime } from '@/utils/formatDateTime'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

const DAY_MS = 86_400_000

/** Périodes de consultation (EF-W2-4). */
const periods = [
  { value: '1', label: 'Aujourd’hui' },
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
]

const kindOptions = Object.entries(kindLabels).map(([value, label]) => ({ value, label }))
const levelOptions = Object.entries(levelLabels).map(([value, label]) => ({ value, label }))

/** La mesure la plus récente de chaque libellé (la liste reçue est triée par date décroissante). */
function latestByLabel(measurements: Measurement[]) {
  const latest = new Map<string, Measurement>()
  for (const measurement of measurements) {
    const label = measurementLabel(measurement)
    if (!latest.has(label)) latest.set(label, measurement)
  }
  return [...latest.values()]
}

function LatestMeasurements({
  measurements,
  thresholds,
}: {
  measurements: Measurement[]
  thresholds: ThresholdSet
}) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
      {latestByLabel(measurements).map((measurement) => {
        const level = measurementLevel(measurement, thresholds)
        return (
          <div key={measurement.id} className="flex flex-col gap-1 rounded-2xl bg-page p-4">
            <dt className="flex items-center justify-between gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {measurementLabel(measurement)}
              {measurement.kind !== 'poids' && <LevelBadge level={level} />}
            </dt>
            <dd className={`font-display text-2xl font-bold ${levelTextClassName[level]}`}>
              {formatMeasurementValue(measurement)}
            </dd>
            <dd className="text-xs text-muted">
              {formatDateTime(measurement.recordedAt)} · {sourceLabels[measurement.source]}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** Nombre de mesures affichées dans l'historique avant de demander la suite (ENF-PERF-4). */
const HISTORY_PAGE_SIZE = 15

function MeasurementHistory({
  measurements,
  thresholds,
}: {
  measurements: Measurement[]
  thresholds: ThresholdSet
}) {
  const [kind, setKind] = useState('')
  const [level, setLevel] = useState('')
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE)
  const rows = measurements
    .map((measurement) => ({ measurement, level: measurementLevel(measurement, thresholds) }))
    .filter((row) => (!kind || row.measurement.kind === kind) && (!level || row.level === level))
  const visible = rows.slice(0, visibleCount)

  return (
    <Card title="Historique des mesures">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full max-w-xs">
            <SelectField
              label="Type de mesure"
              placeholder="Toutes les mesures"
              options={kindOptions}
              showRequirement={false}
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            />
          </div>
          <div className="w-full max-w-xs">
            <SelectField
              label="État"
              placeholder="Tous les états"
              options={levelOptions}
              showRequirement={false}
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Aucune mesure ne correspond à ces critères.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-176 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr>
                  {['Date et heure', 'Mesure', 'Valeur', 'État', 'Source'].map((header) => (
                    <th key={header} scope="col" className={headClassName}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(({ measurement, level: rowLevel }) => (
                  <tr key={measurement.id}>
                    <td className={`${cellClassName} whitespace-nowrap`}>
                      {formatDateTime(measurement.recordedAt)}
                    </td>
                    <td className={cellClassName}>
                      {measurementLabel(measurement)}
                      {measurement.note && (
                        <p className="text-xs text-muted">« {measurement.note} »</p>
                      )}
                    </td>
                    <td
                      className={`${cellClassName} font-semibold whitespace-nowrap ${levelTextClassName[rowLevel]}`}
                    >
                      {formatMeasurementValue(measurement)}
                    </td>
                    <td className={cellClassName}>
                      {measurement.kind === 'poids' ? (
                        <span className="text-muted">Sans seuil</span>
                      ) : (
                        <LevelBadge level={rowLevel} />
                      )}
                    </td>
                    <td className={cellClassName}>
                      <Badge tone={measurement.source === 'montre' ? 'violet' : 'blue'}>
                        {sourceLabels[measurement.source]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > visibleCount && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setVisibleCount((count) => count + HISTORY_PAGE_SIZE)}
            >
              Afficher {Math.min(HISTORY_PAGE_SIZE, rows.length - visibleCount)} mesures de plus
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

interface PatientMeasurementsProps {
  patientId: string
  /** N'affiche que les dernières valeurs reçues, sans les courbes ni l'historique. */
  summary?: boolean
  /** Action placée dans l'en-tête des dernières valeurs, par exemple l'accès au détail. */
  action?: ReactNode
}

/** Suivi des mesures d'un patient : dernières valeurs, courbes et historique, par période. */
export function PatientMeasurements({
  patientId,
  summary = false,
  action,
}: PatientMeasurementsProps) {
  const state = useMeasurements(patientId)
  const thresholdsState = useThresholds(patientId)
  const [period, setPeriod] = useState('30')
  const [now] = useState(() => Date.now())

  if (state.status === 'error' || thresholdsState.status === 'error') {
    return (
      <Alert variant="error" title="Les mesures n'ont pas pu être chargées.">
        Rechargez la page pour réessayer.
      </Alert>
    )
  }

  if (state.status === 'loading' || thresholdsState.status === 'loading') {
    return (
      <Card title="Dernières mesures reçues">
        <ListSkeleton label="Chargement des mesures…" />
      </Card>
    )
  }

  const thresholds = thresholdsState.data.rules
  if (state.measurements.length === 0) {
    return (
      <Card title="Dernières mesures reçues" action={action}>
        <p className="py-6 text-center text-sm text-muted">
          Aucune mesure pour l'instant : elles apparaîtront dès que le patient en transmettra depuis
          l'application.
        </p>
      </Card>
    )
  }

  if (summary) {
    return (
      <Card title="Dernières mesures reçues" action={action}>
        <LatestMeasurements measurements={state.measurements} thresholds={thresholds} />
      </Card>
    )
  }

  // « Aujourd'hui » commence à minuit ; les autres périodes comptent en jours glissants.
  const start = period === '1' ? new Date(now).setHours(0, 0, 0, 0) : now - Number(period) * DAY_MS
  const inPeriod = state.measurements.filter(
    (measurement) => new Date(measurement.recordedAt).getTime() >= start,
  )

  return (
    <>
      <Card title="Dernières mesures reçues" action={action}>
        <LatestMeasurements measurements={state.measurements} thresholds={thresholds} />
      </Card>
      <div className="w-full max-w-xs">
        <SelectField
          label="Période"
          placeholder="Choisir une période"
          options={periods}
          showRequirement={false}
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        />
      </div>
      <MeasurementTrends measurements={inPeriod} thresholds={thresholds} />
      <MeasurementHistory key={period} measurements={inPeriod} thresholds={thresholds} />
    </>
  )
}
