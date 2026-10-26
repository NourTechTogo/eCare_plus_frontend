import { useEffect, useId, useRef, type ReactNode } from 'react'

const closeIconPath =
  'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3 1.4 1.4Z'

interface DialogProps {
  title: string
  description?: ReactNode
  /** Largeur maximale de la fenêtre. */
  size?: 'md' | 'lg'
  children: ReactNode
  onClose: () => void
}

/**
 * Fenêtre modale : le navigateur gère le fond, le focus et la touche Échap. Elle s'ouvre à son
 * affichage ; pour la fermer, le parent cesse de l'afficher.
 */
export function Dialog({ title, description, size = 'md', children, onClose }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className={`m-auto w-[calc(100%-2rem)] animate-pop rounded-3xl bg-surface shadow-xl backdrop:bg-ink/40 ${
        size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
      }`}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="font-display text-xl font-bold text-ink">
              {title}
            </h2>
            {description && <div className="text-sm text-muted">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-page hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={closeIconPath} />
            </svg>
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </dialog>
  )
}
