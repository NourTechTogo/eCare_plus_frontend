/** Canaux par lesquels l'utilisateur est prévenu (EF-W2-14, EF-W2-19). */
export interface NotificationChannels {
  /** Notifications dans le portail web. */
  web: boolean
  email: boolean
  /** Messages WhatsApp, envoyés uniquement avec le consentement de l'utilisateur. */
  whatsapp: boolean
}

/** Événements qui donnent lieu à une notification. */
export interface NotificationTopics {
  alertes: boolean
  messages: boolean
  rendezVous: boolean
}

export interface NotificationPreferences {
  channels: NotificationChannels
  topics: NotificationTopics
}

export const defaultPreferences: NotificationPreferences = {
  channels: { web: true, email: true, whatsapp: false },
  topics: { alertes: true, messages: true, rendezVous: true },
}
