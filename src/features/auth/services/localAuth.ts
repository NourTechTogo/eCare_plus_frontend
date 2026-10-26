import { mutate, query, type StaffAccount } from '@/demo/database'
import { setCurrentUser } from '@/demo/session'
import type { Credentials, Session } from '@/features/auth/types/auth'

/*
 * Authentification sur la base locale (VITE_DATA_SOURCE=demo), avec le même comportement que le
 * backend : mêmes erreurs, même absence d'indice sur l'existence d'une adresse e-mail.
 */

/** Durée d'une session ouverte sur la base locale. */
const SESSION_HOURS = 8
/** Validité d'un code de réinitialisation, comme côté backend. */
const CODE_MINUTES = 10
/** Code reçu « par e-mail » sur la base locale, décrit dans le README pour les présentations. */
export const LOCAL_RESET_CODE = '4821'

export class LocalAuthError extends Error {
  readonly reason: 'credentials' | 'code'

  constructor(reason: 'credentials' | 'code') {
    super(reason)
    this.reason = reason
  }
}

const normalizePhone = (value: string) => value.replace(/[\s.-]/g, '')

function matches(account: StaffAccount, identifier: string) {
  const id = identifier.trim().toLowerCase()
  return (
    account.email.toLowerCase() === id ||
    (account.phone !== undefined && normalizePhone(account.phone) === normalizePhone(id))
  )
}

export function toSession(account: StaffAccount): Session {
  return {
    token: `local.${account.id}`,
    expiresAt: new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString(),
    user: {
      id: account.id,
      name: `${account.firstName} ${account.lastName}`,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone,
      email: account.email,
      role: account.role,
      avatarUrl: account.avatarUrl,
      specialty: account.specialty,
    },
  }
}

export async function localLogin({ identifier, password }: Credentials): Promise<Session> {
  const account = await query((db) =>
    db.accounts.find((candidate) => matches(candidate, identifier) && candidate.status === 'actif'),
  )
  if (!account || account.password !== password) throw new LocalAuthError('credentials')
  setCurrentUser(account.id)
  return toSession(account)
}

export async function localRequestCode(email: string): Promise<void> {
  await mutate((db) => {
    const account = db.accounts.find((candidate) => matches(candidate, email))
    // Adresse inconnue : même réponse, pour ne pas révéler quelles adresses sont inscrites.
    if (!account) return
    db.passwordResets = db.passwordResets.filter((reset) => reset.email !== account.email)
    db.passwordResets.push({
      email: account.email,
      code: LOCAL_RESET_CODE,
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
    })
  })
}

export async function localVerifyCode(email: string, _code: string): Promise<string> {
  const token = await mutate((db) => {
    const reset = db.passwordResets.find(
      (candidate) => candidate.email === email.trim().toLowerCase(),
    )
    if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) return null
    // Provisoire : tout code saisi est accepté tant que l'envoi réel par e-mail n'est pas branché.
    reset.token = crypto.randomUUID()
    return reset.token
  })
  if (!token) throw new LocalAuthError('code')
  return token
}

export async function localResetPassword(token: string, newPassword: string): Promise<void> {
  const done = await mutate((db) => {
    const reset = db.passwordResets.find((candidate) => candidate.token === token)
    if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) return false
    const account = db.accounts.find((candidate) => candidate.email === reset.email)
    if (!account) return false
    account.password = newPassword
    db.passwordResets = db.passwordResets.filter((candidate) => candidate !== reset)
    return true
  })
  if (!done) throw new LocalAuthError('code')
}
