import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert as AlertMessage } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { tabId, tabPanelId } from '@/components/ui/tabIds'
import { Tabs } from '@/components/ui/Tabs'
import { TextareaField } from '@/components/ui/TextareaField'
import { AlertStatusBadge, SeverityBadge } from '@/features/alerts/components/AlertBadges'
import { useAlert } from '@/features/alerts/hooks/useAlerts'
import { handleAlert, markAlertSeen } from '@/features/alerts/services/alertService'
import type { Alert } from '@/features/alerts/types/alert'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDateTime } from '@/utils/formatDateTime'

const backLink = { to: '/alertes', label: 'Retour à la file des alertes' }

/** Paramètre d'adresse qui retient l'onglet ouvert, comme sur le dossier patient. */
const TAB_PARAM = 'onglet'
const alertTabs = [
  { id: 'traitement', label: 'Traitement' },
  { id: 'mesures', label: 'Mesures du patient' },
]

const verificationSteps = [
  'Prendre contact avec le patient pour vérifier son état général.',
  'Vérifier les conditions de la mesure (à jeun, après un repas, au repos).',
  'Consigner vos observations avant de marquer l’alerte comme traitée.',
]

const COMMENT_MAX_LENGTH = 2000

interface AlertDetailsPageProps {
  /** Contexte du patient (par exemple ses mesures), composé par l'application. */
  renderPatientContext?: (patientId: string) => ReactNode
  /** Actions de contact du patient (message, appel, dossier), composées par l'application. */
  renderContactActions?: (alert: Alert) => ReactNode
}

const bannerTones = {
  critique: { box: 'border-danger-line bg-danger-soft', title: 'text-danger' },
  attention: { box: 'border-warning-line bg-warning-soft', title: 'text-warning' },
  traitee: { box: 'border-success-line bg-success-soft', title: 'text-success' },
}

function AlertBanner({ alert }: { alert: Alert }) {
  const tone = bannerTones[alert.status === 'traitee' ? 'traitee' : alert.severity]
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border px-6 py-5 transition-colors duration-300 ${tone.box}`}
    >
      <div className="flex flex-col gap-1">
        <p className={`font-display text-lg font-bold ${tone.title}`}>
          {alert.trigger} : {alert.value}
        </p>
        <p className="text-sm text-ink">
          Déclenchée le {formatDateTime(alert.triggeredAt)} • Seuil franchi : {alert.threshold} •
          Patient : {alert.patientName} (N° {alert.patientFileNumber})
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <SeverityBadge severity={alert.severity} />
        <AlertStatusBadge status={alert.status} />
      </div>
    </div>
  )
}

function validateComment(value: string) {
  return value.trim() ? undefined : 'Indiquez ce qui a été fait ou décidé.'
}

function HandlingForm({ alert, onHandled }: { alert: Alert; onHandled: (alert: Alert) => void }) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const feedback = useFeedback()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextError = validateComment(comment)
    setError(nextError)
    if (nextError) {
      document.getElementById('alert-comment')?.focus()
      return
    }
    setSubmitting(true)
    try {
      onHandled(await handleAlert(alert.id, comment.trim()))
      feedback.success('Alerte traitée', 'Votre commentaire est enregistré dans le dossier.')
    } catch {
      feedback.error(
        "L'alerte n'a pas pu être enregistrée comme traitée",
        'Votre commentaire est conservé. Vérifiez votre connexion puis réessayez.',
      )
      setSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <TextareaField
        id="alert-comment"
        label="Commentaire de traitement"
        required
        maxLength={COMMENT_MAX_LENGTH}
        placeholder="Échange avec le patient, vérifications faites, suite donnée…"
        value={comment}
        error={error}
        disabled={submitting}
        onChange={(event) => {
          setComment(event.target.value)
          if (error) setError(validateComment(event.target.value))
        }}
      />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Enregistrement…' : 'Marquer comme traitée'}
      </Button>
    </form>
  )
}

export function AlertDetailsPage({
  renderPatientContext,
  renderContactActions,
}: AlertDetailsPageProps) {
  const { alertId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useAlert(alertId)
  // Dernière version de l'alerte après une action (vue, traitée), affichée à la place de celle chargée.
  const [updated, setUpdated] = useState<Alert>()
  const title = alertId ? `Traitement de l'alerte ${alertId}` : "Traitement de l'alerte"

  const loaded = state.status === 'success' ? state.data : null
  // Ouvrir une nouvelle alerte la marque comme vue (EF-W2-15).
  useEffect(() => {
    if (!loaded || loaded.status !== 'nouvelle') return
    let active = true
    markAlertSeen(loaded.id)
      .then((seen) => {
        if (active) setUpdated(seen)
      })
      .catch(() => {
        // Le statut reste « nouvelle » ; il sera mis à jour à la prochaine ouverture.
      })
    return () => {
      active = false
    }
  }, [loaded])

  if (state.status === 'loading') {
    return (
      <Page title={title} backLink={backLink}>
        <PageSkeleton label="Chargement de l'alerte…" />
      </Page>
    )
  }

  if (state.status === 'error' || !state.data) {
    return (
      <Page title={title} backLink={backLink}>
        {state.status === 'error' ? (
          <AlertMessage variant="error" title="L'alerte n'a pas pu être chargée.">
            Rechargez la page pour réessayer.
          </AlertMessage>
        ) : (
          <AlertMessage variant="error" title="Cette alerte est introuvable.">
            Vérifiez le lien utilisé ou revenez à la file des alertes.
          </AlertMessage>
        )}
      </Page>
    )
  }

  const alert = updated?.id === state.data.id ? updated : state.data
  const requested = searchParams.get(TAB_PARAM)
  const activeId = alertTabs.find((tab) => tab.id === requested)?.id ?? alertTabs[0].id

  return (
    <Page
      title={title}
      description="Vérification d'un dépassement de seuil signalé par le télésuivi"
      backLink={backLink}
    >
      <AlertBanner alert={alert} />

      <Tabs
        label="Rubriques de l'alerte"
        tabs={alertTabs}
        active={activeId}
        // Changer d'onglet ne crée pas d'étape d'historique : « Retour » ramène à la file.
        onChange={(id) => setSearchParams({ [TAB_PARAM]: id }, { replace: true })}
      />

      <div
        key={activeId}
        id={tabPanelId(activeId)}
        role="tabpanel"
        aria-labelledby={tabId(activeId)}
        className="flex animate-enter flex-col gap-6"
      >
        {activeId === 'mesures' ? (
          renderPatientContext?.(alert.patientId)
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Card title="Procédure de vérification">
                <p className="text-sm text-muted">
                  Une alerte de télésuivi signale un dépassement de seuil : aucun diagnostic n'est
                  posé automatiquement. L'interprétation reste celle du professionnel de santé.
                </p>
                <ol className="mt-4 flex flex-col gap-3">
                  {verificationSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 text-sm text-ink">
                      <span
                        aria-hidden="true"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-strong"
                      >
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>
              {renderContactActions?.(alert)}
            </div>

            <Card title="Traitement">
              {alert.status === 'traitee' ? (
                <div className="rounded-lg bg-page p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                    Traitée par {alert.handledBy}
                    {alert.handledAt && ` le ${formatDateTime(alert.handledAt)}`}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-ink">
                    {alert.handledComment}
                  </p>
                </div>
              ) : (
                <HandlingForm alert={alert} onHandled={setUpdated} />
              )}
            </Card>
          </div>
        )}
      </div>
    </Page>
  )
}
