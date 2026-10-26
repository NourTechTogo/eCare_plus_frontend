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
import {
  StaffMemberFormDialog,
  StaffMemberStatusDialog,
} from '@/features/staff/components/StaffMemberDialogs'
import { listStaffMembers } from '@/features/staff/services/staffService'
import type { StaffMember } from '@/features/staff/types/staffMember'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate } from '@/utils/formatDate'

const pageDescription = 'Comptes du personnel chargé des dossiers patients'

const headClassName =
  'bg-page px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase first:rounded-l-lg last:rounded-r-lg'
const cellClassName =
  'border-y border-line px-4 py-3 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

/** Personnel de l'établissement : création, désactivation et réactivation des comptes (CDC §1.6.1). */
export function PersonnelPage() {
  const state = useAsyncData('staff-members', listStaffMembers)
  const [changed, setChanged] = useState<Record<string, StaffMember>>({})
  // Formulaire ouvert : création (sans membre) ou modification d'un compte existant.
  const [formTarget, setFormTarget] = useState<{ member?: StaffMember }>()
  const [statusTarget, setStatusTarget] = useState<StaffMember>()

  const remember = (member: StaffMember) =>
    setChanged((current) => ({ ...current, [member.id]: member }))
  const action = <Button onClick={() => setFormTarget({})}>Ajouter un membre</Button>

  if (state.status !== 'success') {
    return (
      <Page title="Personnel" description={pageDescription}>
        {state.status === 'loading' ? (
          <PageSkeleton label="Chargement du personnel…" />
        ) : (
          <Alert variant="error" title="Le personnel n'a pas pu être chargé.">
            Rechargez la page pour réessayer.
          </Alert>
        )}
      </Page>
    )
  }

  const members = [
    ...state.data.map((member) => changed[member.id] ?? member),
    ...Object.values(changed).filter(
      (member) => !state.data.some((known) => known.id === member.id),
    ),
  ]
  const active = members.filter((member) => member.status === 'actif')

  return (
    <Page title="Personnel" description={pageDescription} action={action}>
      <div className="grid gap-4 md:grid-cols-2">
        <StatTile
          label="Comptes actifs"
          value={plural(active.length, 'compte')}
          hint="Peuvent gérer les dossiers patients"
        />
        <StatTile
          tone="amber"
          label="Comptes désactivés"
          value={plural(members.length - active.length, 'compte')}
          hint="Historique conservé"
        />
      </div>

      <Card title="Membres du personnel">
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Utilisez « Ajouter un membre » pour créer le premier compte.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-192 border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr>
                  {['Nom', 'Téléphone', 'Compte', 'Action'].map((header) => (
                    <th key={header} scope="col" className={headClassName}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`
                  return (
                    <tr key={member.id} className={member.status === 'actif' ? '' : 'opacity-80'}>
                      <td className={cellClassName}>
                        <p className="font-semibold text-ink">{fullName}</p>
                        <p className="text-xs text-muted">{member.email}</p>
                      </td>
                      <td className={`${cellClassName} whitespace-nowrap`}>
                        {member.phone ?? <span className="text-muted">—</span>}
                      </td>
                      <td className={cellClassName}>
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone={member.status === 'actif' ? 'green' : 'red'}>
                            {member.status === 'actif' ? 'Actif' : 'Désactivé'}
                          </Badge>
                          <span className="text-xs text-muted">
                            Depuis le {formatDate(member.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className={cellClassName}>
                        <div className="flex items-center gap-1">
                          <IconButton
                            label={`Modifier le compte de ${fullName}`}
                            iconPath={editIconPath}
                            onClick={() => setFormTarget({ member: member })}
                          />
                          {member.status === 'actif' ? (
                            <IconButton
                              label={`Désactiver le compte de ${fullName}`}
                              iconPath={trashIconPath}
                              tone="danger"
                              onClick={() => setStatusTarget(member)}
                            />
                          ) : (
                            <IconButton
                              label={`Réactiver le compte de ${fullName}`}
                              iconPath={restoreIconPath}
                              tone="success"
                              onClick={() => setStatusTarget(member)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formTarget && (
        <StaffMemberFormDialog
          member={formTarget.member}
          onClose={() => setFormTarget(undefined)}
          onSaved={remember}
        />
      )}
      {statusTarget && (
        <StaffMemberStatusDialog
          member={statusTarget}
          onClose={() => setStatusTarget(undefined)}
          onChanged={(member) => {
            remember(member)
            setStatusTarget(undefined)
          }}
        />
      )}
    </Page>
  )
}
