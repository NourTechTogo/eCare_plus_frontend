import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { DoctorPatientRecordRoute, DoctorPatientsRoute } from '@/app/routes/doctorRoutes'
import { StaffPatientRecordRoute, StaffPatientsRoute } from '@/app/routes/staffRoutes'
import { useAuth, type UserRole } from '@/features/auth'
import { LandingPage } from '@/features/landing'

/*
 * Répartition des écrans selon le rôle :
 * - administrateur : comptes des médecins et du personnel ;
 * - personnel de l'établissement : dossiers patients et affectation du médecin référent ;
 * - médecin : tableau de bord, dossiers de ses patients, alertes, messagerie, rendez-vous, articles.
 * Simple confort de navigation : le contrôle d'accès réel relève du backend.
 */

/** Page d'accueil de chaque rôle après la connexion. */
const homePaths: Record<UserRole, string> = {
  admin: '/medecins',
  personnel: '/patients',
  medecin: '/tableau-de-bord',
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homePaths[user.role] : '/connexion'} replace />
}

/** Page de présentation pour les visiteurs ; un utilisateur connecté rejoint son accueil. */
export function LandingRoute() {
  const { user } = useAuth()
  return user ? <HomeRedirect /> : <LandingPage />
}

/** Réserve un écran à un rôle ; les autres sont renvoyés vers leur page d'accueil. */
export function RoleOnly({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user } = useAuth()
  return user?.role === role ? children : <HomeRedirect />
}

export function PatientsRoute() {
  const { user } = useAuth()
  if (user?.role === 'medecin') return <DoctorPatientsRoute />
  return user?.role === 'personnel' ? <StaffPatientsRoute /> : <HomeRedirect />
}

export function PatientRecordRoute() {
  const { user } = useAuth()
  if (user?.role === 'medecin') return <DoctorPatientRecordRoute />
  return user?.role === 'personnel' ? <StaffPatientRecordRoute /> : <HomeRedirect />
}
