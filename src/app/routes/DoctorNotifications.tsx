import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { alertsIconPath, appointmentsIconPath, messagingIconPath } from '@/app/routes/navIcons'
import { NotificationMenu, type NotificationItem } from '@/components/ui/NotificationMenu'
import { useAlerts } from '@/features/alerts'
import { awaitsAnswer, isUpcoming, useAppointments } from '@/features/appointments'
import { useConversations } from '@/features/messaging'
import { formatDateTime } from '@/utils/formatDateTime'

/** Un rendez-vous est signalé lorsqu'il a lieu dans les deux jours. */
const APPOINTMENT_NOTICE_MS = 48 * 60 * 60 * 1000

/*
 * Notifications du médecin, déduites de ce qui attend une action de sa part : alertes actives,
 * messages non lus, demandes de rendez-vous et rendez-vous proches. Ce n'est pas un historique : une notification
 * disparaît quand l'élément est traité.
 */
function NotificationsLoader({ onLoaded }: { onLoaded: (items: NotificationItem[]) => void }) {
  const alerts = useAlerts()
  const conversations = useConversations()
  const appointments = useAppointments()

  useEffect(() => {
    if (
      alerts.status !== 'success' ||
      conversations.status !== 'success' ||
      appointments.status !== 'success'
    ) {
      return
    }
    const now = Date.now()
    onLoaded([
      ...alerts.data
        .filter((alert) => alert.status !== 'traitee')
        .map((alert): NotificationItem => ({
          id: `alerte:${alert.id}`,
          title: `Alerte : ${alert.patientName}`,
          description: `${alert.trigger} (${alert.value})`,
          to: `/alertes/${alert.id}`,
          iconPath: alertsIconPath,
          tone: alert.severity === 'critique' ? 'red' : 'amber',
        })),
      ...conversations.data
        .filter((conversation) => conversation.unreadCount > 0)
        .map((conversation): NotificationItem => ({
          id: `message:${conversation.id}`,
          title: conversation.patientName,
          description:
            conversation.unreadCount === 1
              ? '1 message non lu'
              : `${conversation.unreadCount} messages non lus`,
          to: `/messagerie/${conversation.id}`,
          iconPath: messagingIconPath,
          tone: 'blue',
        })),
      ...appointments.data
        .filter((appointment) => awaitsAnswer(appointment, now))
        .map((appointment): NotificationItem => ({
          id: `demande-rdv:${appointment.id}`,
          title: `Demande de rendez-vous : ${appointment.patientName}`,
          description: formatDateTime(appointment.scheduledAt),
          to: '/rendez-vous',
          iconPath: appointmentsIconPath,
          tone: 'amber',
        })),
      ...appointments.data
        .filter(
          (appointment) =>
            appointment.status === 'confirme' &&
            isUpcoming(appointment, now) &&
            new Date(appointment.scheduledAt).getTime() - now <= APPOINTMENT_NOTICE_MS,
        )
        .map((appointment): NotificationItem => ({
          id: `rendez-vous:${appointment.id}`,
          title: `Rendez-vous : ${appointment.patientName}`,
          description: formatDateTime(appointment.scheduledAt),
          to: '/rendez-vous',
          iconPath: appointmentsIconPath,
          tone: 'green',
        })),
    ])
  }, [alerts, conversations, appointments, onLoaded])

  return null
}

/** Cloche de notifications du médecin, rafraîchie à chaque changement d'écran. */
export function DoctorNotifications() {
  const { pathname } = useLocation()
  // Dernière liste connue, conservée pendant le rechargement pour éviter un clignotement.
  const [items, setItems] = useState<NotificationItem[]>([])

  return (
    <>
      <NotificationsLoader key={pathname} onLoaded={setItems} />
      <NotificationMenu items={items} />
    </>
  )
}
