export const VOICE_MAX_SECONDS = 120
export const VOICE_SAMPLE_RATE = 16000

/** Mono PCM16 WAV, resampled from the AudioContext's actual rate. */
export function encodeVoiceWav(samples: Float32Array, inputRate: number): Blob {
  if (!Number.isFinite(inputRate) || inputRate < 8000 || inputRate > 192000) throw new Error('Fréquence audio invalide.')
  const length = Math.min(VOICE_MAX_SECONDS * VOICE_SAMPLE_RATE, Math.floor(samples.length * VOICE_SAMPLE_RATE / inputRate))
  if (length < VOICE_SAMPLE_RATE / 4) throw new Error('Enregistrement trop court.')
  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)
  const ascii = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)) }
  ascii(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, VOICE_SAMPLE_RATE, true); view.setUint32(28, VOICE_SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, length * 2, true)
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * inputRate / VOICE_SAMPLE_RATE)
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((i + 1) * inputRate / VOICE_SAMPLE_RATE)))
    let sum = 0
    for (let j = start; j < end; j++) sum += samples[j]
    const value = Math.max(-1, Math.min(1, sum / (end - start)))
    view.setInt16(44 + i * 2, value < 0 ? value * 32768 : value * 32767, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

/** Invalidates delayed permission requests as well as active resources. */
export class VoiceCaptureLifetime {
  private revision = 0
  private cleanup?: () => void
  begin() { this.cancel(); return this.revision }
  current(revision: number) { return revision === this.revision }
  attach(revision: number, cleanup: () => void) {
    if (!this.current(revision)) { cleanup(); return false }
    this.cleanup = cleanup
    return true
  }
  cancel() { this.revision++; const cleanup = this.cleanup; this.cleanup = undefined; cleanup?.() }
}
