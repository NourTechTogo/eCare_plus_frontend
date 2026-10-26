import { mutate, query } from '@/demo/database'
import type { CallRecord, CallSession, CallType } from '@/features/messaging/types/call'

/*
 * Appels audio et vidéo depuis la conversation (EF-W3-6 à 10). Route attendue :
 * POST /conversations/{id}/appels, qui crée une salle unique et prévient le patient ; la salle est
 * ensuite ouverte sur le service d'appel retenu avec l'application mobile (voir docs/CONTRAT_API.md).
 * Sur la base locale, le patient décroche après quelques secondes.
 */

/** Délai avant que le patient ne décroche, sur la base locale. */
const ANSWER_DELAY_MS = 3000

/** Appels d'une conversation, du plus ancien au plus récent. */
export async function listCalls(conversationId: string): Promise<CallRecord[]> {
  return query((db) =>
    db.calls
      .filter((call) => call.conversationId === conversationId)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
  )
}

export async function startCall(conversationId: string, type: CallType): Promise<CallSession> {
  return query(() => ({
    id: `call-${crypto.randomUUID().slice(0, 8)}`,
    conversationId,
    type,
    // Identifiant de salle aléatoire et long, jamais réutilisé (RG-W3-2).
    roomId: crypto.randomUUID(),
  }))
}

/** Prévient quand le patient décroche ; la fonction renvoyée annule l'écoute. */
export function onCallAnswered(_session: CallSession, onAnswered: () => void): () => void {
  const timer = setTimeout(onAnswered, ANSWER_DELAY_MS)
  return () => clearTimeout(timer)
}

/** Fin de l'appel : il est tracé dans la conversation avec sa date, sa durée et son type. */
export async function endCall(
  session: CallSession,
  startedAt: string,
  durationSeconds?: number,
): Promise<CallRecord> {
  return mutate((db) => {
    const record: CallRecord = {
      id: session.id,
      conversationId: session.conversationId,
      type: session.type,
      initiator: 'professionnel',
      startedAt,
      durationSeconds,
    }
    db.calls.push(record)
    return record
  })
}
