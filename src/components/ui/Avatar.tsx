import { useState } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const sizes: Record<AvatarSize, string> = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-20 text-2xl',
  '2xl': 'size-24 text-3xl',
}

/** Pastille ronde affichant une photo ou des initiales. Décorative : le nom complet doit figurer à côté. */
export function Avatar({
  initials,
  src,
  alt,
  size = 'md',
}: {
  initials: string
  src?: string
  alt?: string
  size?: AvatarSize
}) {
  const [loadFailed, setLoadFailed] = useState(false)

  if (src && !loadFailed) {
    return (
      <img
        src={src}
        alt={alt ?? initials}
        onError={() => setLoadFailed(true)}
        className={`inline-flex shrink-0 rounded-full border border-line object-cover ${sizes[size]}`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-white ${sizes[size]}`}
    >
      {initials}
    </span>
  )
}
