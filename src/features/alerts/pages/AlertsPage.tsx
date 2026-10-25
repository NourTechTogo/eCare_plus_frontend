import { Link } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert as AlertMessage } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { StatTile } from '@/components/ui/StatTile'
import { buttonClassName } from '@/components/ui/styles'
import { PriorityBadge } from '@/features/alerts/components/PriorityBadge'
import { useAlerts } from '@/features/alerts/hooks/useAlerts'
import type { Alert } from '@/features/alerts/types/alert'
import { formatDateTime } from '@/utils/formatDateTime'

const pageDescription = 'Dépassements de seuil signalés par le télésuivi, à vérifier'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

const count = (total: number) => (total === 1 ? '1 alerte' : `${total} alertes`)

function valueClassName(alert: Alert) {
  if (alert.resolution) return 'text-ink'
  return (alert.priority === 'haute' || alert.priority === 'critique') ? 'text-danger' : 'text-warning'
}

function AlertsTable({ alerts, closed = false }: { alerts: Alert[]; closed?: boolean }) {
  const action = closed ? 'Voir' : 'Traiter'

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-208 border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr>
            <th scope="col" className={headClassName}>
              Patient
            </th>
            <th scope="col" className={headClassName}>
              Déclencheur
            </th>
            <th scope="col" className={headClassName}>
              Valeur
            </th>
            <th scope="col" className={headClassName}>
              {closed ? 'Clôturée le' : 'Priorité'}
            </th>
            <th scope="col" className={headClassName}>
              Déclenchée le
            </th>
            <th scope="col" className={headClassName}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td className={cellClassName}>
                <p className="font-semibold text-ink">{alert.patientName}</p>
                <p className="text-xs text-muted">N° {alert.patientFileNumber}</p>
              </td>
              <td className={cellClassName}>{alert.trigger}</td>
              <td
                className={`${cellClassName} font-display font-bold whitespace-nowrap ${valueClassName(alert)}`}
              >
                {alert.value}
              </td>
              <td className={`${cellClassName} whitespace-nowrap`}>
                {alert.resolution ? (
                  formatDateTime(alert.resolution.closedAt)
                ) : (
                  <PriorityBadge priority={alert.priority} />
                )}
              </td>
              <td className={`${cellClassName} whitespace-nowrap`}>
                {formatDateTime(alert.triggeredAt)}
              </td>
              <td className={cellClassName}>
                <Link
                  to={`/alertes/${alert.id}`}
                  aria-label={`${action} l'alerte ${alert.id} : ${alert.patientName}`}
                  className={buttonClassName(closed ? 'secondary' : 'primary', 'sm')}
                >
                  {action}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AlertsPage() {
  const state = useAlerts()

  if (state.status !== 'success') {
    return (
      <Page title="File des alertes" description={pageDescription}>
        {state.status === 'loading' ? (
          <PageSkeleton label="Chargement des alertes…" />
        ) : (
          <AlertMessage variant="error" title="Les alertes n'ont pas pu être chargées.">
            Rechargez la page pour réessayer.
          </AlertMessage>
        )}
      </Page>
    )
  }

  const active = state.data.filter((alert) => !alert.resolution)
  const closed = state.data.filter((alert) => alert.resolution)
  const high = active.filter((alert) => (alert.priority === 'haute' || alert.priority === 'critique'))

  return (
    <Page title="File des alertes" description={pageDescription}>
      {state.refreshError && <AlertMessage variant="error" title="Actualisation impossible">{state.refreshError}</AlertMessage>}
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          tone="red"
          label="Haute priorité"
          value={count(high.length)}
          hint="À vérifier en premier"
        />
        <StatTile
          tone="amber"
          label="Autres alertes actives"
          value={count(active.length - high.length)}
          hint="À vérifier ensuite"
        />
        <StatTile
          tone="green"
          label="Clôturées"
          value={count(closed.length)}
          hint="Vérifiées et consignées"
        />
      </div>

      <Card title="Alertes actives à vérifier">
        {active.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucune alerte active pour le moment.</p>
        ) : (
          <AlertsTable alerts={active} />
        )}
      </Card>

      {closed.length > 0 && (
        <Card title="Alertes clôturées">
          <AlertsTable alerts={closed} closed />
        </Card>
      )}
    </Page>
  )
}
