import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Alert } from '@/components/ui/Alert'
import { IconLink, recordIconPath } from '@/components/ui/IconLink'
import { attachmentError, kindOf, prepareImage } from '@/features/messaging/attachments'
import { audioCallIconPath, micIconPath, videoCallIconPath } from '@/features/messaging/callIcons'
import { AttachmentMenu } from '@/features/messaging/components/AttachmentMenu'
import {
  AttachmentPreview,
  type PendingAttachment,
} from '@/features/messaging/components/AttachmentPreview'
import { CallScreen } from '@/features/messaging/components/CallScreen'
import { InitialsTile } from '@/features/messaging/components/InitialsTile'
import { MessageAttachmentView } from '@/features/messaging/components/MessageAttachmentView'
import { VoiceNotePlayer } from '@/features/messaging/components/VoiceNotePlayer'
import { WaveformBars } from '@/features/messaging/components/WaveformBars'
import {
  dayKey,
  formatCallDuration,
  formatDay,
  formatTime,
  formatTimer,
} from '@/features/messaging/format'
import {
  LIVE_BARS,
  useVoiceRecorder,
  VOICE_MAX_SECONDS,
} from '@/features/messaging/hooks/useVoiceRecorder'
import { listCalls } from '@/features/messaging/services/callService'
import {
  listMessages,
  MESSAGE_MAX_LENGTH,
  sendAttachmentMessage,
  sendMessage,
  sendVoiceMessage,
} from '@/features/messaging/services/messagingService'
import type { CallRecord, CallType } from '@/features/messaging/types/call'
import type { Conversation, Message } from '@/features/messaging/types/message'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useFeedback } from '@/hooks/useFeedback'

// Pictogramme « flèche vers la gauche ».
const backIconPath = 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2Z'
const sendIconPath = 'M3.4 20.4 21 12 3.4 3.6 3 10.2l12 1.8-12 1.8.4 6.6Z'
const trashIconPath = 'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z'
const stopIconPath = 'M7 7h10v10H7V7Z'

interface ComposerButtonProps {
  label: string
  iconPath: string
  /** Action principale (envoi, micro), sur fond de couleur principale. */
  primary?: boolean
  busy?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
}

/** Bouton rond à pictogramme de la zone de saisie. */
function ComposerButton({
  label,
  iconPath,
  primary = false,
  busy = false,
  disabled = false,
  type = 'button',
  onClick,
}: ComposerButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? 'bg-primary text-white hover:bg-primary-strong'
          : 'text-muted hover:bg-danger-soft hover:text-danger'
      }`}
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={iconPath} />
      </svg>
    </button>
  )
}

/** Élément du fil : un message, ou la trace d'un appel. */
type ThreadItem =
  | { kind: 'message'; id: string; at: string; message: Message }
  | { kind: 'call'; id: string; at: string; call: CallRecord }

const callTypeLabels: Record<CallType, string> = { audio: 'Appel audio', video: 'Appel vidéo' }

/** Résumé d'un appel dans le fil, par exemple « Appel vidéo passé · 4 min 12 s ». */
function callSummary(call: CallRecord) {
  const direction = call.initiator === 'professionnel' ? 'passé' : 'reçu'
  return call.durationSeconds === undefined
    ? `${callTypeLabels[call.type]} ${direction}, sans réponse`
    : `${callTypeLabels[call.type]} ${direction} · ${formatCallDuration(call.durationSeconds)}`
}

function CallButton({ type, onClick }: { type: CallType; onClick: () => void }) {
  const label = type === 'video' ? 'Lancer un appel vidéo' : 'Lancer un appel audio'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-primary-strong hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary"
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={type === 'video' ? videoCallIconPath : audioCallIconPath} />
      </svg>
    </button>
  )
}

interface ConversationThreadProps {
  conversation: Conversation
  /** Messages envoyés depuis l'ouverture de l'écran, toutes conversations confondues. */
  sent: Message[]
  onSent: (message: Message) => void
  /** Appel lancé dès l'ouverture, par exemple depuis une alerte (« Appeler le patient »). */
  initialCall?: CallType
}

/** Fil d'une conversation : messages reçus et envoyés, puis saisie d'un nouveau message. */
export function ConversationThread({
  conversation,
  sent,
  onSent,
  initialCall,
}: ConversationThreadProps) {
  const state = useAsyncData(`messages:${conversation.id}`, () => listMessages(conversation.id))
  const callsState = useAsyncData(`calls:${conversation.id}`, () => listCalls(conversation.id))
  const fieldId = useId()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  // Appel en cours, et appels terminés depuis l'ouverture de la conversation.
  const [activeCall, setActiveCall] = useState<CallType | undefined>(initialCall)
  const [endedCalls, setEndedCalls] = useState<CallRecord[]>([])
  const voice = useVoiceRecorder()
  // Pièce jointe choisie, pas encore envoyée, et refus d'un fichier non accepté.
  const [pending, setPending] = useState<PendingAttachment | null>(null)
  const [attachmentProblem, setAttachmentProblem] = useState<string>()
  const [dragging, setDragging] = useState(false)
  const feedback = useFeedback()
  const endRef = useRef<HTMLLIElement>(null)
  const pendingRef = useRef(pending)
  useEffect(() => {
    pendingRef.current = pending
  })

  // L'aperçu local est libéré si la conversation se ferme avant l'envoi.
  useEffect(
    () => () => {
      if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.previewUrl)
    },
    [],
  )

  const pickFile = (file: File) => {
    const problem = attachmentError(file)
    setAttachmentProblem(problem)
    if (problem) return
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending({ kind: kindOf(file.type) ?? 'file', file, previewUrl: URL.createObjectURL(file) })
    document.getElementById(fieldId)?.focus()
  }

  const removePending = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending(null)
  }

  // Glisser-déposer un fichier sur la conversation, comme sur WhatsApp Web.
  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files')
  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!hasFiles(event) || state.status !== 'success') return
    event.preventDefault()
    setDragging(true)
  }
  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) pickFile(file)
  }

  // Coller une capture d'écran dans le champ de saisie l'ajoute en pièce jointe.
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = event.clipboardData.files[0]
    if (!file) return
    event.preventDefault()
    pickFile(file)
  }

  const loaded = state.status === 'success' ? state.data : []
  const messages = [
    ...loaded,
    ...sent.filter(
      (message) =>
        message.conversationId === conversation.id &&
        !loaded.some((known) => known.id === message.id),
    ),
  ]
  // Sans l'historique des appels, la conversation reste lisible : seuls les messages s'affichent.
  const loadedCalls = callsState.status === 'success' ? callsState.data : []
  const calls = [
    ...loadedCalls,
    ...endedCalls.filter((call) => !loadedCalls.some((known) => known.id === call.id)),
  ]
  const items: ThreadItem[] =
    state.status === 'success'
      ? [
          ...messages.map((message) => ({
            kind: 'message' as const,
            id: message.id,
            at: message.sentAt,
            message,
          })),
          ...calls.map((call) => ({
            kind: 'call' as const,
            id: call.id,
            at: call.startedAt,
            call,
          })),
        ].sort((a, b) => a.at.localeCompare(b.at))
      : []

  // Le dernier élément reste visible à l'ouverture, après chaque envoi et après chaque appel.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [items.length])

  const handleCallClosed = (record?: CallRecord) => {
    setActiveCall(undefined)
    if (record) setEndedCalls((current) => [...current, record])
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if ((!text.trim() && !pending) || sending) return
    setSending(true)
    try {
      if (pending) {
        const { file, kind } = pending
        // Une photo trop lourde est réduite avant l'envoi.
        const content = kind === 'image' ? await prepareImage(file) : file
        onSent(
          await sendAttachmentMessage(
            conversation.id,
            content,
            { kind, name: file.name, size: content.size, mimeType: content.type || file.type },
            text.trim(),
          ),
        )
        removePending()
      } else {
        onSent(await sendMessage(conversation.id, text.trim()))
      }
      setText('')
    } catch {
      feedback.error(
        "Le message n'a pas pu être envoyé",
        'Votre message est conservé. Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setSending(false)
    }
  }

  const handleSendVoice = async () => {
    if (voice.state.status !== 'recorded' || sending) return
    setSending(true)
    try {
      const { recording, durationSeconds, waveform } = voice.state
      onSent(await sendVoiceMessage(conversation.id, recording, durationSeconds, waveform))
      voice.reset()
    } catch {
      feedback.error(
        "Le message vocal n'a pas pu être envoyé",
        'Votre enregistrement est conservé. Vérifiez votre connexion puis réessayez.',
      )
    } finally {
      setSending(false)
    }
  }

  // Entrée envoie le message ; Maj + Entrée va à la ligne.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <section
      aria-label={`Conversation avec ${conversation.patientName}`}
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        // Sortie de la zone, et non passage d'un élément enfant à un autre.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={handleDrop}
      className="relative flex min-h-0 flex-1 flex-col"
    >
      {dragging && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 z-10 flex animate-pop items-center justify-center rounded-3xl border-2 border-dashed border-primary bg-primary-soft/95"
        >
          <p className="font-display text-base font-bold text-primary-strong">
            Déposez la photo ou le document ici
          </p>
        </div>
      )}
      <header className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
        <div className="lg:hidden">
          <IconLink to="/messagerie" label="Revenir aux conversations" iconPath={backIconPath} />
        </div>
        <InitialsTile name={conversation.patientName} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-bold text-ink">
            {conversation.patientName}
          </h2>
          <p className="text-xs text-muted">Dossier n° {conversation.patientFileNumber}</p>
        </div>
        <div className="flex items-center gap-1">
          <CallButton type="audio" onClick={() => setActiveCall('audio')} />
          <CallButton type="video" onClick={() => setActiveCall('video')} />
          <IconLink
            to={`/patients/${conversation.patientId}`}
            label="Consulter le dossier du patient"
            iconPath={recordIconPath}
          />
        </div>
      </header>

      {activeCall && (
        <CallScreen
          conversationId={conversation.id}
          patientName={conversation.patientName}
          type={activeCall}
          onClose={handleCallClosed}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-page px-4 py-6 sm:px-6">
        {state.status === 'loading' && (
          <div role="status" className="mt-auto flex flex-col gap-4">
            <span className="sr-only">Chargement des messages…</span>
            <div aria-hidden="true" className="skeleton h-12 w-2/5 rounded-3xl" />
            <div aria-hidden="true" className="skeleton h-12 w-1/3 self-end rounded-3xl" />
            <div aria-hidden="true" className="skeleton h-12 w-1/2 rounded-3xl" />
          </div>
        )}
        {state.status === 'error' && (
          <Alert variant="error" title="Les messages n'ont pas pu être chargés.">
            Rechargez la page pour réessayer.
          </Alert>
        )}
        {state.status === 'success' && items.length === 0 && (
          <p className="m-auto text-center text-sm text-muted">
            Aucun message échangé avec ce patient pour le moment.
          </p>
        )}
        {items.length > 0 && (
          <ol className="mt-auto flex flex-col gap-4" aria-live="polite">
            {items.map((item, index) => {
              const newDay = index === 0 || dayKey(items[index - 1].at) !== dayKey(item.at)
              const ref = index === items.length - 1 ? endRef : undefined
              return (
                <Fragment key={item.id}>
                  {newDay && (
                    <li className="self-center rounded-full bg-surface px-4 py-1 text-xs font-semibold tracking-wide text-muted uppercase">
                      {formatDay(item.at)}
                    </li>
                  )}
                  {item.kind === 'call' ? (
                    <li
                      ref={ref}
                      className="flex animate-enter items-center gap-2 self-center rounded-full border border-line bg-surface px-4 py-2 text-xs shadow-sm"
                    >
                      <svg
                        className={`size-4 shrink-0 ${
                          item.call.durationSeconds === undefined
                            ? 'text-danger'
                            : 'text-primary-strong'
                        }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          d={item.call.type === 'video' ? videoCallIconPath : audioCallIconPath}
                        />
                      </svg>
                      <span className="font-semibold text-ink">{callSummary(item.call)}</span>
                      <span className="text-muted">{formatTime(item.at)}</span>
                    </li>
                  ) : (
                    <li
                      ref={ref}
                      className={`flex max-w-[80%] animate-enter flex-col gap-1 ${
                        item.message.author === 'professionnel'
                          ? 'items-end self-end'
                          : 'items-start self-start'
                      }`}
                    >
                      <span className="sr-only">
                        {item.message.author === 'professionnel'
                          ? 'Vous'
                          : conversation.patientName}
                      </span>
                      <div
                        className={`rounded-3xl text-sm whitespace-pre-line shadow-sm ${
                          item.message.attachment
                            ? 'flex flex-col gap-2 p-1.5'
                            : item.message.voice
                              ? 'px-4 py-3'
                              : 'px-5 py-3'
                        } ${
                          item.message.author === 'professionnel'
                            ? 'rounded-br-lg bg-primary-strong text-white'
                            : 'rounded-bl-lg bg-surface text-ink'
                        }`}
                      >
                        {item.message.attachment ? (
                          <>
                            <MessageAttachmentView
                              attachment={item.message.attachment}
                              onPrimary={item.message.author === 'professionnel'}
                            />
                            {item.message.text && (
                              <p className="max-w-64 px-3 pb-1.5">{item.message.text}</p>
                            )}
                          </>
                        ) : item.message.voice ? (
                          <>
                            <span className="sr-only">Message vocal</span>
                            <VoiceNotePlayer
                              url={item.message.voice.url}
                              durationSeconds={item.message.voice.durationSeconds}
                              waveform={item.message.voice.waveform}
                              onPrimary={item.message.author === 'professionnel'}
                            />
                          </>
                        ) : (
                          <p>{item.message.text}</p>
                        )}
                      </div>
                      <p className="px-2 text-xs text-muted">
                        {formatTime(item.at)}
                        {item.message.author === 'professionnel' && (
                          <span className={item.message.readAt ? 'text-primary-strong' : undefined}>
                            {item.message.readAt ? ' · Lu' : ' · Envoyé'}
                          </span>
                        )}
                      </p>
                    </li>
                  )}
                </Fragment>
              )
            })}
          </ol>
        )}
      </div>

      {state.status === 'success' && (
        <form
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:px-6"
        >
          {voice.state.status === 'error' && (
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-danger-soft px-4 py-3">
              <p role="alert" className="text-sm text-danger">
                {voice.state.reason === 'denied'
                  ? 'Accès au micro refusé. Autorisez le micro pour eCare+ dans les réglages du navigateur.'
                  : "Aucun micro utilisable n'a été trouvé. Branchez ou activez un micro."}
              </p>
              <button
                type="button"
                onClick={voice.reset}
                className="shrink-0 text-sm font-semibold text-danger underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Fermer
              </button>
            </div>
          )}

          {attachmentProblem && (
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-danger-soft px-4 py-3">
              <p role="alert" className="text-sm text-danger">
                {attachmentProblem}
              </p>
              <button
                type="button"
                onClick={() => setAttachmentProblem(undefined)}
                className="shrink-0 text-sm font-semibold text-danger underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                Fermer
              </button>
            </div>
          )}
          {pending && (
            <AttachmentPreview attachment={pending} disabled={sending} onRemove={removePending} />
          )}

          {voice.state.status === 'recording' ? (
            <div className="flex items-center gap-3 rounded-4xl border border-control bg-surface py-2 pr-2 pl-3">
              <ComposerButton
                label="Annuler l'enregistrement"
                iconPath={trashIconPath}
                onClick={voice.reset}
              />
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 animate-pulse rounded-full bg-danger"
              />
              <p role="status" className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                <span className="sr-only">Enregistrement en cours, </span>
                {formatTimer(voice.state.elapsed)}
                <span className="sr-only"> sur {formatTimer(VOICE_MAX_SECONDS)} au maximum</span>
              </p>
              {/* Les barres suivent la voix en direct, les plus récentes à droite. */}
              <div className="min-w-0 flex-1">
                <WaveformBars
                  values={[
                    ...Array.from({ length: LIVE_BARS - voice.state.levels.length }, () => 0),
                    ...voice.state.levels,
                  ]}
                />
              </div>
              <ComposerButton
                label="Arrêter l'enregistrement"
                iconPath={stopIconPath}
                primary
                onClick={voice.stop}
              />
            </div>
          ) : voice.state.status === 'recorded' ? (
            <div className="flex items-center gap-3 rounded-4xl border border-control bg-surface py-2 pr-2 pl-3">
              <ComposerButton
                label="Supprimer l'enregistrement"
                iconPath={trashIconPath}
                disabled={sending}
                onClick={voice.reset}
              />
              <div className="min-w-0 flex-1">
                <VoiceNotePlayer
                  url={voice.state.url}
                  durationSeconds={voice.state.durationSeconds}
                  waveform={voice.state.waveform}
                />
              </div>
              <ComposerButton
                label="Envoyer le message vocal"
                iconPath={sendIconPath}
                primary
                busy={sending}
                onClick={() => void handleSendVoice()}
              />
            </div>
          ) : (
            <div className="flex items-end gap-1 rounded-4xl border border-control bg-surface py-2 pr-2 pl-2 focus-within:outline-2 focus-within:outline-primary">
              <AttachmentMenu disabled={sending} onPick={pickFile} />
              <label htmlFor={fieldId} className="sr-only">
                {pending ? 'Légende de la pièce jointe' : 'Votre message'}
              </label>
              <textarea
                id={fieldId}
                rows={1}
                maxLength={MESSAGE_MAX_LENGTH}
                placeholder={pending ? 'Ajoutez une légende…' : 'Écrivez votre message…'}
                value={text}
                disabled={sending}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-ink field-sizing-content placeholder:text-muted focus:outline-none disabled:text-muted"
              />
              {/* Champ vide : le micro remplace l'envoi, comme sur l'application mobile. */}
              {text.trim() || pending ? (
                <ComposerButton
                  type="submit"
                  label="Envoyer le message"
                  iconPath={sendIconPath}
                  primary
                  busy={sending}
                />
              ) : (
                <ComposerButton
                  label="Enregistrer un message vocal"
                  iconPath={micIconPath}
                  primary
                  busy={voice.state.status === 'starting'}
                  disabled={sending}
                  onClick={() => void voice.start()}
                />
              )}
            </div>
          )}
        </form>
      )}
    </section>
  )
}
