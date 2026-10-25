import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { formatDateTime } from '@/utils/formatDateTime'

export interface TrendSeries {
  label: string
  /** Couleur CSS du tracé. */
  color: string
  /** Points triés par date croissante. */
  points: { time: number; value: number }[]
}

interface TrendChartProps {
  title: string
  series: TrendSeries[]
  /** Seuil de la règle de suivi : tracé en pointillés, la zone au-dessus est teintée. */
  threshold?: number
  /** Valeur avec son unité, par exemple « 1,31 g/L ». */
  formatValue: (value: number) => string
}

const HEIGHT = 280
const MARGIN = { top: 20, bottom: 32, left: 52 }
const DIRECT_LABEL_WIDTH = 112
const MIN_LABEL_GAP = 16
const MAX_DAY_LABELS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const dayFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

/** Graduations « rondes » couvrant l'intervalle, environ quatre. */
function niceTicks(min: number, max: number) {
  const rawStep = (max - min || 1) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((s) => s >= rawStep) ?? rawStep
  const ticks: number[] = []
  // La dernière graduation est la première à atteindre le maximum : aucune valeur ne dépasse l'axe.
  for (let tick = Math.floor(min / step) * step; ; tick += step) {
    ticks.push(Number(tick.toPrecision(10)))
    if (tick >= max) return ticks
  }
}

/** Minuits compris dans l'intervalle, espacés pour ne pas dépasser `MAX_DAY_LABELS` libellés. */
function dayTicks(min: number, max: number, maxLabels = MAX_DAY_LABELS) {
  const days: number[] = []
  const day = new Date(min)
  day.setHours(0, 0, 0, 0)
  if (day.getTime() < min) day.setDate(day.getDate() + 1)
  for (; day.getTime() <= max; day.setDate(day.getDate() + 1)) days.push(day.getTime())
  const every = Math.ceil(days.length / maxLabels)
  // On compte à rebours depuis le dernier jour, pour que la date la plus récente soit toujours libellée.
  return days.filter((_, index) => (days.length - 1 - index) % every === 0)
}

/** Résumé chiffré d'une série : dernière valeur, étendue et variation sur la période. */
function summarize(points: TrendSeries['points']) {
  const values = points.map((point) => point.value)
  const first = points[0]
  const last = points[points.length - 1]
  return {
    last: last.value,
    min: Math.min(...values),
    max: Math.max(...values),
    change: last.value - first.value,
    days: Math.round((last.time - first.time) / DAY_MS),
  }
}

/**
 * Courbe d'évolution d'une mesure dans le temps.
 * Les valeurs exactes restent disponibles au survol et dans le tableau d'historique.
 */
export function TrendChart({ title, series, threshold, formatValue }: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)

  // Le tracé suit la largeur réelle du conteneur pour que le texte garde une taille lisible.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Mesure immédiate, sans attendre le premier passage de l'observateur.
    setWidth(container.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const multiple = series.length > 1
  const directLabels = multiple && width >= 480
  const marginRight = directLabels ? DIRECT_LABEL_WIDTH : 20
  const plotWidth = Math.max(width - MARGIN.left - marginRight, 10)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const plotBottom = MARGIN.top + plotHeight

  const times = [...new Set(series.flatMap((s) => s.points.map((point) => point.time)))].sort(
    (a, b) => a - b,
  )
  const values = series.flatMap((s) => s.points.map((point) => point.value))
  if (threshold !== undefined) values.push(threshold)
  const yTicks = niceTicks(Math.min(...values), Math.max(...values))
  const [yMin, yMax] = [yTicks[0], yTicks[yTicks.length - 1]]
  const [tMin, tMax] = [times[0], times[times.length - 1]]

  const x = (time: number) =>
    MARGIN.left + (tMax === tMin ? plotWidth / 2 : ((time - tMin) / (tMax - tMin)) * plotWidth)
  const y = (value: number) => MARGIN.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight
  const isAbove = (value: number) => threshold !== undefined && value > threshold
  const unitless = (value: number) => formatValue(value).replace(/\s\D+$/, '')
  const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatValue(Math.abs(value))}`

  // Étiquettes en bout de courbe, écartées quand deux séries se terminent trop près l'une de l'autre.
  const endLabels = series
    .map((s) => ({ label: s.label, y: y(s.points[s.points.length - 1].value) }))
    .sort((a, b) => a.y - b.y)
  for (let index = 1; index < endLabels.length; index += 1) {
    endLabels[index].y = Math.max(endLabels[index].y, endLabels[index - 1].y + MIN_LABEL_GAP)
  }

  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const pointerX = event.clientX - event.currentTarget.getBoundingClientRect().left + MARGIN.left
    setHoveredTime(
      times.reduce((nearest, time) =>
        Math.abs(x(time) - pointerX) < Math.abs(x(nearest) - pointerX) ? time : nearest,
      ),
    )
  }

  const hovered =
    hoveredTime === null
      ? []
      : series.flatMap((s) => {
          const point = s.points.find((candidate) => candidate.time === hoveredTime)
          return point ? [{ label: s.label, color: s.color, value: point.value }] : []
        })

  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="flex flex-col gap-3">
        <span className="font-display text-sm font-bold text-ink">{title}</span>
        <ul className="flex flex-col gap-2">
          {series.map((s) => {
            const summary = summarize(s.points)
            return (
              <li
                key={s.label}
                className="flex flex-wrap items-baseline gap-x-5 gap-y-1 rounded-lg bg-page px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {multiple ? s.label : 'Dernière valeur'}
                </span>
                <span className="font-display text-lg font-bold text-ink">
                  {formatValue(summary.last)}
                </span>
                <span className="text-muted">
                  Min {unitless(summary.min)} • Max {unitless(summary.max)}
                </span>
                {s.points.length > 1 && (
                  <span className="text-muted">
                    <span aria-hidden="true">
                      {summary.change > 0 ? '↗ ' : summary.change < 0 ? '↘ ' : '→ '}
                    </span>
                    {signed(summary.change)} en {summary.days} jours
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </figcaption>

      <div ref={containerRef} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${title} : courbe d'évolution. Les valeurs exactes figurent dans l'historique des mesures.`}
            className="block text-xs"
          >
            {threshold !== undefined && (
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={plotWidth}
                height={y(threshold) - MARGIN.top}
                fill="var(--color-danger-soft)"
                opacity="0.6"
              />
            )}

            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + plotWidth}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--color-line)"
                />
                <text
                  x={MARGIN.left - 10}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--color-muted)"
                >
                  {unitless(tick)}
                </text>
              </g>
            ))}

            {dayTicks(tMin, tMax, Math.max(2, Math.min(MAX_DAY_LABELS, Math.floor(plotWidth / 80)))).map((tick) => (
              <text
                key={tick}
                x={x(tick)}
                y={HEIGHT - 10}
                textAnchor="middle"
                fill="var(--color-muted)"
              >
                {dayFormatter.format(tick)}
              </text>
            ))}

            {threshold !== undefined && (
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={y(threshold)}
                y2={y(threshold)}
                stroke="var(--color-danger)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            )}

            {hoveredTime !== null && (
              <line
                x1={x(hoveredTime)}
                x2={x(hoveredTime)}
                y1={MARGIN.top}
                y2={plotBottom}
                stroke="var(--color-control)"
              />
            )}

            {series.map((s) => {
              const line = s.points.map((point) => `${x(point.time)},${y(point.value)}`).join(' ')
              const first = s.points[0]
              const last = s.points[s.points.length - 1]
              return (
                <g key={s.label}>
                  {/* Aplat sous la courbe, réservé à une série seule pour ne pas brouiller la lecture. */}
                  {!multiple && s.points.length > 1 && (
                    <polygon
                      points={`${x(first.time)},${plotBottom} ${line} ${x(last.time)},${plotBottom}`}
                      fill={s.color}
                      opacity="0.1"
                    />
                  )}
                  <polyline
                    points={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {s.points.map((point) => (
                    <circle
                      key={point.time}
                      cx={x(point.time)}
                      cy={y(point.value)}
                      r={point.time === hoveredTime ? 7 : 4.5}
                      fill={isAbove(point.value) ? 'var(--color-danger)' : s.color}
                      stroke="var(--color-surface)"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )
            })}

            {/* Libellé du seuil tracé après les courbes, sur un liseré, pour rester lisible. */}
            {threshold !== undefined && (
              <text
                x={MARGIN.left + 6}
                y={y(threshold) - 7}
                fill="var(--color-danger)"
                fontWeight="600"
                stroke="var(--color-surface)"
                strokeWidth="4"
                paintOrder="stroke"
              >
                Seuil d'alerte : {formatValue(threshold)}
              </text>
            )}

            {directLabels &&
              endLabels.map((endLabel) => (
                <text
                  key={endLabel.label}
                  x={MARGIN.left + plotWidth + 12}
                  y={endLabel.y}
                  dominantBaseline="middle"
                  fill="var(--color-ink)"
                  fontWeight="600"
                >
                  {endLabel.label}
                </text>
              ))}

            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerMove}
              onPointerLeave={() => setHoveredTime(null)}
            />
          </svg>
        )}

        {hoveredTime !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-56 max-w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md"
            style={{ left: Math.max(0, Math.min(x(hoveredTime) + 12, width - Math.min(224, width))) }}
          >
            <p className="text-muted">
              {formatDateTime(new Date(hoveredTime).toISOString())}
            </p>
            {hovered.map((item) => (
              <p key={item.label} className="mt-1 text-ink">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {multiple && <span className="text-muted">{item.label} :</span>}
                  <span className="text-sm font-semibold">{formatValue(item.value)}</span>
                </span>
                {isAbove(item.value) && (
                  <span className="font-semibold text-danger">Au-dessus du seuil d'alerte</span>
                )}
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}
