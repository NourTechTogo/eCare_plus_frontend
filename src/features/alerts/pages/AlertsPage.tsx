import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert as AlertMessage } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { SelectField } from '@/components/ui/SelectField'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { StatTile } from '@/components/ui/StatTile'
import { buttonClassName } from '@/components/ui/styles'
import { AlertStatusBadge, SeverityBadge } from '@/features/alerts/components/AlertBadges'
import { useAlerts } from '@/features/alerts/hooks/useAlerts'
import { severityLabels, statusLabels } from '@/features/alerts/labels'
import type { Alert } from '@/features/alerts/types/alert'
import { formatDateTime } from '@/utils/formatDateTime'

const pageDescription = 'Dépassements de seuil signalés par le télésuivi, par ordre de gravité'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

const count = (total: number) => (total === 1 ? '1 alerte' : `${total} alertes`)
const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

function AlertsTable({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-208 border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr>
            {[
              'Gravité',
              'Patient',
              'Déclencheur',
              'Valeur',
              'Déclenchée le',
              'Statut',
              'Action',
            ].map((header) => (
              <th key={header} scope="col" className={headClassName}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const handled = alert.status === 'traitee'
            const action = handled ? 'Voir' : 'Traiter'
            return (
              <tr key={alert.id}>
                <td className={cellClassName}>
                  <SeverityBadge severity={alert.severity} />
                </td>
                <td className={cellClassName}>
                  <p className="font-semibold text-ink">{alert.patientName}</p>
                  <p className="text-xs text-muted">N° {alert.patientFileNumber}</p>
                </td>
                <td className={cellClassName}>{alert.trigger}</td>
                <td
                  className={`${cellClassName} font-display font-bold whitespace-nowrap ${
                    handled
                      ? 'text-ink'
                      : alert.severity === 'critique'
                        ? 'text-danger'
                        : 'text-warning'
                  }`}
                >
                  {alert.value}
                </td>
                <td className={`${cellClassName} whitespace-nowrap`}>
                  {formatDateTime(alert.triggeredAt)}
                </td>
                <td className={cellClassName}>
                  <AlertStatusBadge status={alert.status} />
                </td>
                <td className={cellClassName}>
                  <Link
                    to={`/alertes/${alert.id}`}
                    aria-label={`${action} l'alerte ${alert.id} : ${alert.patientName}`}
                    className={buttonClassName(handled ? 'secondary' : 'primary', 'sm')}
                  >
                    {action}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function AlertsPage() {
  const state = useAlerts()
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')

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

  const open = state.data.filter((alert) => alert.status !== 'traitee')
  const critical = open.filter((alert) => alert.severity === 'critique')
  const shown = state.data.filter(
    (alert) => (!status || alert.status === status) && (!severity || alert.severity === severity),
  )
  // Liste déjà triée par gravité puis par date : les alertes à traiter restent devant.
  const toHandle = shown.filter((alert) => alert.status !== 'traitee')
  const handled = shown.filter((alert) => alert.status === 'traitee')

  return (
    <Page title="File des alertes" description={pageDescription}>
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          tone="red"
          label="Critiques à traiter"
          value={count(critical.length)}
          hint="À vérifier en premier"
        />
        <StatTile
          tone="amber"
          label="En attention à traiter"
          value={count(open.length - critical.length)}
          hint="Hors de la plage normale"
        />
        <StatTile
          tone="green"
          label="Traitées"
          value={count(state.data.length - open.length)}
          hint="Vérifiées et commentées"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-full max-w-xs">
          <SelectField
            label="Statut"
            placeholder="Tous les statuts"
            options={toOptions(statusLabels)}
            showRequirement={false}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />
        </div>
        <div className="w-full max-w-xs">
          <SelectField
            label="Gravité"
            placeholder="Toutes les gravités"
            options={toOptions(severityLabels)}
            showRequirement={false}
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          />
        </div>
      </div>

      <Card title="Alertes à traiter">
        {toHandle.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {status || severity
              ? 'Aucune alerte à traiter ne correspond à ces filtres.'
              : 'Aucune alerte à traiter pour le moment.'}
          </p>
        ) : (
          <AlertsTable alerts={toHandle} />
        )}
      </Card>

      {handled.length > 0 && (
        <Card title="Alertes traitées">
          <AlertsTable alerts={handled} />
        </Card>
      )}
    </Page>
  )
}
