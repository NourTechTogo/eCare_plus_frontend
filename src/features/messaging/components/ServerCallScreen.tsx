import {useContext,useEffect,useId,useRef} from 'react'
import {Button} from '@/components/ui/Button'
import {ControlButton} from './CallScreen'
import {getInitials} from '../format'
import {cameraOffIconPath,hangUpIconPath,micIconPath,micOffIconPath,videoCallIconPath} from '../callIcons'
import type {LiveCallControls} from './LiveCallRoom'
import {CallMediaContext} from './CallMediaContext'

interface Props {
 name:string;type:'AUDIO'|'VIDEO';status:string;error?:string;busy:boolean;
 incoming:boolean;media?:LiveCallControls;
 onAccept:()=>void;onRefuse:()=>void;onEnd:()=>void;onRetry?:()=>void
}
/** The original full-screen call layout, driven exclusively by API/SDK state. */
export function ServerCallScreen({name,type,status,error,busy,incoming,media:suppliedMedia,onAccept,onRefuse,onEnd,onRetry}:Props){
 const contextMedia=useContext(CallMediaContext)
 const media=suppliedMedia??contextMedia??undefined
 const ref=useRef<HTMLDialogElement>(null),title=useId()
 useEffect(()=>{ref.current?.showModal()},[])
 return <dialog ref={ref} aria-labelledby={title} onCancel={event=>event.preventDefault()}
  className="m-0 h-dvh max-h-none w-full max-w-none bg-ink text-white backdrop:bg-ink">
  <div className="relative flex min-h-full flex-col items-center justify-between gap-8 overflow-y-auto px-4 py-10 sm:px-8">
   {media?.media}
   <p className="relative z-10 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold tracking-wide uppercase">{type==='VIDEO'?'Appel vidéo':'Appel audio'}</p>
   <div className="relative z-10 my-auto flex flex-col items-center gap-6 text-center">
    <span aria-hidden="true" className="inline-flex size-32 items-center justify-center rounded-full bg-primary-strong font-display text-4xl font-bold">{getInitials(name)}</span>
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-ink/70 p-4">
     <h2 id={title} className="font-display text-2xl font-bold">{name}</h2>
     <p role="status" className="text-base text-white/80">{media?.connected?(media.remoteCount?'En communication':'Connecté, en attente de l’interlocuteur'):status}</p>
     {(error||media?.error)&&<p role="alert" className="max-w-sm text-sm text-white/80">{error||media?.error}</p>}
     {incoming&&<div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={onAccept}>Accepter</Button><Button variant="secondary" disabled={busy} onClick={onRefuse}>Refuser</Button></div>}
     {media&&!media.connected&&<Button disabled={media.busy||busy} onClick={()=>void media.join()}>{type==='VIDEO'?'Rejoindre avec le micro et la caméra':'Rejoindre avec le microphone'}</Button>}
     {media?.connected&&<button type="button" className="text-sm text-white underline" onClick={media.startAudio}>Activer le son reçu</button>}
     {onRetry&&<Button disabled={busy} onClick={onRetry}>Réessayer l’appel</Button>}
    </div>
   </div>
   <div className="relative z-10 flex flex-col items-center gap-4">
    <div className="flex flex-wrap items-center justify-center gap-4">
     <ControlButton label={media?.muted?'Activer le micro':'Couper le micro'} iconPath={media?.muted?micOffIconPath:micIconPath} pressed={media?.muted} disabled={!media?.connected||busy} onClick={()=>void media?.toggle('micro')}/>
     {type==='VIDEO'&&<ControlButton label={media?.camera?'Couper la caméra':'Activer la caméra'} iconPath={media?.camera?videoCallIconPath:cameraOffIconPath} pressed={!media?.camera} disabled={!media?.connected||busy} onClick={()=>void media?.toggle('camera')}/>}
     <ControlButton label="Raccrocher" iconPath={hangUpIconPath} danger disabled={busy} onClick={onEnd}/>
    </div>
    <p className="text-xs text-white/70">Les appels ne remplacent pas les services d’urgence.</p>
   </div>
  </div>
 </dialog>
}
