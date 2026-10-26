import { mutate, query } from '@/demo/database'
import { currentAccount } from '@/demo/session'
import type { User } from '@/features/auth'
import {
  defaultPreferences,
  type NotificationPreferences,
} from '@/features/profile/types/preferences'

/*
 * Profil de l'utilisateur connecté et préférences de notification (EF-AUTH-8). Routes attendues :
 * GET|PATCH /me, GET|PUT /me/preferences-notifications (voir docs/CONTRAT_API.md).
 * Le changement de mot de passe passe par le code reçu par e-mail (service d'authentification).
 */

export interface ProfileChanges {
  firstName: string
  lastName: string
  phone: string
}

export async function updateProfile(user: User, changes: ProfileChanges): Promise<User> {
  return mutate((db) => {
    const account = currentAccount(db)
    account.firstName = changes.firstName.trim()
    account.lastName = changes.lastName.trim()
    account.phone = changes.phone.trim() || undefined
    return {
      ...user,
      firstName: account.firstName,
      lastName: account.lastName,
      name: `${account.firstName} ${account.lastName}`,
      phone: account.phone,
      avatarUrl: account.avatarUrl,
      specialty: account.specialty,
    }
  })
}

/** Met à jour ou supprime la photo de profil de l'utilisateur connecté (EF-W1-10). */
export async function updateAvatar(user: User, avatarUrl: string | null): Promise<User> {
  return mutate((db) => {
    const account = currentAccount(db)
    account.avatarUrl = avatarUrl ?? undefined
    return {
      ...user,
      avatarUrl: account.avatarUrl,
      specialty: account.specialty,
    }
  })
}

export async function getPreferences(): Promise<NotificationPreferences> {
  return query((db) => db.preferences[currentAccount(db).id] ?? defaultPreferences)
}

export async function savePreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  return mutate((db) => {
    db.preferences[currentAccount(db).id] = preferences
    return preferences
  })
}
