import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
}

export function Card({ title, action, children }: CardProps) {
  return (
    <section className="min-w-0 rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-6">
      {(title || action) && (
        <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-3">
          {title && <h2 className="min-w-0 font-display text-lg font-bold text-ink [overflow-wrap:anywhere]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
