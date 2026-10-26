import { useState } from 'react'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { editIconPath, restoreIconPath, trashIconPath } from '@/components/ui/icons'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { StatTile } from '@/components/ui/StatTile'
import { DoctorFormDialog, StatusDialog } from '@/features/staff/components/DoctorDialogs'
import { useDoctors } from '@/features/staff/hooks/useDoctors'
import type { Doctor } from '@/features/staff/types/doctor'
import { formatDate } from '@/utils/formatDate'

const pageDescription = 'Comptes des médecins de l’établissement'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

/** Médecins : création, validation et désactivation de leurs comptes par l’administrateur (CDC §1.6.1). */
export function StaffPage() {
  const state = useDoctors()
  const [changed, setChanged] = useState<Record<string, Doctor>>({})
  // Formulaire ouvert : création (sans médecin) ou modification d'un compte existant.
  const [formTarget, setFormTarget] = useState<{ doctor?: Doctor }>()
  const [statusTarget, setStatusTarget] = useState<Doctor>()

  const remember = (doctor: Doctor) =>
    setChanged((current) => ({ ...current, [doctor.id]: doctor }))
  const action = <Button onClick={() => setFormTarget({})}>Ajouter un médecin</Button>

  if (state.status !== 'success') {
    return (
      <Page title="Médecins" description={pageDescription}>
        {state.status === 'loading' ? (
          <PageSkeleton label="Chargement de l'équipe…" />
        ) : (
          <Alert variant="error" title="L'équipe n'a pas pu être chargée.">
            Rechargez la page pour réessayer.
          </Alert>
        )}
      </Page>
    )
  }

  const doctors = [
    ...state.data.map((doctor) => changed[doctor.id] ?? doctor),
    ...Object.values(changed).filter(
      (doctor) => !state.data.some((known) => known.id === doctor.id),
    ),
  ]
  const active = doctors.filter((doctor) => doctor.status === 'actif')

  return (
    <Page title="Médecins" description={pageDescription} action={action}>
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Médecins actifs"
          value={plural(active.length, 'médecin')}
          hint="Peuvent se connecter au portail"
        />
        <StatTile
          tone="green"
          label="Patients suivis"
          value={plural(
            active.reduce((total, doctor) => total + doctor.patientCount, 0),
            'patient',
          )}
          hint="Rattachés à un médecin actif"
        />
        <StatTile
          tone="amber"
          label="Comptes désactivés"
          value={plural(doctors.length - active.length, 'compte')}
          hint="Historique conservé"
        />
      </div>

      <Card title="Médecins">
        <div className="overflow-x-auto">
          <table className="w-full min-w-224 border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                {['Médecin', 'Spécialité', 'Patients', 'Compte', 'Action'].map((header) => (
                  <th key={header} scope="col" className={headClassName}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} className={doctor.status === 'actif' ? '' : 'opacity-80'}>
                  <td className={cellClassName}>
                    <p className="font-semibold text-ink">
                      Dr {doctor.firstName} {doctor.lastName}
                    </p>
                    <p className="text-xs text-muted">{doctor.email}</p>
                  </td>
                  <td className={cellClassName}>{doctor.specialty}</td>
                  <td className={`${cellClassName} whitespace-nowrap`}>
                    {plural(doctor.patientCount, 'patient')}
                  </td>
                  <td className={cellClassName}>
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={doctor.status === 'actif' ? 'green' : 'red'}>
                        {doctor.status === 'actif' ? 'Actif' : 'Désactivé'}
                      </Badge>
                      <span className="text-xs text-muted">
                        Depuis le {formatDate(doctor.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className={cellClassName}>
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Modifier le compte de Dr ${doctor.firstName} ${doctor.lastName}`}
                        iconPath={editIconPath}
                        onClick={() => setFormTarget({ doctor: doctor })}
                      />
                      {doctor.status === 'actif' ? (
                        <IconButton
                          label={`Désactiver le compte de Dr ${doctor.firstName} ${doctor.lastName}`}
                          iconPath={trashIconPath}
                          tone="danger"
                          onClick={() => setStatusTarget(doctor)}
                        />
                      ) : (
                        <IconButton
                          label={`Réactiver le compte de Dr ${doctor.firstName} ${doctor.lastName}`}
                          iconPath={restoreIconPath}
                          tone="success"
                          onClick={() => setStatusTarget(doctor)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {formTarget && (
        <DoctorFormDialog
          doctor={formTarget.doctor}
          onClose={() => setFormTarget(undefined)}
          onSaved={remember}
        />
      )}
      {statusTarget && (
        <StatusDialog
          doctor={statusTarget}
          onClose={() => setStatusTarget(undefined)}
          onChanged={(doctor) => {
            remember(doctor)
            setStatusTarget(undefined)
          }}
        />
      )}
    </Page>
  )
}
