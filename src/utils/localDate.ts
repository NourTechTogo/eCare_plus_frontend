/* Conversions entre dates-heures ISO et champs de formulaire `date` / `time`, à l'heure locale. */

const pad = (value: number) => String(value).padStart(2, '0')

/** Date locale au format `AAAA-MM-JJ`, attendu par un champ `type="date"`. */
export function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Heure locale au format `HH:MM`, attendu par un champ `type="time"`. */
export function toTimeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Date-heure ISO à partir d'une date et d'une heure locales saisies dans un formulaire. */
export function fromDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso))
}

/** Titre d'une journée d'agenda : « Aujourd'hui », « Demain », « Hier » ou « jeudi 29 octobre ». */
export function formatDayHeading(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const offset = Math.round(
    (new Date(date).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / 86_400_000,
  )
  if (offset === 0) return "Aujourd'hui"
  if (offset === 1) return 'Demain'
  if (offset === -1) return 'Hier'
  const label = dayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const dayKey = (iso: string) => new Date(iso).toDateString()
