import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/features/auth/hooks/useAuth'

/** Confirmation avant une déconnexion demandée par l'utilisateur. */
export function LogoutDialog({ onClose }: { onClose: () => void }) {
  const { logout } = useAuth()

  return (
    <Dialog title="Se déconnecter ?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink">
          Vous devrez saisir à nouveau votre adresse e-mail et votre mot de passe pour accéder au
          portail.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={logout}>Se déconnecter</Button>
        </div>
      </div>
    </Dialog>
  )
}
