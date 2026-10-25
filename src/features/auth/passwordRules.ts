/** Longueur maximale acceptée par le backend. */
export const PASSWORD_MAX_LENGTH = 72

/** Longueur du code reçu par e-mail pour changer de mot de passe. */
export const RESET_CODE_LENGTH = 4

/** Règles du mot de passe, vérifiées à la saisie (cahier des charges, EF-AUTH-3). */
export const passwordRules = [
  { label: '12 caractères au minimum', test: (value: string) => value.length >= 12 },
  { label: 'Au moins une lettre de A à Z', test: (value: string) => /[A-Za-z]/.test(value) },
  { label: 'Au moins un chiffre', test: (value: string) => /\d/.test(value) },
  { label: '72 octets au maximum (UTF-8)', test: (value: string) => new TextEncoder().encode(value).length <= PASSWORD_MAX_LENGTH },
]

export const meetsPasswordRules = (value: string) => passwordRules.every((rule) => rule.test(value))
