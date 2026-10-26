/* Dates relatives à aujourd'hui, pour que le jeu de données reste réaliste quel que soit le jour. */

const pad = (value: number) => String(value).padStart(2, '0')

/** Date-heure ISO-8601, `offsetDays` jours après aujourd'hui (négatif : dans le passé), à l'heure locale `HH:MM`. */
export function at(offsetDays: number, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

/** Date-heure ISO-8601, `minutes` minutes avant maintenant. */
export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

/** Date locale au format `AAAA-MM-JJ`, `offsetDays` jours après aujourd'hui. */
export function day(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Minuit local du jour d'une date. */
export function startOfDay(date: Date): number {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}
