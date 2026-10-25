import type { CallRecord, CallSession, CallType } from '@/features/messaging/types/call'
// No signaling or remote media transport is configured; legacy call components are unreachable.
const unavailable = () => new Error('Les appels ne sont pas disponibles. Utilisez la messagerie texte.')
export async function listCalls(_conversationId: string): Promise<CallRecord[]> { throw unavailable() }
export async function startCall(_conversationId: string, _type: CallType): Promise<CallSession> { throw unavailable() }
export function onCallAnswered(_session: CallSession, _onAnswered: () => void): () => void { throw unavailable() }
export async function endCall(_session: CallSession, _startedAt: string, _durationSeconds?: number): Promise<CallRecord> { throw unavailable() }
