import { useEffect, useRef, useState } from 'react'
import { loadVoicePiece, type PieceDto } from '../services/messagingService'
import { LazyVoiceAudio, onOtherVoiceSelection, selectVoicePlayback } from '../voicePlayback'
import { formatTimer } from '../format'
import { VoiceNotePlayer } from './VoiceNotePlayer'

export function PrivateVoiceNote({conversation,piece,onPrimary}:{conversation:string;piece:PieceDto;onPrimary:boolean}) {
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const [resource]=useState(()=>new LazyVoiceAudio(()=>loadVoicePiece(conversation,{id:piece.id})))
 const mounted=useRef(false)
 const intent=useRef(0)
 useEffect(()=>{
  mounted.current=true
  const cancel=()=>{intent.current++;resource.cancelPending();setLoading(false)}
  const stopSelection=onOtherVoiceSelection(resource,cancel)
  window.addEventListener('ecare:stop-voice',cancel)
  return()=>{mounted.current=false;stopSelection();window.removeEventListener('ecare:stop-voice',cancel);resource.reset()}
 },[resource])
 async function load(){
  if(loading)return
  selectVoicePlayback(resource)
  setLoading(true);setError('')
  const request=++intent.current
  try{const source=await resource.load();if(mounted.current&&request===intent.current)setUrl(source)}
  catch{if(mounted.current&&request===intent.current)setError('Lecture du message vocal impossible. Réessayez.')}
  finally{if(mounted.current&&request===intent.current)setLoading(false)}
 }
 const duration=(piece.dureeMs??0)/1000
 return <div className="mt-2 space-y-1"><p className="text-xs">Message vocal</p>
  {url?<VoiceNotePlayer url={url} durationSeconds={duration} onPrimary={onPrimary} selectionOwner={resource} autoPlay/>:<div className="flex w-64 max-w-full items-center gap-3">
   <button type="button" disabled={loading} aria-label={error?'Réessayer la lecture du message vocal':'Écouter le message vocal'} onClick={()=>void load()}
    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${onPrimary?'bg-surface text-primary-strong focus-visible:outline-white':'bg-primary text-white hover:bg-primary-strong focus-visible:outline-primary'}`}>
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z"/></svg>
   </button>
   <span className="flex-1 text-xs" role={loading?'status':undefined}>{loading?'Chargement…':error?'Réessayer':'Écouter'}</span>
   <span className="text-xs tabular-nums">{duration?formatTimer(Math.round(duration)):'--:--'}</span>
  </div>}
  {error&&<p role="alert" className="text-xs">{error}</p>}
 </div>
}
