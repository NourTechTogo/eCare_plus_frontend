import { meetsPasswordRules } from '@/features/auth'

export interface AccountPassword {
  password: string
  confirmation: string
}

export const emptyAccountPassword: AccountPassword = { password: '', confirmation: '' }

/** Erreurs du mot de passe choisi par l'administrateur, champ par champ. */
export function validateAccountPassword({ password, confirmation }: AccountPassword) {
  const errors: Partial<Record<keyof AccountPassword, string>> = {}
  if (!meetsPasswordRules(password)) errors.password = 'Le mot de passe ne respecte pas les règles.'
  else if (confirmation !== password)
    errors.confirmation = 'Les deux mots de passe sont différents.'
  return errors
}
