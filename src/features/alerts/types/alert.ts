import type { MeasurementKind } from '@/features/measurements/types/measurement'

/** Gravité (EF-W2-12) : hors plage normale, ou hors plage dangereuse. */
export type AlertSeverity = 'attention' | 'critique'

/** Cycle de vie d'une alerte (EF-W2-15). */
export type AlertStatus = 'nouvelle' | 'vue' | 'traitee'

export interface Alert {
  id: string
  patientId: string
  patientName: string
  patientFileNumber: string
  /** Médecin référent du patient, destinataire de l'alerte. */
  doctorId: string
  /** Mesure à l'origine de l'alerte. */
  measurementId: string
  kind: MeasurementKind
  /** Ce qui a déclenché l'alerte, formulé comme un constat et non comme un diagnostic. */
  trigger: string
  /** Valeur mesurée, avec son unité. */
  value: string
  /** Seuil franchi, avec son unité. */
  threshold: string
  severity: AlertSeverity
  status: AlertStatus
  triggeredAt: string
  /** Première consultation par le médecin. */
  seenAt?: string
  handledAt?: string
  handledBy?: string
  /** Commentaire obligatoire au traitement de l'alerte. */
  handledComment?: string
}
