export type AlertPriority = 'haute' | 'moyenne' | 'faible' | 'critique'

export interface AlertResolution {
  /** Observations saisies par le professionnel à la clôture. */
  note: string
  closedAt: string
  closedBy: string
}

export interface Alert {
  status: string
  id: string
  patientId: string
  patientName: string
  patientFileNumber: string
  /** Ce qui a déclenché l'alerte, formulé comme un constat et non comme un diagnostic. */
  trigger: string
  /** Valeur mesurée, avec son unité. */
  value: string
  /** Seuil de la règle de suivi qui a été dépassé, avec son unité. */
  threshold: string
  priority: AlertPriority
  triggeredAt: string
  /** Présent une fois l'alerte clôturée. */
  resolution?: AlertResolution
}
