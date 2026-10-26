import { Card } from '@/components/ui/Card'
import { TrendChart, type TrendSeries } from '@/features/measurements/components/TrendChart'
import { formatMetricValue } from '@/features/measurements/labels'
import {
  levelOf,
  metricLabels,
  metricUnits,
  type ThresholdSet,
} from '@/features/measurements/thresholds'
import type { Measurement, ThresholdMetric } from '@/features/measurements/types/measurement'

const BLUE = 'var(--color-primary)'

const time = (measurement: Measurement) => new Date(measurement.recordedAt).getTime()

interface ChartDefinition {
  title: string
  metric?: ThresholdMetric
  unit: string
  points: { time: number; value: number }[]
}

/** Valeurs d'une grandeur, par ordre chronologique. */
function points<M extends Measurement>(measurements: M[], value: (measurement: M) => number) {
  return measurements
    .map((measurement) => ({ time: time(measurement), value: value(measurement) }))
    .sort((a, b) => a.time - b.time)
}

function charts(measurements: Measurement[]): ChartDefinition[] {
  const of = <K extends Measurement['kind']>(kind: K) =>
    measurements.filter((m): m is Extract<Measurement, { kind: K }> => m.kind === kind)
  const glycemia = of('glycemie')
  const pressure = of('tension')
  const metric = (key: ThresholdMetric, values: ChartDefinition['points']): ChartDefinition => ({
    title: metricLabels[key],
    metric: key,
    unit: metricUnits[key],
    points: values,
  })
  return (
    [
      metric(
        'glycemie_a_jeun',
        points(
          glycemia.filter((m) => m.context === 'a_jeun'),
          (m) => m.value,
        ),
      ),
      metric(
        'glycemie_post_prandiale',
        points(
          glycemia.filter((m) => m.context === 'post_prandiale'),
          (m) => m.value,
        ),
      ),
      metric(
        'systolique',
        points(pressure, (m) => m.systolic),
      ),
      metric(
        'diastolique',
        points(pressure, (m) => m.diastolic),
      ),
      metric(
        'frequence_cardiaque',
        points(of('frequence_cardiaque'), (m) => m.value),
      ),
      { title: 'Poids', unit: 'kg', points: points(of('poids'), (m) => m.value) },
    ]
      // Une évolution n'a de sens qu'à partir de deux mesures.
      .filter((chart) => chart.points.length >= 2)
  )
}

interface MeasurementTrendsProps {
  measurements: Measurement[]
  thresholds: ThresholdSet
}

/**
 * Courbes d'évolution (EF-W2-5) : une par grandeur, avec la plage normale du patient. Jamais deux
 * échelles ni deux plages sur le même tracé.
 */
export function MeasurementTrends({ measurements, thresholds }: MeasurementTrendsProps) {
  const definitions = charts(measurements)

  return (
    <Card title="Évolution des mesures">
      {definitions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Pas assez de mesures sur cette période pour tracer une évolution.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {definitions.map((chart) => {
            const rule = chart.metric ? thresholds[chart.metric] : undefined
            const series: TrendSeries[] = [
              { label: chart.title, color: BLUE, points: chart.points },
            ]
            return (
              <TrendChart
                key={chart.title}
                title={chart.title}
                series={series}
                normalRange={rule ? { min: rule.normalMin, max: rule.normalMax } : undefined}
                levelOf={rule ? (value) => levelOf(value, rule) : undefined}
                formatValue={(value) => formatMetricValue(value, chart.unit)}
              />
            )
          })}
          <p className="text-xs text-muted">
            La bande verte correspond à la plage normale du patient ; les points orange et rouges
            sont hors de cette plage. Les courbes montrent la tendance des mesures transmises et ne
            constituent pas une interprétation médicale. Les mesures de la montre connectée sont des
            indications, non des mesures certifiées.
          </p>
        </div>
      )}
    </Card>
  )
}
