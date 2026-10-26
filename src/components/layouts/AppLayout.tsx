import { useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'
import logoMark from '@/assets/logo-mark.png'
import { PageTitleSlot } from '@/components/layouts/pageTitleSlot'
import { UserMenu } from '@/components/ui/UserMenu'

export interface NavItem {
  to: string
  label: string
  /** Tracé SVG du pictogramme, sur une grille de 24 × 24. */
  iconPath: string
}

interface AppLayoutProps {
  navItems: NavItem[]
  user: { name: string; role: string; email?: string }
  /** Action affichée dans la barre supérieure, avant le compte : par exemple les notifications. */
  topAction?: ReactNode
  onLogout: () => void
}

export function AppLayout({ navItems, user, topAction, onLogout }: AppLayoutProps) {
  // Élément de la barre supérieure où chaque page place son titre.
  const [titleSlot, setTitleSlot] = useState<HTMLElement | null>(null)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-surface px-4 py-3 sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-8 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
        <div className="flex items-center gap-2.5 lg:px-2">
          <img src={logoMark} alt="" className="size-10" />
          <p className="font-display text-2xl font-extrabold text-primary">ecare+</p>
        </div>

        <nav aria-label="Navigation principale">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] ${
                      isActive
                        ? 'bg-primary-strong font-semibold text-white shadow-md'
                        : 'font-medium text-muted hover:bg-page hover:text-ink'
                    }`
                  }
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={item.iconPath} />
                  </svg>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure : titre de la page, notifications et compte, toujours visibles. */}
        <div className="sticky top-0 z-30 flex min-h-18 items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-8">
          <div ref={setTitleSlot} className="flex min-w-0 flex-1 items-center" />
          {topAction}
          <UserMenu
            name={user.name}
            role={user.role}
            email={user.email}
            avatarUrl={user.avatarUrl}
            profileTo="/profil"
            onLogout={onLogout}
          />
        </div>

        <main className="min-w-0 flex-1">
          <PageTitleSlot value={titleSlot}>
            <Outlet />
          </PageTitleSlot>
        </main>
      </div>
    </div>
  )
}
