const VOICE_SELECTION_EVENT = 'ecare:voice-selected'
let selectedVoiceOwner: object | undefined

/** A user's selection supersedes other downloads without discarding recorder drafts. */
export function selectVoicePlayback(owner: object) {
  selectedVoiceOwner = owner
  window.dispatchEvent(new CustomEvent(VOICE_SELECTION_EVENT, { detail: owner }))
}

export function onOtherVoiceSelection(owner: object, cancel: () => void) {
  const listener = (event: Event) => {
    if ((event as CustomEvent<object>).detail !== owner) cancel()
  }
  window.addEventListener(VOICE_SELECTION_EVENT, listener)
  return () => window.removeEventListener(VOICE_SELECTION_EVENT, listener)
}

/** Each effect setup owns its source, including React StrictMode effect replay. */
export function activateVoicePlayback(audio: HTMLAudioElement, url: string, autoPlay: boolean, onBlocked: () => void, owner: object = audio) {
  let active = true
  audio.src = url
  const pauseOthers = () => {
    if (selectedVoiceOwner && selectedVoiceOwner !== owner) { audio.pause(); return }
    selectVoicePlayback(owner)
    document.querySelectorAll<HTMLAudioElement>('audio[data-ecare-voice]').forEach(other => {
      if (other !== audio) other.pause()
    })
  }
  const stop = () => audio.pause()
  const stopSelection = onOtherVoiceSelection(owner, stop)
  audio.addEventListener('play', pauseOthers)
  window.addEventListener('ecare:stop-voice', stop)
  if (autoPlay && (!selectedVoiceOwner || selectedVoiceOwner === owner)) void audio.play().catch(() => { if (active) onBlocked() })
  return () => {
    active = false
    stopSelection()
    audio.removeEventListener('play', pauseOthers)
    window.removeEventListener('ecare:stop-voice', stop)
    audio.pause(); audio.removeAttribute('src'); audio.load()
  }
}

/** No network or blob allocation until load() is requested by a user. */
export class LazyVoiceAudio {
  private revision = 0
  private url = ''
  private pending?: Promise<string>
  private readonly fetchBlob: () => Promise<Blob>
  constructor(fetchBlob: () => Promise<Blob>) { this.fetchBlob = fetchBlob }
  load(): Promise<string> {
    if (this.url) return Promise.resolve(this.url)
    if (this.pending) return this.pending
    const revision = this.revision
    const pending = this.fetchBlob().then(blob => {
      if (revision !== this.revision) throw new Error('Lecture annulée.')
      this.url = URL.createObjectURL(blob)
      return this.url
    }).finally(() => { if (this.pending === pending) this.pending = undefined })
    this.pending = pending
    return pending
  }
  cancelPending() {
    this.revision++
    this.pending = undefined
  }
  reset() {
    this.cancelPending()
    if (this.url) URL.revokeObjectURL(this.url)
    this.url = ''
  }
}
