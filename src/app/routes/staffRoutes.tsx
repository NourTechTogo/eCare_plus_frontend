import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { buttonClassName } from '@/components/ui/styles'
import { Page } from '@/components/layouts/Page'
import {
  CreatePatientPage,
  EditPatientPage,
  PatientDetailsPage,
  PatientsPage,
  ReferencePatientPage,
  type PatientColumn,
  type ReferentOption,
} from '@/features/patients'
import { useDoctors, type Doctor } from '@/features/staff'
import { formatDate } from '@/utils/formatDate'

/* Écrans du personnel de l'établissement qui croisent les dossiers patients et l'équipe médicale. */

const doctorName = (doctor: Pick<Doctor, 'firstName' | 'lastName'>) =>
  `Dr ${doctor.firstName} ${doctor.lastName}`

const toReferent = (doctor: Doctor): ReferentOption => ({
  id: doctor.id,
  name: doctorName(doctor),
  specialty: doctor.specialty,
  patientCount: doctor.patientCount,
})

/** Charge l'équipe médicale, puis affiche l'écran ; seuls les médecins actifs sont proposés. */
function WithReferents({
  title,
  render,
}: {
  title: string
  render: (doctors: ReferentOption[]) => ReactNode
}) {
  const state = useDoctors()
  if (state.status === 'success') {
    return render(state.data.filter((doctor) => doctor.status === 'actif').map(toReferent))
  }
  return (
    <Page title={title}>
      {state.status === 'loading' ? (
        <PageSkeleton label="Chargement de l'équipe médicale…" />
      ) : (
        <Alert variant="error" title="L'équipe médicale n'a pas pu être chargée.">
          Rechargez la page pour réessayer.
        </Alert>
      )}
    </Page>
  )
}

export function CreatePatientRoute() {
  return (
    <WithReferents
      title="Nouveau patient"
      render={(doctors) => <CreatePatientPage doctors={doctors} />}
    />
  )
}

export function EditPatientRoute() {
  return (
    <WithReferents
      title="Modifier le dossier"
      render={(doctors) => <EditPatientPage doctors={doctors} />}
    />
  )
}

export function ReferencePatientRoute() {
  return (
    <WithReferents
      title="Référencer un patient"
      render={(doctors) => <ReferencePatientPage doctors={doctors} />}
    />
  )
}

/** Liste des patients côté établissement : médecin référent et activation du compte mobile. */
export function StaffPatientsRoute() {
  const doctors = useDoctors()
  const referent = (doctorId: string) => {
    if (doctors.status !== 'success') return <span className="text-muted">…</span>
    const doctor = doctors.data.find((candidate) => candidate.id === doctorId)
    return doctor ? doctorName(doctor) : <span className="text-muted">Non affecté</span>
  }

  const columns: PatientColumn[] = [
    { header: 'Médecin référent', render: (patient) => referent(patient.referentDoctorId) },
    {
      header: 'Compte mobile',
      render: (patient) =>
        patient.status === 'actif' ? (
          <Badge tone="green">Activé</Badge>
        ) : (
          <Badge tone="amber">En attente d'activation</Badge>
        ),
    },
    { header: 'Dossier créé le', render: (patient) => formatDate(patient.createdAt) },
  ]

  return <PatientsPage canManage columns={columns} />
}

export function StaffPatientRecordRoute() {
  const doctors = useDoctors()
  const referentName = (doctorId: string) => {
    if (doctors.status !== 'success') return undefined
    const doctor = doctors.data.find((candidate) => candidate.id === doctorId)
    return doctor ? `${doctorName(doctor)}, ${doctor.specialty}` : undefined
  }
  return (
    <PatientDetailsPage
      referentName={referentName}
      renderActions={(patient) => (
        <Link to={`/patients/${patient.id}/modifier`} className={buttonClassName('secondary')}>
          Modifier le dossier
        </Link>
      )}
    />
  )
}
