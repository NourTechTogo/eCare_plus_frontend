import type { Credentials, Session, UserRole } from '@/features/auth/types/auth'
import { ApiError, apiRequest, setAccessToken } from '@/lib/apiClient'

const SESSION_KEY = 'ecare.session'
export function currentUserId(): string | undefined { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')?.user?.id } catch { return undefined } }

/** Réponse de `POST /auth/connexion`. */
interface SessionResponse {
  jeton: string
  expireLe: string
  profil: { id: string; nom: string; prenoms: string; email: string | null }
}

/*
 * Correspondance entre le rôle porté par le jeton et les rôles du portail web.
 * Le backend ne connaît pas de rôle « gestionnaire » : l'administrateur de structure en tient
 * lieu ici. Correspondance à confirmer ; les autres rôles n'ont pas d'écran web défini.
 */
const rolesByClaim: Partial<Record<string, UserRole>> = {
  ADMINISTRATEUR_STRUCTURE: 'gestionnaire',
  MEDECIN: 'medecin',
}

export class InvalidCredentialsError extends Error {}

/** Compte valide, mais dont le rôle n'a pas d'accès défini au portail web. */
export class UnsupportedRoleError extends Error {}

/** Le profil renvoyé à la connexion ne porte pas le rôle : il est lu dans le jeton. */
function readRoleClaim(token: string): string | undefined {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims: unknown = JSON.parse(atob(payload))
    const role = (claims as { role?: unknown }).role
    return typeof role === 'string' ? role : undefined
  } catch {
    return undefined
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const { token, expiresAt, user } = value as Record<string, unknown>
  return (
    typeof token === 'string' &&
    typeof expiresAt === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    typeof (user as Record<string, unknown>).id === 'string' &&
    typeof (user as Record<string, unknown>).name === 'string' &&
    Object.values(rolesByClaim).includes((user as Record<string, unknown>).role as UserRole)
  )
}

/** Session conservée le temps de l'onglet, pour ne pas redemander la connexion à chaque rechargement. */
export function restoreSession(): Session | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    if (!isSession(stored) || !Number.isFinite(Date.parse(stored.expiresAt)) || Date.parse(stored.expiresAt) <= Date.now()) {
      if (stored) sessionStorage.setItem('ecare.sessionExpired', 'true')
      setAccessToken(null)
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    setAccessToken(stored.token)
    return stored
  } catch {
    return null
  }
}

export async function login({ identifier, password }: Credentials): Promise<Session> {
  let response: SessionResponse
  try {
    response = await apiRequest<SessionResponse>('/auth/connexion', {
      method: 'POST',
      body: { identifiant: identifier.trim(), motDePasse: password },
      anonymous: true,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw new InvalidCredentialsError()
    throw error
  }

  const role = rolesByClaim[readRoleClaim(response.jeton) ?? '']
  if (!role) throw new UnsupportedRoleError()

  const session: Session = {
    token: response.jeton,
    expiresAt: response.expireLe,
    user: {
      id: response.profil.id,
      name: `${response.profil.prenoms} ${response.profil.nom}`,
      firstName: response.profil.prenoms,
      lastName: response.profil.nom,
      email: response.profil.email ?? undefined,
      role,
    },
  }
  sessionStorage.removeItem('ecare.sessionExpired')
  saveSession(session)
  setAccessToken(session.token)
  return session
}

/** Conserve la session le temps de l'onglet, par exemple après une modification du profil. */
export function saveSession(session: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

/* Réinitialisation du mot de passe : code à 4 chiffres reçu par e-mail, puis nouveau mot de passe. */

/** Le backend ne sait pas envoyer d'e-mail (service d'envoi non configuré ou en panne). */
export class CodeDeliveryUnavailableError extends Error {}

/** Code faux ou expiré, trop d'essais, ou autorisation de réinitialiser expirée. */
export class InvalidResetCodeError extends Error {}

/**
 * Demande l'envoi d'un code. Le backend répond de la même façon que l'adresse corresponde
 * ou non à un compte, pour ne pas révéler quelles adresses sont inscrites.
 */
export async function requestPasswordCode(email: string): Promise<void> {
  try {
    await apiRequest<void>('/auth/mot-de-passe/otp', {
      method: 'POST',
      body: { email: email.trim() },
      anonymous: true,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) throw new CodeDeliveryUnavailableError()
    throw error
  }
}

/** Vérifie le code ; renvoie le jeton qui autorise à choisir un nouveau mot de passe. */
export async function verifyPasswordCode(email: string, code: string): Promise<string> {
  try {
    const response = await apiRequest<{ jetonReinitialisation: string }>(
      '/auth/mot-de-passe/otp/verifier',
      { method: 'POST', body: { email: email.trim(), code }, anonymous: true },
    )
    return response.jetonReinitialisation
  } catch (error) {
    if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
      throw new InvalidResetCodeError()
    }
    throw error
  }
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  try {
    await apiRequest<void>('/auth/mot-de-passe/reinitialiser', {
      method: 'POST',
      body: { jeton: resetToken, nouveauMotDePasse: newPassword },
      anonymous: true,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new InvalidResetCodeError()
    throw error
  }
}

export function logout() {
  const revoke = apiRequest<void>('/auth/deconnexion', { method: 'POST' })
  void revoke.catch(() => { /* La session locale est toujours supprimée. */ })
  sessionStorage.removeItem(SESSION_KEY)
  setAccessToken(null)
}
