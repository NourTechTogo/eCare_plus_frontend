import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  cameraOffIconPath,
  hangUpIconPath,
  micIconPath,
  micOffIconPath,
  videoCallIconPath,
} from '@/features/messaging/callIcons'
import { formatTimer, getInitials } from '@/features/messaging/format'
import { useLocalMedia } from '@/features/messaging/hooks/useLocalMedia'
import { endCall, onCallAnswered, startCall } from '@/features/messaging/services/callService'
import type { CallRecord, CallSession, CallType } from '@/features/messaging/types/call'

const typeLabels: Record<CallType, string> = { audio: 'Appel audio', video: 'Appel vidéo' }

interface ControlButtonProps {
  label: string
  iconPath: string
  /** État d'un bouton bascule (micro ou caméra coupés). */
  pressed?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

export function ControlButton({ label, iconPath, pressed, danger, disabled, onClick }: ControlButtonProps) {
  const tone = danger
    ? 'bg-danger text-white hover:shadow-lg'
    : pressed
      ? 'bg-white text-ink'
      : 'bg-white/15 text-white hover:bg-white/25'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-14 items-center justify-center rounded-full transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${tone}`}
    >
      <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={iconPath} />
      </svg>
    </button>
  )
}

interface CallScreenProps {
  conversationId: string
  patientName: string
  type: CallType
  /** Fermeture de l'écran, avec la trace de l'appel s'il a pu être lancé. */
  onClose: (record?: CallRecord) => void
}

/** Écran d'un appel sortant : sonnerie, communication, puis raccrochage. */
export function CallScreen({ conversationId, patientName, type, onClose }: CallScreenProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const media = useLocalMedia(type)
  const [startedAt] = useState(() => new Date().toISOString())
  const [session, setSession] = useState<CallSession>()
  const [serviceFailed, setServiceFailed] = useState(false)
  const [answeredAt, setAnsweredAt] = useState<number>()
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [ending, setEnding] = useState(false)

  const stream = media.status === 'ready' ? media.stream : undefined
  const showCamera = type === 'video' && media.status === 'ready' && media.cameraAvailable

  // Ouverture modale : le reste de l'application est inactif pendant l'appel.
  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  // L'appel n'est lancé qu'une fois le micro ouvert.
  useEffect(() => {
    if (!stream) return
    let active = true
    startCall(conversationId, type)
      .then((opened) => {
        if (active) setSession(opened)
      })
      .catch(() => {
        if (active) setServiceFailed(true)
      })
    return () => {
      active = false
    }
  }, [stream, conversationId, type])

  useEffect(() => {
    if (!session) return
    return onCallAnswered(session, () => setAnsweredAt(Date.now()))
  }, [session])

  useEffect(() => {
    if (answeredAt === undefined) return
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - answeredAt) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [answeredAt])

  useEffect(() => {
    stream?.getAudioTracks().forEach((track) => (track.enabled = !muted))
  }, [stream, muted])

  useEffect(() => {
    stream?.getVideoTracks().forEach((track) => (track.enabled = !cameraOff))
  }, [stream, cameraOff])

  useEffect(() => {
    if (showCamera && videoRef.current && stream) videoRef.current.srcObject = stream
  }, [showCamera, stream])

  const hangUp = async () => {
    if (ending) return
    setEnding(true)
    if (!session) return onClose()
    const duration =
      answeredAt === undefined ? undefined : Math.floor((Date.now() - answeredAt) / 1000)
    try {
      onClose(await endCall(session, startedAt, duration))
    } catch {
      onClose()
    }
  }

  const devices = type === 'video' ? 'le micro et la caméra' : 'le micro'
  const problem =
    media.status === 'error'
      ? media.reason === 'denied'
        ? {
            title: 'Accès au micro refusé',
            description: `Autorisez ${devices} pour eCare+ dans les réglages du navigateur, puis relancez l'appel.`,
          }
        : {
            title: 'Aucun micro détecté',
            description: "Branchez ou activez un micro, puis relancez l'appel.",
          }
      : serviceFailed
        ? {
            title: "L'appel n'a pas pu démarrer",
            description:
              "Le service d'appel ne répond pas. Vous pouvez écrire au patient dans la conversation.",
          }
        : undefined

  const ringing = session !== undefined && answeredAt === undefined
  const status = problem
    ? problem.title
    : ending
      ? "Fin de l'appel…"
      : answeredAt !== undefined
        ? formatTimer(elapsed)
        : ringing
          ? 'Sonnerie…'
          : stream
            ? 'Connexion…'
            : `Ouverture ${type === 'video' ? 'du micro et de la caméra' : 'du micro'}…`

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Échap ne raccroche pas : la fin d'un appel passe par le bouton dédié.
      onCancel={(event) => event.preventDefault()}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-ink text-white backdrop:bg-ink"
    >
      <div className="relative flex h-full flex-col items-center justify-between gap-8 px-4 py-10 sm:px-8">
        <p className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold tracking-wide uppercase">
          {typeLabels[type]}
        </p>

        <div className="flex flex-col items-center gap-6 text-center">
          <span
            aria-hidden="true"
            className={`inline-flex size-32 items-center justify-center rounded-full bg-primary-strong font-display text-4xl font-bold ${
              ringing ? 'animate-pulse' : ''
            }`}
          >
            {getInitials(patientName)}
          </span>
          <div className="flex flex-col items-center gap-2">
            <h2 id={titleId} className="font-display text-2xl font-bold">
              {patientName}
            </h2>
            <p role="status" className="text-base text-white/80 tabular-nums">
              {status}
            </p>
            {problem && <p className="max-w-sm text-sm text-white/80">{problem.description}</p>}
            {type === 'video' && media.status === 'ready' && !media.cameraAvailable && (
              <p className="max-w-sm text-sm text-white/80">
                Caméra indisponible : l'appel continue en audio.
              </p>
            )}
          </div>
        </div>

        {showCamera && (
          <div className="absolute right-4 bottom-44aspect-video w-36 overflow-hidden rounded-2xl bg-black/40 shadow-lg sm:right-8 sm:w-56">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="Votre caméra"
              className={`size-full -scale-x-100 object-cover ${cameraOff ? 'invisible' : ''}`}
            />
            {cameraOff && (
              <p className="absolute inset-0 flex items-center justify-center text-xs">
                Caméra coupée
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center">
          {problem ? (
            <Button variant="secondary" onClick={() => onClose()}>
              Fermer
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <ControlButton
                label="Couper le micro"
                iconPath={muted ? micOffIconPath : micIconPath}
                pressed={muted}
                disabled={!stream || ending}
                onClick={() => setMuted((current) => !current)}
              />
              {showCamera && (
                <ControlButton
                  label="Couper la caméra"
                  iconPath={cameraOff ? cameraOffIconPath : videoCallIconPath}
                  pressed={cameraOff}
                  disabled={ending}
                  onClick={() => setCameraOff((current) => !current)}
                />
              )}
              <ControlButton
                label="Raccrocher"
                iconPath={hangUpIconPath}
                danger
                disabled={ending}
                onClick={() => void hangUp()}
              />
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}
