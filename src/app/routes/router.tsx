import {AppointmentsPage} from '@/features/appointments'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AlertRoute, DashboardRoute } from '@/app/routes/doctorRoutes'
import {
  LandingRoute,
  PatientRecordRoute,
  PatientsRoute,
  RoleOnly,
} from '@/app/routes/patientRoutes'
import { ProtectedLayout } from '@/app/routes/ProtectedLayout'
import { AlertsPage } from '@/features/alerts'
import { ForgotPasswordPage, LoginPage } from '@/features/auth'
import { MessagingPage } from '@/features/messaging'
import { CreatePatientPage, EditPatientPage } from '@/features/patients'
import { ProfilePage } from '@/features/profile'
import { ReferencePatientPage } from '@/features/account/components/ReferencePatientPage'

const managerOnly = (page: ReactNode) => <RoleOnly role="gestionnaire">{page}</RoleOnly>
const doctorOnly = (page: ReactNode) => <RoleOnly role="medecin">{page}</RoleOnly>

export const router = createBrowserRouter([
  { index: true, element: <LandingRoute /> },
  { path: 'connexion', element: <LoginPage /> },
  { path: 'mot-de-passe-oublie', element: <ForgotPasswordPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: 'tableau-de-bord', element: doctorOnly(<DashboardRoute />) },
      { path: 'patients', element: <PatientsRoute /> },
      { path: 'patients/nouveau', element: managerOnly(<CreatePatientPage />) },
      { path: 'patients/referencement', element: managerOnly(<ReferencePatientPage />) },
      { path: 'patients/:patientId', element: <PatientRecordRoute /> },
      { path: 'patients/:patientId/modifier', element: managerOnly(<EditPatientPage />) },
      { path: 'alertes', element: doctorOnly(<AlertsPage />) },
      { path: 'alertes/:alertId', element: doctorOnly(<AlertRoute />) },
      { path: 'rendez-vous', element: doctorOnly(<AppointmentsPage />) },
      { path: 'messagerie', element: doctorOnly(<MessagingPage />) },
      { path: 'messagerie/:conversationId', element: doctorOnly(<MessagingPage />) },
      { path: 'profil', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
