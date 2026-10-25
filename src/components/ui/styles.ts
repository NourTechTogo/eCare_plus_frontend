export type ButtonVariant = 'primary' | 'secondary' | 'soft'
export type ButtonSize = 'lg' | 'md' | 'sm'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-normal text-center transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-strong hover:shadow-md',
  secondary: 'border border-control bg-surface text-ink hover:bg-page',
  soft: 'bg-primary-soft text-primary-strong hover:bg-primary-soft-hover',
}

const buttonSizes: Record<ButtonSize, string> = {
  lg: 'min-h-12 px-6 py-3 text-base',
  md: 'min-h-10 px-5 py-2 text-sm',
  sm: 'min-h-8 px-3.5 py-1.5 text-xs',
}

/** Classes d'un bouton, utilisables aussi sur un lien qui doit en avoir l'apparence. */
export function buttonClassName(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`
}

/** Classes communes aux champs de saisie et aux listes déroulantes. */
export function controlClassName(invalid: boolean) {
  const border = invalid ? 'border-danger' : 'border-control'
  return `h-11 w-full min-w-0 max-w-full rounded-xl border ${border} bg-page px-4 text-sm text-ink transition-colors placeholder:text-muted focus:bg-surface focus:outline-2 focus:outline-primary disabled:text-muted`
}