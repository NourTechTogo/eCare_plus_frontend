import { useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { PageTitleSlot } from '@/components/layouts/pageTitleSlot'

interface PageProps {
  title: string
  description?: string
  backLink?: { to: string; label: string }
  action?: ReactNode
  contentClassName?: string
  children: ReactNode
}

// Pictogramme « flèche vers la gauche ».
const backIconPath = 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2Z'

/** Structure d'une page : titre dans la barre supérieure, puis contenu sur le fond de page. */
export function Page({ title, description, backLink, action, children, contentClassName = '' }: PageProps) {
  const titleSlot = useContext(PageTitleSlot)

  // Le titre de la page figure aussi dans l'onglet du navigateur.
  useEffect(() => {
    document.title = `${title} · eCare+`
  }, [title])

  const heading = (
    <div className="flex min-w-0 animate-enter items-center gap-3">
      {backLink && (
        <Link
          to={backLink.to}
          aria-label={backLink.label}
          title={backLink.label}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={backIconPath} />
          </svg>
        </Link>
      )}
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-bold text-ink sm:text-xl">{title}</h1>
        {description && <p className="hidden truncate text-sm text-muted sm:block">{description}</p>}
      </div>
    </div>
  )

  return (
    <>
      {titleSlot ? (
        createPortal(heading, titleSlot)
      ) : (
        <header className="px-4 pt-6 sm:px-8 sm:pt-8">{heading}</header>
      )}
      {action && <div className="flex justify-end px-4 pt-6 sm:px-8">{action}</div>}
      <div className={`animate-stagger flex min-w-0 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-6 sm:pb-8 ${contentClassName}`}>{children}</div>
    </>
  )
}
