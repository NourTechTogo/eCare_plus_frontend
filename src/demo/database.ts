import type { Alert } from '@/features/alerts/types/alert'
import type { Appointment, Availability } from '@/features/appointments/types/appointment'
import type { Article } from '@/features/articles/types/article'
import type { UserRole } from '@/features/auth/types/auth'
import type { PatientDocument } from '@/features/documents/types/document'
import type { Measurement, PatientThreshold } from '@/features/measurements/types/measurement'
import type { CallRecord } from '@/features/messaging/types/call'
import type { Message } from '@/features/messaging/types/message'
import type { ClinicalNote } from '@/features/notes/types/note'
import type { Patient, PendingRegistration } from '@/features/patients/types/patient'
import type { NotificationPreferences } from '@/features/profile/types/preferences'
import type { AccountStatus } from '@/features/staff/types/doctor'
import type { Intake, Treatment } from '@/features/treatments/types/treatment'
import { createSeed } from '@/demo/seed'
import { startOfDay } from '@/demo/time'

/*
 * Base de données locale de la plateforme, utilisée tant que le backend n'expose pas les routes
 * décrites dans docs/CONTRAT_API.md. Tous les services lisent et écrivent ici, ce qui garde les
 * écrans cohérents entre eux : un patient créé par l'établissement apparaît chez son médecin.
 */

/** Compte d'un utilisateur du portail : administrateur, personnel de l'établissement ou médecin. */
export interface StaffAccount {
  id: string
  role: UserRole
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  status: AccountStatus
  createdAt: string
  specialty?: string
  avatarUrl?: string
}

export interface ConversationRecord {
  id: string
  patientId: string
  doctorId: string
}

/** Demande de réinitialisation du mot de passe en cours. */
export interface PasswordReset {
  email: string
  code: string
  token?: string
  expiresAt: string
  attempts: number
}

export interface Database {
  accounts: StaffAccount[]
  patients: Patient[]
  pendingRegistrations: PendingRegistration[]
  measurements: Measurement[]
  thresholds: PatientThreshold[]
  alerts: Alert[]
  treatments: Treatment[]
  intakes: Intake[]
  documents: PatientDocument[]
  notes: ClinicalNote[]
  conversations: ConversationRecord[]
  messages: Message[]
  calls: CallRecord[]
  availabilities: Availability[]
  appointments: Appointment[]
  articles: Article[]
  preferences: Record<string, NotificationPreferences>
  passwordResets: PasswordReset[]
  /** Dernier numéro de dossier attribué. */
  lastFileNumber: number
}

const STORAGE_KEY = 'ecare.plateforme'
/** À incrémenter quand la structure de la base change : la base est alors reconstruite. */
const SCHEMA_VERSION = 6
/** Délai de réponse simulé, pour que les états de chargement restent réalistes. */
const LATENCY_MS = 350

interface StoredDatabase {
  version: number
  savedAt: string
  data: Database
}

const ISO_TIMESTAMP = /"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)"/g
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Décale toutes les dates-heures d'un nombre entier de jours : une mesure d'« hier » reste d'hier
 * et un rendez-vous de « demain » reste à venir, quel que soit le jour où la base a été créée.
 */
function shiftTimestamps(serialized: string, days: number) {
  return serialized.replace(ISO_TIMESTAMP, (_match, iso: string) => {
    return `"${new Date(new Date(iso).getTime() + days * DAY_MS).toISOString()}"`
  })
}

function readStorage(): StoredDatabase | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredDatabase) : null
  } catch {
    return null
  }
}

/**
 * Base reconstruite après un changement de structure : les comptes créés depuis le portail sont
 * conservés, pour que personne ne perde son accès.
 */
function rebuild(previous: StoredDatabase | null): Database {
  const seed = createSeed()
  const created = (previous?.data.accounts ?? []).filter(
    (account) =>
      !seed.accounts.some(
        (known) =>
          known.id === account.id || known.email.toLowerCase() === account.email.toLowerCase(),
      ),
  )
  return { ...seed, accounts: [...seed.accounts, ...created] }
}

function load(): Database {
  const stored = readStorage()
  if (!stored || stored.version !== SCHEMA_VERSION) return rebuild(stored)
  const elapsedDays = Math.round(
    (startOfDay(new Date()) - startOfDay(new Date(stored.savedAt))) / DAY_MS,
  )
  if (elapsedDays <= 0) return stored.data
  return JSON.parse(shiftTimestamps(JSON.stringify(stored.data), elapsedDays)) as Database
}

let database: Database | null = null

function current(): Database {
  if (!database) {
    database = load()
    persist()
  }
  return database
}

function persist() {
  try {
    const stored: StoredDatabase = {
      version: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      data: current(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Stockage plein ou indisponible (navigation privée) : les données restent en mémoire.
  }
}

function latency() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS))
}

/** Lecture immédiate, sans délai simulé : réservée aux vérifications faites au démarrage. */
export function peek<T>(read: (db: Database) => T): T {
  return structuredClone(read(current()))
}

/** Lecture : la copie renvoyée protège la base des modifications faites par les écrans. */
export async function query<T>(read: (db: Database) => T): Promise<T> {
  await latency()
  return structuredClone(read(current()))
}

/** Écriture : la modification est enregistrée, puis son résultat est renvoyé en copie. */
export async function mutate<T>(change: (db: Database) => T): Promise<T> {
  await latency()
  const result = change(current())
  persist()
  return structuredClone(result)
}

/** Erreur métier renvoyée par la plateforme, par exemple un doublon ou une ressource introuvable. */
export class PlatformError extends Error {}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
