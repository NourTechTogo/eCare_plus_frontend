import { Navigate, useLocation } from 'react-router'
import { ServerNotifications } from '@/features/account/components/ServerNotifications'
import { IncomingCallBanner } from '@/features/messaging/components/IncomingCallBanner'
import {
  appointmentsIconPath,
  alertsIconPath,
  messagingIconPath,
} from '@/app/routes/navIcons'
import { AppLayout, type NavItem } from '@/components/layouts/AppLayout'
import { roleLabels, useAuth, type UserRole } from '@/features/auth'

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

const appointmentsItem:NavItem={to:'/rendez-vous',label:'Rendez-vous',iconPath:appointmentsIconPath}

const navItemsByRole: Record<UserRole, NavItem[]> = {
  gestionnaire: [patientsItem,{to:'/patients/referencement',label:'Référencer un patient',iconPath:'M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2h3v3h-3v-3Zm4 4h3v3h-3v-3Z'}],
  medecin: [dashboardItem, patientsItem, alertsItem, messagingItem,appointmentsItem],
}

/**
 * Mise en page des écrans réservés aux utilisateurs connectés.
 * Simple confort de navigation : le contrôle d'accès réel relève du backend.
 */
export function ProtectedLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }

  return (
    <><AppLayout
      navItems={navItemsByRole[user.role]}
      user={{ name: user.name, role: roleLabels[user.role], email: user.email }}
      // Les notifications portent sur le suivi médical : elles sont réservées au médecin.
      topAction={<ServerNotifications />}
      onLogout={logout}
    />{user.role==='medecin'&&<IncomingCallBanner/>}</>
  )
}
