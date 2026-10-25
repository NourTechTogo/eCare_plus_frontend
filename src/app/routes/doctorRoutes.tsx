import { useState } from 'react'
import {AppointmentStatusBadge,isUpcoming,PatientAppointments,useAppointments} from '@/features/appointments'
import { OpenConversationButton } from '@/features/messaging/components/OpenConversationButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AlertDetailsPage, PriorityBadge, useAlerts } from '@/features/alerts'
import { useAuth } from '@/features/auth'
import { DashboardPage, type DashboardData } from '@/features/dashboard'
import {
  formatMeasurementValue,
  measurementLabel,
  PatientMeasurements,
  useLatestMeasurements,
} from '@/features/measurements'
import { useConversations } from '@/features/messaging'
import { PatientNotes } from '@/features/notes'
import {
  PatientDetailsPage,
  PatientsPage,
  usePatients,
  type PatientColumn,
  type PatientTab,
} from '@/features/patients'
import { formatDateTime } from '@/utils/formatDateTime'
import { PatientDocuments } from '@/features/documents/components/PatientDocuments'
import { PatientTreatments } from '@/features/treatments/components/PatientTreatments'
import { PatientSummary } from '@/features/treatments/components/PatientSummary'

/* Écrans du médecin qui assemblent plusieurs fonctionnalités (patients, alertes, mesures, notes). */

const pending = <span className="text-muted">Chargement…</span>

export function DashboardRoute() {
  const patients = usePatients()
  const alerts = useAlerts()
  const latest = useLatestMeasurements()
  const appointments=useAppointments()
  const [now]=useState(()=>Date.now())
  const conversations = useConversations()
  const sources = [patients, alerts, latest, appointments, conversations]

  let data: DashboardData | null = null
  if (
    patients.status === 'success' &&
    alerts.status === 'success' &&
    latest.status === 'success' &&
    conversations.status === 'success' &&
    appointments.status === 'success'
  ) {
    const active = alerts.data.filter((alert) => !alert.resolution)
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
      upcomingAppointments: appointments.data.filter(item=>isUpcoming(item,now)).map(item=>({id:item.id,patientName:item.patientName,reason:item.reason,scheduledAt:item.scheduledAt,statusBadge:<AppointmentStatusBadge status={item.status}/>})),
      unreadMessageCount: conversations.data.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
      activeAlerts: active
        .map((alert) => ({
          id: alert.id,
          patientName: alert.patientName,
          trigger: alert.trigger,
          value: alert.value,
          highPriority: (alert.priority === 'haute' || alert.priority === 'critique'),
          priorityBadge: <PriorityBadge priority={alert.priority} />,
        }))
        // Tri stable : les alertes en haute priorité passent devant, l'ordre par date est conservé.
,
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
          (alert) => alert.patientId === patient.id && !alert.resolution,
        )
        if (active.length === 0) return <Badge tone="green">Aucune alerte active</Badge>
        const highest = active[0].priority
        return <PriorityBadge priority={highest} />
      },
    },
  ]

  return <PatientsPage canManage={false} columns={columns} />
}

/** Dossier d'un patient vu par le médecin : le suivi médical est réparti en onglets. */
export function DoctorPatientRecordRoute() {
  const { user } = useAuth()
  const authorName = user?.name ?? ''

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
            <OpenConversationButton patientId={patient.id}/>
            <PatientSummary patientId={patient.id}/>
            <PatientMeasurements patientId={patient.id} summary action={seeAll('mesures')} />
            <div className="grid items-start gap-6 xl:grid-cols-2">
              <PatientAppointments patientId={patient.id} summary action={seeAll('rendez-vous')}/>
              <PatientNotes
                patientId={patient.id}
                authorName={authorName}
                summary
                action={seeAll('observations')}
              />
            </div>
          </>
        )
      },
    },
    {
      id: 'mesures',
      label: 'Mesures',
      render: (patient) => <PatientMeasurements patientId={patient.id} />,
    },
    {id:'rendez-vous',label:'Rendez-vous',render:patient=><PatientAppointments patientId={patient.id}/>},
    {id:'documents',label:'Documents',render:patient=><PatientDocuments key={patient.id} patientId={patient.id}/>},
    {id:'traitements',label:'Traitements',render:patient=><PatientTreatments key={patient.id} patientId={patient.id}/>},
    {
      id: 'observations',
      label: 'Observations',
      render: (patient) => <PatientNotes patientId={patient.id} authorName={authorName} />,
    },

  ]

  return <PatientDetailsPage tabs={tabs} />
}

export function AlertRoute() {
  const { user } = useAuth()
  return (
    <AlertDetailsPage
      currentUserName={user?.name ?? ''}
      renderPatientContext={(patientId) => <PatientMeasurements patientId={patientId} />}
    />
  )
}
