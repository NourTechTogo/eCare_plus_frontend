import type { UserRole } from '@/features/auth/types/auth'

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  personnel: "Personnel de l'établissement",
  medecin: 'Médecin',
}
