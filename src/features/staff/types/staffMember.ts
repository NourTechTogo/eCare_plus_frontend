import type { AccountStatus } from '@/features/staff/types/doctor'

/** Informations saisies par l'administrateur à la création du compte d'un membre du personnel. */
export interface StaffMemberInput {
  lastName: string
  firstName: string
  email: string
  phone?: string
}

/**
 * Personnel de l'établissement de santé (CDC §1.6.1) : crée les comptes et dossiers patients,
 * affecte le médecin référent et référence les comptes créés par les patients (code QR).
 */
export interface StaffMember extends StaffMemberInput {
  id: string
  status: AccountStatus
  createdAt: string
}
