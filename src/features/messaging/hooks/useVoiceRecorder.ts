import { useCallback, useEffect, useRef, useState } from 'react'
import { encodeVoiceWav, VoiceCaptureLifetime, VOICE_MAX_SECONDS, VOICE_SAMPLE_RATE } from '../voiceWav'
export { VOICE_MAX_SECONDS } from '../voiceWav'

export type VoiceRecorder = { status: 'idle' | 'starting' } |
  { status: 'recording'; elapsed: number } |
  { status: 'recorded'; recording: Blob; url: string; durationSeconds: number; source: string } |
  { status: 'error'; reason: 'denied' | 'unavailable' | 'short' }

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorder>({ status: 'idle' })
  const lifetime = useRef(new VoiceCaptureLifetime())
  const draftUrl = useRef<string | undefined>(undefined)
  const finish = useRef<(() => void) | undefined>(undefined)
  const active = useRef(false)
  const reset = useCallback(() => {
    active.current = false
    lifetime.current.cancel(); finish.current = undefined
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current)
    draftUrl.current = undefined
    setState({ status: 'idle' })
  }, [])
  const start = useCallback(async () => {
    if (active.current) return
    reset(); active.current = true
    const revision = lifetime.current.begin()
    setState({ status: 'starting' })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      if (!lifetime.current.current(revision)) { stream.getTracks().forEach(track => track.stop()); return }
      let context: AudioContext | undefined
      let processor: ScriptProcessorNode | undefined
      let source: MediaStreamAudioSourceNode | undefined
      let timer: ReturnType<typeof setInterval> | undefined
      lifetime.current.attach(revision, () => {
        if (timer) clearInterval(timer)
        if (processor) { processor.onaudioprocess = null; processor.disconnect() }
        source?.disconnect(); stream.getTracks().forEach(track => track.stop())
        if (context && context.state !== 'closed') void context.close().catch(() => {})
      })
      context = new AudioContext()
      await context.resume()
      if (!lifetime.current.current(revision)) return
      source = context.createMediaStreamSource(stream)
      processor = context.createScriptProcessor(4096, 1, 1)
      const chunks: Float32Array[] = []
      const rate = context.sampleRate
      let count = 0
      const stop = () => {
        if (!lifetime.current.current(revision)) return
        lifetime.current.cancel(); active.current = false; finish.current = undefined
        const samples = new Float32Array(count)
        let offset = 0
        chunks.forEach(chunk => { samples.set(chunk, offset); offset += chunk.length })
        try {
          const recording = encodeVoiceWav(samples, rate)
          const url = URL.createObjectURL(recording); draftUrl.current = url
          setState({ status: 'recorded', recording, url, durationSeconds: (recording.size - 44) / (VOICE_SAMPLE_RATE * 2), source: crypto.randomUUID() })
        } catch { setState({ status: 'error', reason: 'short' }) }
      }
      finish.current = stop
      processor.onaudioprocess = event => {
        if (!lifetime.current.current(revision)) return
        const chunk = event.inputBuffer.getChannelData(0).slice(0, Math.max(0, VOICE_MAX_SECONDS * rate - count))
        chunks.push(chunk); count += chunk.length
        if (count >= VOICE_MAX_SECONDS * rate) stop()
      }
      source.connect(processor); processor.connect(context.destination)
      const started = Date.now()
      timer = setInterval(() => {
        if (!lifetime.current.current(revision)) return
        const elapsed = Math.floor((Date.now() - started) / 1000)
        if (elapsed >= VOICE_MAX_SECONDS) stop()
        else setState({ status: 'recording', elapsed })
      }, 200)
      setState({ status: 'recording', elapsed: 0 })
    } catch (error) {
      if (!lifetime.current.current(revision)) return
      lifetime.current.cancel(); active.current = false
      setState({ status: 'error', reason: error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unavailable' })
    }
  }, [reset])
  useEffect(() => () => {
    lifetime.current.cancel()
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current)
  }, [])
  return { state, start, stop: () => finish.current?.(), reset }
}
