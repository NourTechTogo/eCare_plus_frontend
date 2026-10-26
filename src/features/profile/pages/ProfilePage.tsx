import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { LogoutDialog, useAuth } from '@/features/auth'
import { AccountRoleCard } from '@/features/profile/components/AccountRoleCard'
import { AvatarUpload } from '@/features/profile/components/AvatarUpload'
import { PasswordChangeCard } from '@/features/profile/components/PasswordChangeCard'
import { PersonalInfoForm } from '@/features/profile/components/PersonalInfoForm'

const TAB_PARAM = 'onglet'

const tabs = [
  { id: 'informations', label: 'Informations personnelles' },
  { id: 'securite', label: 'Sécurité & Accès' },
]

/** Paramètres de la personne connectée : profil, photo, mot de passe, déconnexion (EF-AUTH-8, EF-W1-10). */
export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  if (!user) return null

  const currentTab = searchParams.get(TAB_PARAM) ?? 'informations'
  const activeTab = tabs.some((t) => t.id === currentTab) ? currentTab : 'informations'

  const handleTabChange = (id: string) => {
    setSearchParams({ [TAB_PARAM]: id }, { replace: true })
  }

  return (
    <Page title="Mon profil" description="Vos informations professionnelles et la sécurité de votre compte">
      {/* En-tête avec Photo de profil et Coordonnées rapides */}
      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <AvatarUpload user={user} onAvatarUpdated={updateUser} />
      </section>

      {/* Barre d'onglets pour une navigation aérée et ergonomique */}
      <Tabs
        label="Sections du profil utilisateur"
        tabs={tabs}
        active={activeTab}
        onChange={handleTabChange}
      />

      {/* Contenu de l'onglet actif */}
      {activeTab === 'informations' && (
        <div className="grid items-start gap-6 xl:grid-cols-5 animate-enter">
          <div className="xl:col-span-3">
            <PersonalInfoForm
              key={`${user.name}|${user.phone ?? ''}`}
              user={user}
              onSaved={updateUser}
            />
          </div>
          <div className="xl:col-span-2">
            <AccountRoleCard role={user.role} email={user.email} />
          </div>
        </div>
      )}

      {activeTab === 'securite' && (
        <div className="grid items-start gap-6 xl:grid-cols-5 animate-enter">
          <div className="xl:col-span-3">
            <PasswordChangeCard email={user.email} />
          </div>
          <div className="flex flex-col gap-6 xl:col-span-2">
            <Card
              title="Session en cours"
              subtitle="Gestion de l'accès actif sur cet appareil"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-page p-3 text-xs text-muted">
                  <span className="flex size-2 rounded-full bg-success animate-ping" />
                  <span>Session authentifiée et active sur ce navigateur.</span>
                </div>
                <p className="text-sm text-muted">
                  Se déconnecter efface instantanément vos jetons d'accès et vos données locales de cet appareil.
                  Recommandé systématiquement si vous utilisez un poste médical partagé.
                </p>
                <div className="pt-2">
                  <Button variant="secondary" onClick={() => setConfirmingLogout(true)}>
                    <svg
                      className="size-4 shrink-0 text-danger"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M14 16l4-4-4-4M18 12H8" />
                    </svg>
                    Se déconnecter de ce poste
                  </Button>
                </div>
              </div>
            </Card>

            <Card
              title="Conseils de sécurité"
              subtitle="Bonnes pratiques pour la protection des données de santé"
            >
              <ul className="flex flex-col gap-3 text-xs leading-relaxed text-muted">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-primary">•</span>
                  <span>Ne communiquez jamais votre mot de passe ou votre code de réinitialisation temporaire.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-primary">•</span>
                  <span>Verrouillez toujours votre session lorsque vous quittez votre poste de consultation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-primary">•</span>
                  <span>En cas de doute sur la sécurité de votre compte, changez votre mot de passe immédiatement.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {confirmingLogout && <LogoutDialog onClose={() => setConfirmingLogout(false)} />}
    </Page>
  )
}
