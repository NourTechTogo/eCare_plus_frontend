import type { ButtonHTMLAttributes } from 'react'

type IconButtonTone = 'primary' | 'danger' | 'success'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Intitulé de l'action, lu par les lecteurs d'écran et affiché au survol. */
  label: string
  /** Tracé SVG du pictogramme, sur une grille de 24 × 24. */
  iconPath: string
  tone?: IconButtonTone
}

const toneClassNames: Record<IconButtonTone, string> = {
  primary: 'text-primary-strong hover:bg-primary-soft focus-visible:outline-primary',
  danger: 'text-danger hover:bg-danger-soft focus-visible:outline-danger',
  success: 'text-success hover:bg-success-soft focus-visible:outline-success',
}

/** Action présentée comme un bouton rond à pictogramme, avec une infobulle. */
export function IconButton({
  label,
  iconPath,
  tone = 'primary',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 ${toneClassNames[tone]}`}
      {...props}
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={iconPath} />
      </svg>
    </button>
  )
}
