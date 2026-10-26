import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { roleLabels, type UserRole } from '@/features/auth'

const roleDescriptions: Record<UserRole, { summary: string; capabilities: string[] }> = {
  medecin: {
    summary: 'Responsable du suivi clinique et des décisions médicales de ses patients rattachés.',
    capabilities: [
      'Consultation des dossiers et de l’historique médical',
      'Suivi graphique des constantes (glycémie, tension, FC, poids)',
      'Traitement et prise en charge des alertes de santé',
      'Prescription et ajustement des traitements chroniques',
      'Messagerie directe et téléconsultations audio/vidéo',
    ],
  },
  personnel: {
    summary: 'Chargé de l’accueil, de l’enregistrement et de l’organisation administrative des patients.',
    capabilities: [
      'Création des dossiers patients à l’accueil de la structure',
      'Rattachement et affectation du médecin référent',
      'Référencement des inscriptions mobiles via scan de QR code',
      'Mise à jour des coordonnées administratives du dossier',
    ],
  },
  admin: {
    summary: 'Administrateur de la structure en charge de la gestion des utilisateurs habilités.',
    capabilities: [
      'Création et invitation des comptes soignants et administratifs',
      'Activation et suspension temporaire d’accès',
      'Surveillance générale et configuration des droits de la structure',
    ],
  },
}

export function AccountRoleCard({ role, email }: { role: UserRole; email?: string }) {
  const info = roleDescriptions[role]

  return (
    <Card
      title="Rôle & Habilitations"
      subtitle="Droits d'accès et responsabilités accordés sur la plateforme"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-page p-3.5 border border-line">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Profil actuel</span>
            <span className="font-display text-base font-bold text-ink">{roleLabels[role]}</span>
          </div>
          <Badge tone="blue">Actif</Badge>
        </div>

        <p className="text-sm leading-relaxed text-muted">{info.summary}</p>

        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Périmètre d'action autorisé
          </span>
          <ul className="flex flex-col gap-2 text-xs text-ink">
            {info.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2.5">
                <svg
                  className="size-4 shrink-0 text-success mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-primary-soft bg-primary-soft/50 p-4 text-xs text-muted flex flex-col gap-1.5">
          <span className="font-semibold text-primary-strong flex items-center gap-1.5">
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Données de santé protégées
          </span>
          <p className="leading-relaxed">
            Vos accès sont strictement audités et limités aux patients suivis par votre établissement,
            conformément aux règles de confidentialité eCare+.
          </p>
          {email && (
            <p className="mt-1 text-control">
              Notification de sécurité envoyée à <span className="font-medium text-ink">{email}</span>.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
