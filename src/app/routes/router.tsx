import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import {
  AlertRoute,
  ArticleEditorRoute,
  ArticleRoute,
  ArticlesRoute,
  DashboardRoute,
} from '@/app/routes/doctorRoutes'
import {
  LandingRoute,
  PatientRecordRoute,
  PatientsRoute,
  RoleOnly,
} from '@/app/routes/patientRoutes'
import { ProtectedLayout } from '@/app/routes/ProtectedLayout'
import {
  CreatePatientRoute,
  EditPatientRoute,
  ReferencePatientRoute,
} from '@/app/routes/staffRoutes'
import { AlertsPage } from '@/features/alerts'
import { AppointmentsPage } from '@/features/appointments'
import { ForgotPasswordPage, LoginPage } from '@/features/auth'
import { MessagingPage } from '@/features/messaging'
import { ProfilePage } from '@/features/profile'
import { PersonnelPage, StaffPage } from '@/features/staff'

const adminOnly = (page: ReactNode) => <RoleOnly role="admin">{page}</RoleOnly>
const staffOnly = (page: ReactNode) => <RoleOnly role="personnel">{page}</RoleOnly>
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
      { path: 'patients/nouveau', element: staffOnly(<CreatePatientRoute />) },
      { path: 'patients/referencer', element: staffOnly(<ReferencePatientRoute />) },
      { path: 'patients/:patientId', element: <PatientRecordRoute /> },
      { path: 'patients/:patientId/modifier', element: staffOnly(<EditPatientRoute />) },
      { path: 'medecins', element: adminOnly(<StaffPage />) },
      { path: 'personnel', element: adminOnly(<PersonnelPage />) },
      { path: 'alertes', element: doctorOnly(<AlertsPage />) },
      { path: 'alertes/:alertId', element: doctorOnly(<AlertRoute />) },
      { path: 'messagerie', element: doctorOnly(<MessagingPage />) },
      { path: 'messagerie/:conversationId', element: doctorOnly(<MessagingPage />) },
      { path: 'rendez-vous', element: doctorOnly(<AppointmentsPage />) },
      { path: 'articles', element: doctorOnly(<ArticlesRoute />) },
      { path: 'articles/nouveau', element: doctorOnly(<ArticleEditorRoute />) },
      { path: 'articles/:articleId', element: doctorOnly(<ArticleRoute />) },
      { path: 'articles/:articleId/modifier', element: doctorOnly(<ArticleEditorRoute />) },
      { path: 'profil', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
