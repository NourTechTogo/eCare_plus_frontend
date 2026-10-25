import { Card } from '@/components/ui/Card'
import { TrendChart, type TrendSeries } from '@/features/measurements/components/TrendChart'
import type { Measurement } from '@/features/measurements/types/measurement'

const BLUE = 'var(--color-primary)'
const VIOLET = 'var(--color-violet)'

const decimal = (digits: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const twoDecimals = decimal(2)
const oneDecimal = decimal(1)

const time = (measurement: Measurement) => new Date(measurement.recordedAt).getTime()

/** Construit une série à partir des mesures retenues, triées par date croissante. */
function toSeries<M extends Measurement>(
  label: string,
  color: string,
  measurements: M[],
  value: (measurement: M) => number,
): TrendSeries {
  return {
    label,
    color,
    points: measurements
      .map((measurement) => ({ time: time(measurement), value: value(measurement) }))
      .sort((a, b) => a.time - b.time),
  }
}

/**
 * Une évolution n'a de sens qu'à partir de deux mesures : en dessous, le graphique n'est pas affiché.
 * Au-delà, toutes les séries non vides sont gardées, même réduites à un point isolé.
 */
function drawable(series: TrendSeries[]) {
  const nonEmpty = series.filter((s) => s.points.length > 0)
  const dates = new Set(nonEmpty.flatMap((s) => s.points.map((point) => point.time)))
  return dates.size >= 2 ? nonEmpty : []
}

/**
 * Courbes d'évolution des mesures d'un patient.
 * Un graphique par grandeur et par seuil : jamais deux échelles ni deux seuils sur le même tracé.
 */
export function MeasurementTrends({ measurements }: { measurements: Measurement[] }) {
  const glycemia = measurements.filter((m) => m.kind === 'glycemie')
  const pressure = measurements.filter((m) => m.kind === 'tension')
  const weight = measurements.filter((m) => m.kind === 'poids')
  const heartRate = measurements.filter((m) => m.kind === 'frequence_cardiaque')
  const temperature = measurements.filter((m) => m.kind === 'temperature')
  const saturation = measurements.filter((m) => m.kind === 'spo2')
  const mmHg = (value: number) => `${value} mmHg`

  const charts = [
    {
      title: 'Glycémie',
      series: drawable([
        toSeries('Contexte non précisé', BLUE, glycemia.filter((m) => m.context === 'non_precise'), (m) => m.value),
        toSeries('À jeun', BLUE, glycemia.filter((m) => m.context === 'a_jeun'), (m) => m.value),
        toSeries(
          'Post-prandiale',
          VIOLET,
          glycemia.filter((m) => m.context === 'post_prandiale'),
          (m) => m.value,
        ),
      ]),

      formatValue: (value: number) => `${twoDecimals.format(value)} g/L`,
    },
    {
      title: 'Tension artérielle systolique',
      series: drawable([toSeries('Systolique', BLUE, pressure, (m) => m.systolic)]),

      formatValue: mmHg,
    },
    {
      title: 'Tension artérielle diastolique',
      series: drawable([toSeries('Diastolique', VIOLET, pressure, (m) => m.diastolic)]),

      formatValue: mmHg,
    },
    {
      title:'Température',
      series:drawable([toSeries('Température',BLUE,temperature,m=>m.value)]),
      formatValue:(value:number)=>`${oneDecimal.format(value)} °C`,
    },
    {
      title:'SpO2',
      series:drawable([toSeries('SpO2',BLUE,saturation,m=>m.value)]),
      formatValue:(value:number)=>`${value} %`,
    },
    {
      title: 'Poids',
      series: drawable([toSeries('Poids', BLUE, weight, (m) => m.value)]),
      formatValue: (value: number) => `${oneDecimal.format(value)} kg`,
    },
    {
      title: 'Fréquence cardiaque',
      series: drawable([toSeries('Fréquence cardiaque', BLUE, heartRate, (m) => m.value)]),
      formatValue: (value: number) => `${value} bpm`,
    },
  ].filter((chart) => chart.series.length > 0)

  if (charts.length === 0) return null

  return (
    <Card title="Évolution des mesures">
      <div className="flex flex-col gap-10">
        {charts.map((chart) => (
          <TrendChart key={chart.title} {...chart} />
        ))}
        <p className="text-xs text-muted">
          Les alertes reposent sur les règles du serveur. Aucun seuil local n'est appliqué à ces courbes.
          Ces courbes montrent la tendance des mesures transmises ; elles ne constituent pas une
          interprétation médicale.
        </p>
      </div>
    </Card>
  )
}
