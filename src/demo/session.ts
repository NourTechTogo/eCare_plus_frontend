import { peek, PlatformError, type Database, type StaffAccount } from '@/demo/database'

/*
 * Utilisateur connecté, vu par la base locale. Il joue le rôle du jeton côté backend : chaque
 * service en déduit ce que l'utilisateur a le droit de voir (par exemple, seulement ses patients).
 */

let currentUserId: string | null = null

export function setCurrentUser(id: string | null) {
  currentUserId = id
}

export function currentAccount(db: Database): StaffAccount {
  const account = db.accounts.find((candidate) => candidate.id === currentUserId)
  if (!account || account.status !== 'actif') throw new PlatformError('Session invalide')
  return account
}

/** Le compte existe toujours et peut se connecter (il a pu être désactivé depuis). */
export const isActiveAccount = (id: string) =>
  peek((db) => db.accounts.some((account) => account.id === id && account.status === 'actif'))

export const fullName = (person: { firstName: string; lastName: string }) =>
  `${person.firstName} ${person.lastName}`

/** Nom affiché d'un professionnel, précédé de « Dr » pour un médecin. */
export const displayName = (account: StaffAccount) =>
  account.role === 'medecin' ? `Dr ${fullName(account)}` : fullName(account)
