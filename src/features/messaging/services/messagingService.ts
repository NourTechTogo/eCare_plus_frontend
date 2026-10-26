import { requireDoctor, requirePatient } from '@/demo/access'
import {
  mutate,
  PlatformError,
  query,
  type ConversationRecord,
  type Database,
} from '@/demo/database'
import { currentAccount } from '@/demo/session'
import type { Conversation, Message, MessageAttachment } from '@/features/messaging/types/message'

/*
 * Messagerie patient–médecin (EF-W3-1 à 5). Routes attendues : GET /conversations,
 * POST /patients/{id}/conversation, GET|POST /conversations/{id}/messages,
 * POST /conversations/{id}/lecture, et un canal temps réel (voir docs/CONTRAT_API.md).
 */

/** Longueur maximale d'un message acceptée par le backend. */
export const MESSAGE_MAX_LENGTH = 2000

function toConversation(db: Database, record: ConversationRecord): Conversation {
  const patient = db.patients.find((candidate) => candidate.id === record.patientId)
  const thread = db.messages
    .filter((message) => message.conversationId === record.id)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  return {
    ...record,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
    patientFileNumber: patient?.fileNumber ?? '',
    lastMessage: thread.at(-1),
    unreadCount: thread.filter((message) => message.author === 'patient' && !message.readAt).length,
  }
}

/** Conversation accessible au médecin connecté : la sienne, avec un patient qui lui est rattaché. */
function ownConversation(db: Database, conversationId: string) {
  const doctor = requireDoctor(db)
  const record = db.conversations.find((candidate) => candidate.id === conversationId)
  if (!record || record.doctorId !== doctor.id) throw new PlatformError('Conversation introuvable')
  requirePatient(db, record.patientId)
  return record
}

/** Conversations du médecin, la plus récemment active en premier. */
export async function listConversations(): Promise<Conversation[]> {
  return query((db) => {
    const account = currentAccount(db)
    if (account.role !== 'medecin') return []
    const patients = new Set(
      db.patients
        .filter((patient) => patient.referentDoctorId === account.id && patient.status === 'actif')
        .map((patient) => patient.id),
    )
    return db.conversations
      .filter((record) => record.doctorId === account.id && patients.has(record.patientId))
      .map((record) => toConversation(db, record))
      .sort((a, b) => (b.lastMessage?.sentAt ?? '').localeCompare(a.lastMessage?.sentAt ?? ''))
  })
}

/**
 * Conversation avec un patient, créée si elle n'existe pas encore : le médecin peut écrire depuis
 * le dossier ou depuis une alerte (scénario 2.4.6).
 */
export async function openConversation(patientId: string): Promise<Conversation> {
  return mutate((db) => {
    const doctor = requireDoctor(db)
    requirePatient(db, patientId)
    let record = db.conversations.find(
      (candidate) => candidate.patientId === patientId && candidate.doctorId === doctor.id,
    )
    if (!record) {
      record = { id: `conv-${crypto.randomUUID().slice(0, 8)}`, patientId, doctorId: doctor.id }
      db.conversations.push(record)
    }
    return toConversation(db, record)
  })
}

/** Messages d'une conversation, du plus ancien au plus récent. */
export async function listMessages(conversationId: string): Promise<Message[]> {
  return query((db) => {
    ownConversation(db, conversationId)
    return db.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  })
}

async function send(
  conversationId: string,
  content: Pick<Message, 'text' | 'voice' | 'attachment'>,
) {
  return mutate((db) => {
    ownConversation(db, conversationId)
    const message: Message = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      conversationId,
      author: 'professionnel',
      sentAt: new Date().toISOString(),
      ...content,
    }
    db.messages.push(message)
    return message
  })
}

/** Contenu d'un fichier sous forme d'adresse autonome, conservée avec le message. */
function toDataUrl(content: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(content)
  })
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  return send(conversationId, { text })
}

export async function sendVoiceMessage(
  conversationId: string,
  recording: Blob,
  durationSeconds: number,
  waveform: number[],
): Promise<Message> {
  const url = await toDataUrl(recording)
  return send(conversationId, { text: '', voice: { url, durationSeconds, waveform } })
}

/** Photo ou document, avec une légende facultative (EF-W3-5). */
export async function sendAttachmentMessage(
  conversationId: string,
  content: Blob,
  details: Omit<MessageAttachment, 'url'>,
  caption: string,
): Promise<Message> {
  const url = await toDataUrl(content)
  return send(conversationId, { text: caption, attachment: { ...details, url } })
}

/** Le médecin a lu les messages du patient : le patient voit l'accusé de lecture. */
export async function markConversationRead(conversationId: string): Promise<void> {
  await mutate((db) => {
    ownConversation(db, conversationId)
    const now = new Date().toISOString()
    for (const message of db.messages) {
      if (
        message.conversationId === conversationId &&
        message.author === 'patient' &&
        !message.readAt
      ) {
        message.readAt = now
      }
    }
  })
}
