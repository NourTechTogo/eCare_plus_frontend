import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { useDismiss } from '@/hooks/useDismiss'

interface UserMenuProps {
  name: string
  /** Rôle de l'utilisateur, affiché au-dessus de son nom. */
  role: string
  email?: string
  /** Adresse de la page profil de l'utilisateur. */
  profileTo: string
  onLogout: () => void
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/** Pastille de l'utilisateur connecté ; elle ouvre un volet avec son identité et la déconnexion. */
export function UserMenu({ name, role, email, profileTo, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const containerRef = useDismiss<HTMLDivElement>(open, close)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Compte de ${name}`}
        className={`flex items-center gap-3 rounded-full border py-1 pr-1 pl-4 transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] ${
          open
            ? 'border-line bg-surface shadow-md'
            : 'border-transparent bg-page hover:border-line hover:bg-surface hover:shadow-md'
        }`}
      >
        <span className="hidden flex-col items-end sm:flex">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">{role}</span>
          <span className="max-w-40 truncate font-display text-sm font-bold text-ink">{name}</span>
        </span>
        <Avatar initials={getInitials(name)} />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-40 mt-3 max-h-[70dvh] w-72 max-w-[calc(100vw-2rem)] animate-pop overflow-hidden rounded-3xl border border-line bg-surface shadow-xl">
          {/* L'identité mène aussi au profil. */}
          <div className="p-2">
            <Link
              to={profileTo}
              onClick={close}
              aria-label={`Voir le profil de ${name}`}
              className="flex flex-col gap-0.5 rounded-2xl px-3 py-2 transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="truncate font-display text-base font-bold text-ink">{name}</span>
              <span className="truncate text-sm text-muted">{email ?? role}</span>
            </Link>
          </div>
          <div className="flex flex-col gap-1 border-t border-line p-2">
            <Link
              to={profileTo}
              onClick={close}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-ink transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              Mon profil
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-danger"
            >
              <svg
                className="size-5"
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
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
