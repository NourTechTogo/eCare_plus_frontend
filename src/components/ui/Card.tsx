import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function Card({ title, subtitle, action, children }: CardProps) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          {title && (
            <div className="flex flex-col gap-0.5">
              <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
              {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
