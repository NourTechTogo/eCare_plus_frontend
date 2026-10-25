import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import {
  alertsIconPath,
  messagingIconPath,
} from '@/app/routes/navIcons'
import { NotificationMenu, type NotificationItem } from '@/components/ui/NotificationMenu'
import { useAlerts } from '@/features/alerts'
import { useConversations } from '@/features/messaging'

/** Un rendez-vous est signalé lorsqu'il a lieu dans les deux jours. */


/*
 * Notifications du médecin, déduites de ce qui attend une action de sa part : alertes actives,
 * messages non lus et rendez-vous proches. Ce n'est pas un historique : une notification
 * disparaît quand l'élément est traité.
 */
function NotificationsLoader({ onLoaded }: { onLoaded: (items: NotificationItem[]) => void }) {
  const alerts = useAlerts()
  const conversations = useConversations()

  useEffect(() => {
    if (
      alerts.status !== 'success' ||
      conversations.status !== 'success'
    ) {
      return
    }
    onLoaded([
      ...alerts.data
        .filter((alert) => !alert.resolution)
        .map(
          (alert): NotificationItem => ({
            id: `alerte:${alert.id}`,
            title: `Alerte : ${alert.patientName}`,
            description: `${alert.trigger} (${alert.value})`,
            to: `/alertes/${alert.id}`,
            iconPath: alertsIconPath,
            tone: (alert.priority === 'haute' || alert.priority === 'critique') ? 'red' : 'amber',
          }),
        ),
      ...conversations.data
        .filter((conversation) => conversation.unreadCount > 0)
        .map(
          (conversation): NotificationItem => ({
            id: `message:${conversation.id}`,
            title: conversation.patientName,
            description:
              conversation.unreadCount === 1
                ? '1 message non lu'
                : `${conversation.unreadCount} messages non lus`,
            to: `/messagerie/${conversation.id}`,
            iconPath: messagingIconPath,
            tone: 'blue',
          }),
        ),

    ])
  }, [alerts, conversations, onLoaded])

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
