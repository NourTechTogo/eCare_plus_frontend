import { useState, type FormEvent, type ReactNode } from 'react'
import { TargetNotes } from '@/features/targeted-notes/components/TargetNotes'
import { Link, useParams, useSearchParams } from 'react-router'
import { OpenConversationButton } from '@/features/messaging/components/OpenConversationButton'
import { Page } from '@/components/layouts/Page'
import { Alert as AlertMessage } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { buttonClassName } from '@/components/ui/styles'
import { tabId, tabPanelId } from '@/components/ui/tabIds'
import { Tabs } from '@/components/ui/Tabs'
import { TextareaField } from '@/components/ui/TextareaField'
import { useAlert } from '@/features/alerts/hooks/useAlerts'
import { closeAlert } from '@/features/alerts/services/alertService'
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
  "Consigner vos observations avant de clôturer l'alerte.",
]

interface AlertDetailsPageProps {
  /** Nom du professionnel connecté, enregistré à la clôture. */
  currentUserName: string
  /** Contexte du patient (par exemple ses mesures), composé par l'application. */
  renderPatientContext?: (patientId: string) => ReactNode
}

function AlertBanner({ alert }: { alert: Alert }) {
  const closed = Boolean(alert.resolution)
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border px-6 py-5 transition-colors duration-300 ${
        closed ? 'border-success-line bg-success-soft' : 'border-danger-line bg-danger-soft'
      }`}
    >
      <div className="flex flex-col gap-1">
        <p className={`font-display text-lg font-bold ${closed ? 'text-success' : 'text-danger'}`}>
          {closed ? 'Alerte clôturée' : 'Alerte active'} : {alert.trigger} ({alert.value})
        </p>
        <p className="text-sm text-ink">
          Déclenchée le {formatDateTime(alert.triggeredAt)} • Seuil de la règle : {alert.threshold} •
          Patient : {alert.patientName} (N° {alert.patientFileNumber})
        </p>
      </div>
      <span
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white transition-colors duration-300 ${
          closed ? 'bg-success' : 'bg-danger'
        }`}
      >
        {{NOUVELLE:'Nouvelle',PRISE_EN_CHARGE:'Prise en charge',TRANSMISE:'Transmise',CLOTUREE:'Clôturée'}[alert.status] ?? alert.status}
      </span>
    </div>
  )
}

interface ResolutionFormProps {
  alert: Alert
  currentUserName: string
  onClosed: (alert: Alert) => void
}

function validateNote(value: string) {
  return value.trim() ? undefined : 'Veuillez renseigner une observation.'
}

function ResolutionForm({ alert, currentUserName, onClosed }: ResolutionFormProps) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const feedback = useFeedback()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextError = validateNote(note)
    setError(nextError)
    if (nextError) {
      document.getElementById('alert-note')?.focus()
      return
    }
    setSubmitting(true)
    try {
      onClosed(await closeAlert(alert.id, note.trim(), currentUserName))
      feedback.success('Alerte clôturée', 'Vos observations sont enregistrées.')
    } catch (error) {
      feedback.error(
        "L'alerte n'a pas pu être clôturée",
        error instanceof Error ? error.message : 'Vos observations sont conservées. Réessayez.',
      )
      setSubmitting(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-4"
    >
      <TextareaField
        id="alert-note"
        label="Observations cliniques"
        required
        placeholder="Compte rendu de l'échange avec le patient…"
        value={note}
        error={error}
        disabled={submitting}
        onChange={(event) => {
          setNote(event.target.value)
          if (error) setError(validateNote(event.target.value))
        }}
      />
      <Button type="submit" loading={submitting}>
        {submitting ? 'Clôture en cours…' : "Clôturer l'alerte"}
      </Button>
    </form>
  )
}

export function AlertDetailsPage({ currentUserName, renderPatientContext }: AlertDetailsPageProps) {
  const { alertId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useAlert(alertId)
  // Alerte renvoyée par la clôture, affichée à la place de celle chargée au départ.
  const [closedAlert, setClosedAlert] = useState<Alert>()
  const title = alertId ? `Traitement de l'alerte ${alertId}` : "Traitement de l'alerte"

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

  const justClosed = closedAlert?.id === state.data.id
  const alert = justClosed && closedAlert ? closedAlert : state.data
  // Onglet affiché : celui demandé dans l'adresse s'il existe, sinon « Traitement ».
  const requested = searchParams.get(TAB_PARAM)
  const activeId = alertTabs.find((tab) => tab.id === requested)?.id ?? alertTabs[0].id

  return (
    <Page
      title={title}
      description="Vérification d'un dépassement de seuil signalé par le télésuivi"
      backLink={backLink}
    >
      <AlertBanner alert={alert} />
      <TargetNotes type="ALERTE" id={alert.id}/>
      <OpenConversationButton patientId={alert.patientId}/>

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
            <Card title="Procédure de vérification">
              <p className="text-sm text-muted">
                Il s'agit d'une alerte de télésuivi : aucun diagnostic n'est posé automatiquement.
                L'interprétation reste celle du professionnel de santé.
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

            <div className="flex flex-col gap-6">
              <Card title="Résolution">
                {alert.resolution ? (
                  <div className="rounded-lg bg-page p-4">
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Observations de {alert.resolution.closedBy} (
                      {formatDateTime(alert.resolution.closedAt)})
                    </p>
                    <p className="mt-2 text-sm text-ink">{alert.resolution.note}</p>
                  </div>
                ) : (
                  <ResolutionForm
                    alert={alert}
                    currentUserName={currentUserName}
                    onClosed={setClosedAlert}
                  />
                )}
              </Card>

              <Link
                to={`/patients/${alert.patientId}`}
                className={`self-start ${buttonClassName('secondary')}`}
              >
                Consulter le dossier du patient
              </Link>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}
