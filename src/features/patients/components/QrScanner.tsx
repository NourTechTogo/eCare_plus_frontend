import { useEffect, useRef, useState } from 'react'
import { barcodeDetector } from '@/features/patients/qrSupport'

/** Intervalle entre deux lectures de l'image de la caméra. */
const SCAN_INTERVAL_MS = 300

interface QrScannerProps {
  onDetected: (value: string) => void
  onUnavailable: () => void
}

/** Aperçu de la caméra arrière ; le premier code QR lu est transmis. */
export function QrScanner({ onDetected, onUnavailable }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const Detector = barcodeDetector()
    if (!Detector) {
      onUnavailable()
      return
    }
    const detector = new Detector({ formats: ['qr_code'] })
    let stream: MediaStream | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    let active = true

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (opened) => {
        stream = opened
        if (!active || !videoRef.current) return opened.getTracks().forEach((track) => track.stop())
        videoRef.current.srcObject = opened
        await videoRef.current.play()
        setReady(true)
        timer = setInterval(() => {
          const video = videoRef.current
          if (!video) return
          detector
            .detect(video)
            .then((codes) => {
              if (active && codes[0]?.rawValue) {
                active = false
                onDetected(codes[0].rawValue)
              }
            })
            .catch(() => {
              // Image illisible : la lecture suivante réessaie.
            })
        }, SCAN_INTERVAL_MS)
      })
      .catch(() => {
        if (active) onUnavailable()
      })

    return () => {
      active = false
      if (timer) clearInterval(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [onDetected, onUnavailable])

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-ink">
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="Caméra"
        className="size-full object-cover"
      />
      {/* Cadre de visée. */}
      <div aria-hidden="true" className="absolute inset-10 rounded-2xl border-4 border-white/80" />
      {!ready && (
        <p
          role="status"
          className="absolute inset-0 flex items-center justify-center text-sm text-white"
        >
          Ouverture de la caméra…
        </p>
      )}
    </div>
  )
}
