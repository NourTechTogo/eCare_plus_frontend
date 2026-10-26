import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AlertDetailsPage, SeverityBadge, useAlerts } from '@/features/alerts'
import {
  AppointmentStatusBadge,
  isUpcoming,
  PatientAppointments,
  useAppointments,
} from '@/features/appointments'
import { ArticleEditorPage, ArticlePage, ArticlesPage } from '@/features/articles'
import { useAuth } from '@/features/auth'
import { DashboardPage, type DashboardData } from '@/features/dashboard'
import { PatientDocuments } from '@/features/documents'
import {
  formatMeasurementValue,
  measurementLabel,
  PatientMeasurements,
  PatientThresholds,
  useLatestMeasurements,
} from '@/features/measurements'
import { useConversations } from '@/features/messaging'
import { openConversation } from '@/features/messaging/services/messagingService'
import { PatientNotes } from '@/features/notes'
import {
  PatientDetailsPage,
  PatientsPage,
  usePatients,
  type PatientColumn,
  type PatientTab,
} from '@/features/patients'
import { PatientTreatments } from '@/features/treatments'
import { useFeedback } from '@/hooks/useFeedback'
import { formatDateTime } from '@/utils/formatDateTime'

/* Écrans du médecin qui assemblent plusieurs fonctionnalités (patients, alertes, mesures, notes…). */

const pending = <span className="text-muted">Chargement…</span>

/** « Écrire » et « Appeler » : ouvrent la conversation du patient, en la créant au besoin. */
function ContactActions({ patientId }: { patientId: string }) {
  const navigate = useNavigate()
  const feedback = useFeedback()
  const [opening, setOpening] = useState<'message' | 'appel' | null>(null)

  const open = async (mode: 'message' | 'appel') => {
    setOpening(mode)
    try {
      const conversation = await openConversation(patientId)
      await navigate(`/messagerie/${conversation.id}${mode === 'appel' ? '?appel=audio' : ''}`)
    } catch {
      feedback.error(
        "La conversation n'a pas pu être ouverte",
        'Vérifiez votre connexion puis réessayez.',
      )
      setOpening(null)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        loading={opening === 'message'}
        disabled={opening !== null}
        onClick={() => void open('message')}
      >
        Écrire au patient
      </Button>
      <Button
        loading={opening === 'appel'}
        disabled={opening !== null}
        onClick={() => void open('appel')}
      >
        Appeler
      </Button>
    </>
  )
}

export function DashboardRoute() {
  const patients = usePatients()
  const alerts = useAlerts()
  const latest = useLatestMeasurements()
  const appointments = useAppointments()
  const conversations = useConversations()
  const [now] = useState(() => Date.now())
  const sources = [patients, alerts, latest, appointments, conversations]

  let data: DashboardData | null = null
  if (
    patients.status === 'success' &&
    alerts.status === 'success' &&
    latest.status === 'success' &&
    appointments.status === 'success' &&
    conversations.status === 'success'
  ) {
    data = {
      patientCount: patients.patients.length,
      recentMeasurements: patients.patients
        .flatMap((patient) => {
          const measurement = latest.data[patient.id]
          return measurement
            ? [
                {
                  patientId: patient.id,
                  patientName: `${patient.firstName} ${patient.lastName}`,
                  label: measurementLabel(measurement),
                  value: formatMeasurementValue(measurement),
                  recordedAt: measurement.recordedAt,
                },
              ]
            : []
        })
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
      upcomingAppointments: appointments.data
        .filter((appointment) => isUpcoming(appointment, now))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .map((appointment) => ({
          id: appointment.id,
          patientName: appointment.patientName,
          reason: appointment.reason,
          scheduledAt: appointment.scheduledAt,
          statusBadge: <AppointmentStatusBadge status={appointment.status} />,
        })),
      unreadMessageCount: conversations.data.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
      // Le service renvoie déjà les alertes triées par gravité puis par date.
      activeAlerts: alerts.data
        .filter((alert) => alert.status !== 'traitee')
        .map((alert) => ({
          id: alert.id,
          patientName: alert.patientName,
          trigger: alert.trigger,
          value: alert.value,
          highPriority: alert.severity === 'critique',
          priorityBadge: <SeverityBadge severity={alert.severity} />,
        })),
    }
  }

  return <DashboardPage data={data} failed={sources.some(({ status }) => status === 'error')} />
}

/** Liste des patients du médecin : les colonnes administratives laissent place au suivi. */
export function DoctorPatientsRoute() {
  const latest = useLatestMeasurements()
  const alerts = useAlerts()

  const columns: PatientColumn[] = [
    {
      header: 'Dernière mesure',
      render: (patient) => {
        if (latest.status !== 'success') return latest.status === 'loading' ? pending : '—'
        const measurement = latest.data[patient.id]
        return measurement ? (
          formatDateTime(measurement.recordedAt)
        ) : (
          <span className="text-muted">Aucune mesure</span>
        )
      },
    },
    {
      header: 'Valeur',
      render: (patient) => {
        const measurement = latest.status === 'success' ? latest.data[patient.id] : undefined
        return measurement ? (
          <>
            <span className="font-display font-bold text-ink">
              {formatMeasurementValue(measurement)}
            </span>{' '}
            <span className="text-xs text-muted">({measurementLabel(measurement)})</span>
          </>
        ) : (
          '—'
        )
      },
    },
    {
      header: 'Alertes',
      render: (patient) => {
        if (alerts.status !== 'success') return alerts.status === 'loading' ? pending : '—'
        const active = alerts.data.filter(
          (alert) => alert.patientId === patient.id && alert.status !== 'traitee',
        )
        if (active.length === 0) return <Badge tone="green">Aucune alerte active</Badge>
        const severity = active.some((alert) => alert.severity === 'critique')
          ? 'critique'
          : 'attention'
        return (
          <span className="inline-flex items-center gap-2">
            <SeverityBadge severity={severity} />
            {active.length > 1 && (
              <span className="text-xs text-muted">{active.length} alertes</span>
            )}
          </span>
        )
      },
    },
  ]

  return <PatientsPage canManage={false} columns={columns} />
}

/** Dossier d'un patient vu par le médecin : le suivi médical est réparti en onglets. */
export function DoctorPatientRecordRoute() {
  const { user } = useAuth()
  const currentUserId = user?.id ?? ''

  const tabs: PatientTab[] = [
    {
      id: 'resume',
      label: 'Résumé',
      // Un aperçu de chaque rubrique ; « Tout voir » ouvre l'onglet correspondant.
      render: (patient, openTab) => {
        const seeAll = (tab: string) => (
          <Button variant="soft" size="sm" onClick={() => openTab(tab)}>
            Tout voir
          </Button>
        )
        return (
          <>
            <PatientMeasurements patientId={patient.id} summary action={seeAll('mesures')} />
            <div className="grid items-start gap-6 xl:grid-cols-2">
              <PatientTreatments patientId={patient.id} summary action={seeAll('traitements')} />
              <PatientAppointments patientId={patient.id} summary action={seeAll('rendez-vous')} />
            </div>
            <PatientNotes
              patientId={patient.id}
              currentUserId={currentUserId}
              summary
              action={seeAll('notes')}
            />
          </>
        )
      },
    },
    {
      id: 'mesures',
      label: 'Mesures',
      render: (patient) => <PatientMeasurements patientId={patient.id} />,
    },
    {
      id: 'traitements',
      label: 'Traitements',
      render: (patient) => <PatientTreatments patientId={patient.id} />,
    },
    {
      id: 'documents',
      label: 'Documents',
      render: (patient) => <PatientDocuments patientId={patient.id} />,
    },
    {
      id: 'notes',
      label: 'Notes',
      render: (patient) => <PatientNotes patientId={patient.id} currentUserId={currentUserId} />,
    },
    {
      id: 'seuils',
      label: 'Seuils',
      render: (patient) => <PatientThresholds patientId={patient.id} />,
    },
    {
      id: 'rendez-vous',
      label: 'Rendez-vous',
      render: (patient) => <PatientAppointments patientId={patient.id} />,
    },
  ]

  return (
    <PatientDetailsPage
      tabs={tabs}
      // Le médecin ne voit que les patients dont il est le référent.
      referentName={(doctorId) => (doctorId === user?.id ? `${user.name} (vous)` : undefined)}
      renderActions={(patient) => <ContactActions patientId={patient.id} />}
    />
  )
}

export function AlertRoute() {
  return (
    <AlertDetailsPage
      renderPatientContext={(patientId) => <PatientMeasurements patientId={patientId} summary />}
      renderContactActions={(alert) => <ContactActions patientId={alert.patientId} />}
    />
  )
}

export function ArticlesRoute() {
  const { user } = useAuth()
  return <ArticlesPage currentUserId={user?.id ?? ''} />
}

export function ArticleRoute() {
  const { user } = useAuth()
  return <ArticlePage currentUserId={user?.id ?? ''} />
}

export function ArticleEditorRoute() {
  const { user } = useAuth()
  return <ArticleEditorPage authorName={user?.name ?? ''} />
}
