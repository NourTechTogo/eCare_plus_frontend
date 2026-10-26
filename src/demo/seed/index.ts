import type { Database } from '@/demo/database'
import { articles } from '@/demo/seed/articles'
import { buildIntakes, documents, notes, treatments } from '@/demo/seed/care'
import { availabilities, buildAppointments } from '@/demo/seed/appointments'
import { calls, conversations, messages } from '@/demo/seed/communication'
import { buildMeasurementsAndAlerts, thresholds } from '@/demo/seed/measurements'
import { accounts, patients, pendingRegistrations } from '@/demo/seed/people'

/** Jeu de données de départ de la plateforme (livrable L12 du cahier des charges). */
export function createSeed(): Database {
  const { measurements, alerts } = buildMeasurementsAndAlerts(patients)
  return structuredClone({
    accounts,
    patients,
    pendingRegistrations,
    measurements,
    thresholds,
    alerts,
    treatments,
    intakes: buildIntakes(),
    documents,
    notes,
    conversations,
    messages,
    calls,
    availabilities,
    appointments: buildAppointments(patients),
    articles,
    preferences: {},
    passwordResets: [],
    lastFileNumber: patients.length,
  })
}
