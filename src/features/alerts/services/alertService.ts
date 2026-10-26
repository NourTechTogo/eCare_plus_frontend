import { requireDoctor, visiblePatients } from '@/demo/access'
import { mutate, PlatformError, query, type Database } from '@/demo/database'
import { displayName } from '@/demo/session'
import type { Alert } from '@/features/alerts/types/alert'

/*
 * Alertes de télésuivi, créées côté serveur à chaque mesure hors seuil (RG-W2-2). Routes
 * attendues : GET /alertes?statut=&gravite=, GET /alertes/{id}, PATCH /alertes/{id}
 * (voir docs/CONTRAT_API.md). Une alerte signale un dépassement de seuil : ce n'est pas un diagnostic.
 */

const severityRank = { critique: 0, attention: 1 } as const

/** File prioritaire (EF-W2-16) : par gravité, puis de la plus récente à la plus ancienne. */
export const byPriority = (a: Alert, b: Alert) =>
  severityRank[a.severity] - severityRank[b.severity] || b.triggeredAt.localeCompare(a.triggeredAt)

function visibleAlerts(db: Database) {
  const ids = new Set(visiblePatients(db).map((patient) => patient.id))
  return db.alerts.filter((alert) => ids.has(alert.patientId))
}

function findAlert(db: Database, id: string) {
  const alert = visibleAlerts(db).find((candidate) => candidate.id === id)
  if (!alert) throw new PlatformError('Alerte introuvable')
  return alert
}

export async function listAlerts(): Promise<Alert[]> {
  return query((db) => [...visibleAlerts(db)].sort(byPriority))
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  return query((db) => visibleAlerts(db).find((alert) => alert.id === id))
}

/** Première consultation par le médecin : l'alerte passe de « nouvelle » à « vue ». */
export async function markAlertSeen(id: string): Promise<Alert> {
  return mutate((db) => {
    requireDoctor(db)
    const alert = findAlert(db, id)
    if (alert.status === 'nouvelle') {
      alert.status = 'vue'
      alert.seenAt = new Date().toISOString()
    }
    return alert
  })
}

/** Le médecin marque l'alerte comme traitée, avec un commentaire (EF-W2-15). */
export async function handleAlert(id: string, comment: string): Promise<Alert> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    const alert = findAlert(db, id)
    const now = new Date().toISOString()
    alert.status = 'traitee'
    alert.seenAt ??= now
    alert.handledAt = now
    alert.handledBy = displayName(doctor)
    alert.handledComment = comment
    return alert
  })
}
