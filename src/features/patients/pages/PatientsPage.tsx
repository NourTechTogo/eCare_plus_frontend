import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { buttonClassName } from '@/components/ui/styles'
import { ConditionBadges } from '@/features/patients/components/ConditionBadges'
import { PatientFilters } from '@/features/patients/components/PatientFilters'
import { emptyPatientFilters, filterPatients } from '@/features/patients/filterPatients'
import { usePatients } from '@/features/patients/hooks/usePatients'
import type { Patient } from '@/features/patients/types/patient'
import { formatDate } from '@/utils/formatDate'
import { getAge } from '@/utils/getAge'

const pageDescription = 'Dossiers des patients suivis par l’établissement'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

export interface PatientColumn {
  header: string
  render: (patient: Patient) => ReactNode
}

/** Colonnes administratives, affichées quand l'application n'en fournit pas d'autres. */
const administrativeColumns: PatientColumn[] = [
  { header: 'Téléphone', render: (patient) => patient.phone },
  { header: 'Dossier créé le', render: (patient) => formatDate(patient.createdAt) },
]

interface PatientsTableProps {
  patients: Patient[]
  columns: PatientColumn[]
  canManage: boolean
}

function PatientsTable({ patients, columns, canManage }: PatientsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-176 border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr>
            <th scope="col" className={headClassName}>
              Patient
            </th>
            <th scope="col" className={headClassName}>
              Pathologie
            </th>
            {columns.map((column) => (
              <th key={column.header} scope="col" className={headClassName}>
                {column.header}
              </th>
            ))}
            <th scope="col" className={headClassName}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => {
            const fullName = `${patient.firstName} ${patient.lastName}`
            return (
              <tr key={patient.id}>
                <td className={cellClassName}>
                  <p className="font-semibold text-ink">{fullName}</p>
                  <p className="text-xs text-muted">
                    N° {patient.fileNumber} • {getAge(patient.birthDate)} ans
                  </p>
                </td>
                <td className={cellClassName}>
                  <ConditionBadges condition={patient.condition} />
                </td>
                {columns.map((column) => (
                  <td key={column.header} className={`${cellClassName} whitespace-nowrap`}>
                    {column.render(patient)}
                  </td>
                ))}
                <td className={cellClassName}>
                  <div className="flex gap-2">
                    <Link
                      to={`/patients/${patient.id}`}
                      aria-label={`Consulter le dossier : ${fullName}`}
                      className={buttonClassName('primary', 'sm')}
                    >
                      Consulter
                    </Link>
                    {canManage && (
                      <Link
                        to={`/patients/${patient.id}/modifier`}
                        aria-label={`Modifier le dossier : ${fullName}`}
                        className={buttonClassName('secondary', 'sm')}
                      >
                        Modifier
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function countLabel(shown: number, total: number) {
  if (total === 0) return 'Aucun patient enregistré'
  if (shown !== total) return `${shown} sur ${total} patients enregistrés`
  return total === 1 ? '1 patient enregistré' : `${total} patients enregistrés`
}

interface PatientsPageProps {
  /** Autorise l'ajout et la modification de dossiers (personnel de l'établissement). */
  canManage: boolean
  /** Colonnes fournies par l'application à la place des colonnes administratives (suivi médical). */
  columns?: PatientColumn[]
}

export function PatientsPage({ canManage, columns = administrativeColumns }: PatientsPageProps) {
  const state = usePatients()
  const [filters, setFilters] = useState(emptyPatientFilters)

  if (state.status === 'error') {
    return (
      <Page title="Liste des patients" description={pageDescription}>
        <Alert variant="error" title="La liste des patients n'a pas pu être chargée.">
          Rechargez la page pour réessayer.
        </Alert>
      </Page>
    )
  }

  const patients = state.status === 'success' ? state.patients : []
  const shownPatients = filterPatients(patients, filters)

  return (
    <Page title="Liste des patients" description={pageDescription}>
      {patients.length > 0 && <PatientFilters value={filters} onChange={setFilters} />}

      <Card
        title={
          state.status === 'success'
            ? countLabel(shownPatients.length, patients.length)
            : 'Patients'
        }
        action={
          canManage && (
            <div className="flex flex-wrap gap-2">
              <Link to="/patients/referencer" className={buttonClassName('secondary')}>
                Référencer par code QR
              </Link>
              <Link to="/patients/nouveau" className={buttonClassName('primary')}>
                <span aria-hidden="true">+</span>
                Ajouter un patient
              </Link>
            </div>
          )
        }
      >
        {state.status === 'loading' && <ListSkeleton label="Chargement des patients…" />}
        {state.status === 'success' && patients.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            {canManage
              ? 'Utilisez « Ajouter un patient » pour créer le premier dossier.'
              : "Aucun dossier patient n'est disponible pour le moment."}
          </p>
        )}
        {patients.length > 0 && shownPatients.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-muted">Aucun patient ne correspond à ces critères.</p>
            <Button variant="secondary" size="sm" onClick={() => setFilters(emptyPatientFilters)}>
              Effacer les filtres
            </Button>
          </div>
        )}
        {shownPatients.length > 0 && (
          <PatientsTable patients={shownPatients} columns={columns} canManage={canManage} />
        )}
      </Card>
    </Page>
  )
}
