import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { DoctorNotifications } from '@/app/routes/DoctorNotifications'
import { alertsIconPath, appointmentsIconPath, messagingIconPath } from '@/app/routes/navIcons'
import { AppLayout, type NavItem } from '@/components/layouts/AppLayout'
import { LogoutDialog, roleLabels, useAuth, type UserRole } from '@/features/auth'

const dashboardItem: NavItem = {
  to: '/tableau-de-bord',
  label: 'Tableau de bord',
  // Pictogramme « grille ».
  iconPath: 'M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10-3h8v11h-8V10Z',
}

const patientsItem: NavItem = {
  to: '/patients',
  label: 'Liste des patients',
  // Pictogramme « groupe de personnes ».
  iconPath:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0v1H2v-1Zm15.5-9.5a3.5 3.5 0 1 0-1.6-6.6 6 6 0 0 1 0 6.2c.5.25 1 .4 1.6.4ZM18 21v-1a8.9 8.9 0 0 0-1.9-5.5A6 6 0 0 1 22 20v1h-4Z',
}

const alertsItem: NavItem = {
  to: '/alertes',
  label: 'File des alertes',
  iconPath: alertsIconPath,
}

const messagingItem: NavItem = {
  to: '/messagerie',
  label: 'Messagerie',
  iconPath: messagingIconPath,
}

const appointmentsItem: NavItem = {
  to: '/rendez-vous',
  label: 'Rendez-vous',
  iconPath: appointmentsIconPath,
}

const doctorsItem: NavItem = {
  to: '/medecins',
  label: 'Médecins',
  // Pictogramme « stéthoscope ».
  iconPath:
    'M5 2h2v2H6v5a4 4 0 0 0 8 0V4h-1V2h2a1 1 0 0 1 1 1v6a6 6 0 0 1-5 5.92V16a4 4 0 0 0 8 0v-1.17a3 3 0 1 1 2 0V16a6 6 0 0 1-12 0v-1.08A6 6 0 0 1 4 9V3a1 1 0 0 1 1-1Zm14 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
}

const articlesItem: NavItem = {
  to: '/articles',
  label: 'Articles',
  // Pictogramme « document ».
  iconPath:
    'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12v2h8v-2H8Zm0 4v2h8v-2H8Z',
}

const personnelItem: NavItem = {
  to: '/personnel',
  label: 'Personnel',
  // Pictogramme « badge ».
  iconPath:
    'M9 2h6v3H9V2ZM5 4h2v3h10V4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm7 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 10h10a5 5 0 0 0-10 0Z',
}

const navItemsByRole: Record<UserRole, NavItem[]> = {
  admin: [doctorsItem, personnelItem],
  personnel: [patientsItem],
  medecin: [dashboardItem, patientsItem, alertsItem, messagingItem, appointmentsItem, articlesItem],
}

/**
 * Mise en page des écrans réservés aux utilisateurs connectés.
 * Simple confort de navigation : le contrôle d'accès réel relève du backend.
 */
export function ProtectedLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }

  return (
    <>
      <AppLayout
        navItems={navItemsByRole[user.role]}
        user={{ name: user.name, role: roleLabels[user.role], email: user.email }}
        // Les notifications portent sur le suivi médical : elles sont réservées au médecin.
        topAction={user.role === 'medecin' ? <DoctorNotifications /> : undefined}
        onLogout={() => setConfirmingLogout(true)}
      />
      {confirmingLogout && <LogoutDialog onClose={() => setConfirmingLogout(false)} />}
    </>
  )
}
