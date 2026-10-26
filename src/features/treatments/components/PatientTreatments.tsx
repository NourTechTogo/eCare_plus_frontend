import { useState, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { TreatmentDialog } from '@/features/treatments/components/TreatmentDialog'
import {
  adherenceRate,
  adherenceTone,
  formLabels,
  intakeStatusLabels,
} from '@/features/treatments/labels'
import {
  listIntakes,
  listTreatments,
  stopTreatment,
} from '@/features/treatments/services/treatmentService'
import type { Intake, IntakeStatus, Treatment } from '@/features/treatments/types/treatment'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDate } from '@/utils/formatDate'
import { formatDateTime } from '@/utils/formatDateTime'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

const intakeTones: Record<IntakeStatus, 'green' | 'amber' | 'red' | 'violet'> = {
  pris: 'green',
  reporte: 'violet',
  ignore: 'red',
  non_confirme: 'amber',
}

const toneClasses = {
  success: { text: 'text-success', bar: 'bg-success' },
  warning: { text: 'text-warning', bar: 'bg-warning' },
  danger: { text: 'text-danger', bar: 'bg-danger' },
}

function AdherenceGauge({ rate, label }: { rate: number | null; label: string }) {
  if (rate === null) return <p className="text-sm text-muted">Pas encore de prise enregistrée.</p>
  const tone = toneClasses[adherenceTone(rate)]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <p className={`font-display text-2xl font-bold ${tone.text}`}>{rate} %</p>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rate}
        className="h-2.5 overflow-hidden rounded-full bg-line"
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  )
}

function TreatmentCard({
  treatment,
  intakes,
  onEdit,
  onStop,
}: {
  treatment: Treatment
  intakes: Intake[]
  onEdit?: () => void
  onStop?: () => void
}) {
  const ongoing = treatment.status === 'en_cours'
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-ink">
            {treatment.drugName}{' '}
            <span className="font-semibold text-muted">{treatment.dosage}</span>
          </p>
          <p className="text-sm text-muted">
            {formLabels[treatment.form]} · depuis le {formatDate(treatment.startDate)}
            {treatment.endDate &&
              ` · ${ongoing ? 'jusqu’au' : 'arrêté le'} ${formatDate(treatment.endDate)}`}
          </p>
        </div>
        <Badge tone={ongoing ? 'blue' : 'violet'}>{ongoing ? 'En cours' : 'Terminé'}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {treatment.times.map((time) => (
          <span
            key={time}
            className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-strong tabular-nums"
          >
            {time}
          </span>
        ))}
      </div>
      {treatment.instructions && <p className="text-sm text-ink">{treatment.instructions}</p>}
      {ongoing && <AdherenceGauge rate={adherenceRate(intakes)} label="Observance sur 14 jours" />}
      <p className="text-xs text-muted">Prescrit par {treatment.prescribedBy}</p>
      {ongoing && (onEdit || onStop) && (
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button variant="soft" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          )}
          {onStop && (
            <Button variant="secondary" size="sm" onClick={onStop}>
              Arrêter le traitement
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

function IntakeHistory({ intakes, treatments }: { intakes: Intake[]; treatments: Treatment[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? intakes : intakes.slice(0, 12)
  const nameOf = (id: string) => {
    const treatment = treatments.find((candidate) => candidate.id === id)
    return treatment ? `${treatment.drugName} ${treatment.dosage}` : 'Traitement'
  }
  return (
    <Card title="Historique des prises">
      {intakes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Aucune prise enregistrée pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr>
                  {['Prise prévue', 'Médicament', 'Réponse du patient', 'Répondu le'].map(
                    (header) => (
                      <th key={header} scope="col" className={headClassName}>
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((intake) => (
                  <tr key={intake.id}>
                    <td className={`${cellClassName} whitespace-nowrap`}>
                      {formatDateTime(intake.scheduledAt)}
                    </td>
                    <td className={cellClassName}>{nameOf(intake.treatmentId)}</td>
                    <td className={cellClassName}>
                      <Badge tone={intakeTones[intake.status]}>
                        {intakeStatusLabels[intake.status]}
                      </Badge>
                    </td>
                    <td className={`${cellClassName} whitespace-nowrap text-muted`}>
                      {intake.answeredAt ? formatDateTime(intake.answeredAt) : 'Pas de réponse'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {intakes.length > visible.length && (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" onClick={() => setExpanded(true)}>
                Afficher les {intakes.length} prises
              </Button>
            </div>
          )}
          <p className="text-xs text-muted">
            « Non confirmé » : le patient n'a pas répondu au rappel dans le délai prévu.
          </p>
        </div>
      )}
    </Card>
  )
}

interface PatientTreatmentsProps {
  patientId: string
  /** Résumé : traitements en cours et observance, sans historique ni actions. */
  summary?: boolean
  action?: ReactNode
}

/** Traitements, rappels et observance d'un patient (EF-W2-20 à 25). */
export function PatientTreatments({ patientId, summary = false, action }: PatientTreatmentsProps) {
  const treatmentsState = useAsyncData(`treatments:${patientId}`, () => listTreatments(patientId))
  const intakesState = useAsyncData(`intakes:${patientId}`, () => listIntakes(patientId))
  const [edited, setEdited] = useState<Treatment[] | null>(null)
  const [dialog, setDialog] = useState<
    { kind: 'nouveau' } | { kind: 'modifier' | 'arreter'; treatment: Treatment } | null
  >(null)
  const [stopping, setStopping] = useState(false)
  const feedback = useFeedback()

  if (treatmentsState.status === 'loading' || intakesState.status === 'loading') {
    return (
      <Card title={summary ? 'Traitement en cours' : 'Traitements'}>
        <ListSkeleton label="Chargement des traitements…" />
      </Card>
    )
  }
  if (treatmentsState.status === 'error' || intakesState.status === 'error') {
    return (
      <Alert variant="error" title="Les traitements n'ont pas pu être chargés.">
        Rechargez la page pour réessayer.
      </Alert>
    )
  }

  const treatments = edited ?? treatmentsState.data
  const intakes = intakesState.data
  const ongoing = treatments.filter((treatment) => treatment.status === 'en_cours')
  const finished = treatments.filter((treatment) => treatment.status === 'termine')
  const intakesOf = (treatment: Treatment) =>
    intakes.filter((intake) => intake.treatmentId === treatment.id)
  const ongoingIntakes = intakes.filter((intake) =>
    ongoing.some((treatment) => treatment.id === intake.treatmentId),
  )

  const remember = (saved: Treatment) =>
    setEdited(
      treatments.some((treatment) => treatment.id === saved.id)
        ? treatments.map((treatment) => (treatment.id === saved.id ? saved : treatment))
        : [saved, ...treatments],
    )

  if (summary) {
    return (
      <Card title="Traitement en cours" action={action}>
        {ongoing.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Aucun traitement en cours.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {ongoing.map((treatment) => (
                <li
                  key={treatment.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl bg-page px-4 py-3"
                >
                  <span className="text-sm font-semibold text-ink">
                    {treatment.drugName} {treatment.dosage}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    {treatment.times.join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
            <AdherenceGauge rate={adherenceRate(ongoingIntakes)} label="Observance sur 14 jours" />
          </div>
        )}
      </Card>
    )
  }

  const confirmStop = async (treatment: Treatment) => {
    setStopping(true)
    try {
      remember(await stopTreatment(treatment.id))
      setDialog(null)
      feedback.success(
        'Traitement arrêté',
        'Les rappels de prise sont désactivés dans l’application du patient.',
      )
    } catch {
      feedback.error(
        "Le traitement n'a pas pu être arrêté",
        'Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setStopping(false)
    }
  }

  return (
    <>
      <Card
        title="Observance"
        action={
          <Button onClick={() => setDialog({ kind: 'nouveau' })}>Prescrire un traitement</Button>
        }
      >
        <AdherenceGauge
          rate={adherenceRate(ongoingIntakes)}
          label="Prises confirmées sur les prises prévues, 14 derniers jours"
        />
      </Card>

      <Card title="Traitements en cours">
        {ongoing.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucun traitement en cours.</p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {ongoing.map((treatment) => (
              <TreatmentCard
                key={treatment.id}
                treatment={treatment}
                intakes={intakesOf(treatment)}
                onEdit={() => setDialog({ kind: 'modifier', treatment })}
                onStop={() => setDialog({ kind: 'arreter', treatment })}
              />
            ))}
          </ul>
        )}
      </Card>

      <IntakeHistory intakes={ongoingIntakes} treatments={treatments} />

      {finished.length > 0 && (
        <Card title="Traitements terminés">
          <ul className="grid gap-4 lg:grid-cols-2">
            {finished.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} intakes={[]} />
            ))}
          </ul>
        </Card>
      )}

      {dialog?.kind === 'nouveau' && (
        <TreatmentDialog
          patientId={patientId}
          onClose={() => setDialog(null)}
          onSaved={(saved) => {
            remember(saved)
            setDialog(null)
          }}
        />
      )}
      {dialog?.kind === 'modifier' && (
        <TreatmentDialog
          patientId={patientId}
          treatment={dialog.treatment}
          onClose={() => setDialog(null)}
          onSaved={(saved) => {
            remember(saved)
            setDialog(null)
          }}
        />
      )}
      {dialog?.kind === 'arreter' && (
        <Dialog
          title="Arrêter le traitement ?"
          description={`${dialog.treatment.drugName} ${dialog.treatment.dosage}`}
          onClose={() => setDialog(null)}
        >
          <div className="flex flex-col gap-5">
            <p className="text-sm text-ink">
              Le traitement passera dans les traitements terminés et le patient ne recevra plus de
              rappel. Son historique de prises est conservé.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" disabled={stopping} onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button loading={stopping} onClick={() => void confirmStop(dialog.treatment)}>
                Arrêter le traitement
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}
