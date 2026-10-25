import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { buttonClassName } from '@/components/ui/styles'

/*
 * Aperçus illustratifs des écrans du portail, affichés sur la page de présentation.
 * Toutes les données sont fictives. Purement visuels : ils sont masqués aux lecteurs d'écran,
 * le texte de la page décrit déjà chaque fonctionnalité.
 */

type Point = [x: number, y: number]

interface MiniChartProps {
  series: { color: string; points: Point[] }[]
  /** Ordonnée du seuil d'alerte, sur la grille de 320 × 120. */
  thresholdY?: number
}

function MiniChart({ series, thresholdY }: MiniChartProps) {
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full">
      {thresholdY !== undefined && (
        <rect width="320" height={thresholdY} fill="var(--color-danger-soft)" opacity="0.6" />
      )}
      {[30, 60, 90].map((y) => (
        <line key={y} x2="320" y1={y} y2={y} stroke="var(--color-line)" />
      ))}
      {thresholdY !== undefined && (
        <line
          x2="320"
          y1={thresholdY}
          y2={thresholdY}
          stroke="var(--color-danger)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      )}
      {series.map((s) => (
        <g key={s.color}>
          <polyline
            points={s.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {s.points.map(([x, y]) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="5"
              fill={thresholdY !== undefined && y < thresholdY ? 'var(--color-danger)' : s.color}
              stroke="var(--color-surface)"
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

const glycemiaPoints: Point[] = [
  [8, 88],
  [58, 80],
  [108, 92],
  [158, 70],
  [208, 62],
  [258, 50],
  [308, 28],
]

const systolicPoints: Point[] = [
  [8, 44],
  [58, 36],
  [108, 48],
  [158, 30],
  [208, 40],
  [258, 34],
  [308, 26],
]

const diastolicPoints: Point[] = [
  [8, 92],
  [58, 86],
  [108, 96],
  [158, 82],
  [208, 90],
  [258, 84],
  [308, 78],
]

const floatingCard = 'rounded-2xl bg-surface p-4 shadow-xl shadow-ink/15'

/** Carte posée sur la photo d'accroche : dernière glycémie et courbe de la semaine. */
export function GlycemiaCard() {
  return (
    <div aria-hidden="true" className={`${floatingCard} w-60`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold text-muted">Glycémie à jeun</p>
        <p className="text-xs text-muted">7 jours</p>
      </div>
      <p className="mt-1 font-display text-2xl font-bold text-ink">1,31 g/L</p>
      <div className="mt-2">
        <MiniChart thresholdY={40} series={[{ color: 'var(--color-primary)', points: glycemiaPoints }]} />
      </div>
    </div>
  )
}

/** Carte posée sur la photo d'accroche : une alerte à traiter. */
export function AlertCard() {
  return (
    <div aria-hidden="true" className={`${floatingCard} flex w-64 flex-col items-start gap-2`}>
      <Badge tone="red">Haute priorité</Badge>
      <div>
        <p className="text-sm font-semibold text-ink">Mariam T.</p>
        <p className="text-xs text-muted">Tension artérielle au-dessus du seuil</p>
      </div>
      <div className="flex w-full items-center justify-between gap-3">
        <span className="font-display font-bold text-danger">160/100 mmHg</span>
        <span className={buttonClassName('primary', 'sm')}>Traiter l'alerte</span>
      </div>
    </div>
  )
}

function Preview({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="rounded-xl bg-surface p-4 shadow-sm">
      {children}
    </div>
  )
}

export function TrendPreview() {
  return (
    <Preview>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-semibold text-muted">Tension artérielle</p>
        <p className="font-display text-lg font-bold text-ink">130/80 mmHg</p>
      </div>
      <div className="mt-3">
        <MiniChart
          series={[
            { color: 'var(--color-primary)', points: systolicPoints },
            { color: 'var(--color-violet)', points: diastolicPoints },
          ]}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" />
          Systolique
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-violet" />
          Diastolique
        </span>
      </div>
    </Preview>
  )
}

const previewAlerts = [
  { name: 'Mariam T.', trigger: 'Tension artérielle', value: '160/100 mmHg', high: true },
  { name: 'Jean K.', trigger: 'Glycémie à jeun', value: '1,31 g/L', high: true },
  { name: 'Awa D.', trigger: 'Glycémie post-prandiale', value: '1,92 g/L', high: false },
]

export function AlertsPreview() {
  return (
    <Preview>
      <ul className="flex flex-col divide-y divide-line">
        {previewAlerts.map((alert) => (
          <li
            key={alert.name}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{alert.name}</p>
              <p className="text-xs text-muted">{alert.trigger}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`font-display text-sm font-bold ${alert.high ? 'text-danger' : 'text-warning'}`}
              >
                {alert.value}
              </span>
              <Badge tone={alert.high ? 'red' : 'amber'}>
                {alert.high ? 'Haute priorité' : 'Priorité moyenne'}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Preview>
  )
}

const recordFields = [
  { label: 'N° de dossier', value: 'EC-0042' },
  { label: 'Âge', value: '58 ans' },
  { label: 'Dernière mesure', value: "Aujourd'hui, 07:40" },
]

export function RecordPreview() {
  return (
    <Preview>
      <div className="flex items-center gap-3">
        <Avatar initials="MT" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Mariam T.</p>
          <span className="mt-1 inline-flex flex-wrap gap-1.5">
            <Badge tone="blue">Diabète</Badge>
            <Badge tone="violet">Hypertension</Badge>
          </span>
        </div>
      </div>
      <dl className="mt-4 flex flex-col divide-y divide-line border-t border-line">
        {recordFields.map((field) => (
          <div key={field.label} className="flex justify-between gap-3 py-2.5 text-xs last:pb-0">
            <dt className="text-muted">{field.label}</dt>
            <dd className="font-semibold text-ink">{field.value}</dd>
          </div>
        ))}
      </dl>
    </Preview>
  )
}

export function NotePreview() {
  return (
    <Preview>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Observation du médecin</p>
        <Badge tone="green">Alerte clôturée</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">
        Patiente contactée par téléphone. Mesure refaite le lendemain matin, à contrôler lors de la
        prochaine consultation.
      </p>
      <p className="mt-3 text-xs text-muted">Dr S. Bamba • 12 mars, 09:15</p>
    </Preview>
  )
}
