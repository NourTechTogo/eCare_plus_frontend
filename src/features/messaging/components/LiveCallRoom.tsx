import {useEffect,useRef,useState,type ReactNode} from 'react'
import {Room,RoomEvent} from 'livekit-client'
import {Button} from '@/components/ui/Button'
import {callConnection,type ServerCall} from '../services/callApi'
import {CallMediaContext} from './CallMediaContext'
export type {LiveCallControls} from './CallMediaContext'
export function LiveCallRoom({call,children}:{call:ServerCall;children?:ReactNode}){
  const container=useRef<HTMLDivElement>(null),roomRef=useRef<Room|null>(null),alive=useRef(true)
  const [connected,setConnected]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[muted,setMuted]=useState(false),[camera,setCamera]=useState(false)
  const [remoteCount,setRemoteCount]=useState(0)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;void roomRef.current?.disconnect();roomRef.current=null}},[])
  async function join(){
    if(busy||roomRef.current)return;setBusy(true);setError('')
    const room=new Room({adaptiveStream:true,dynacast:true});roomRef.current=room
    const participants=()=>{if(alive.current)setRemoteCount(room.remoteParticipants.size)}
    room.on(RoomEvent.ParticipantConnected,participants).on(RoomEvent.ParticipantDisconnected,participants)
    room.on(RoomEvent.TrackSubscribed,(track)=>{const el=track.attach();el.className=track.kind==='video'?'h-full w-full object-cover':'hidden';container.current?.appendChild(el)})
    room.on(RoomEvent.TrackUnsubscribed,(track)=>{track.detach().forEach(el=>el.remove())})
    room.on(RoomEvent.Disconnected,()=>{if(alive.current){setConnected(false);setError('Média déconnecté. Vérifiez l’état de l’appel puis réessayez.')}roomRef.current=null;container.current?.replaceChildren()})
    try{
      const grant=await callConnection(call.id)
      if(!alive.current)return
      await room.connect(grant.url,grant.jeton)
      if(!alive.current){await room.disconnect();return}
      await room.localParticipant.setMicrophoneEnabled(true)
      if(!alive.current){await room.disconnect();return}
      if(call.type==='VIDEO'){
        try{await room.localParticipant.setCameraEnabled(true);if(alive.current)setCamera(true)}
        catch{if(alive.current)setError('Caméra indisponible : l’appel continue en audio. Vous pouvez réessayer.')}
      }
      if(!alive.current){await room.disconnect();return}
      setMuted(false)
      setConnected(true)
      participants()
    }catch(e){await room.disconnect();roomRef.current=null;if(alive.current)setError(e instanceof Error?e.message:'Connexion média impossible.')}
    finally{if(alive.current)setBusy(false)}
  }
  async function toggle(kind:'micro'|'camera'){
    const room=roomRef.current;if(!room)return
    try{if(kind==='micro'){await room.localParticipant.setMicrophoneEnabled(muted);setMuted(v=>!v)}else{await room.localParticipant.setCameraEnabled(!camera);setCamera(v=>!v)}}catch(e){setError(e instanceof Error?e.message:'Accès au périphérique refusé.')}
  }
  function startAudio(){void roomRef.current?.startAudio()}
  if(children)return <CallMediaContext value={{connected,busy,error,muted,camera,remoteCount,
    media:<div ref={container} className="absolute inset-0 [&_video]:absolute [&_video]:inset-0"/>,
    join,toggle,startAudio}}>{children}</CallMediaContext>
  return <div className="flex flex-col gap-2">{error&&<p role="alert">{error}</p>}<div ref={container}/>{!connected?<Button disabled={busy} onClick={()=>void join()}>Rejoindre avec le microphone</Button>:<><p role="status">Média connecté{remoteCount?' avec votre interlocuteur':' ; en attente de l’interlocuteur'}.</p><div className="flex flex-wrap gap-2"><Button variant="soft" onClick={()=>void toggle('micro')}>{muted?'Activer':'Couper'} le micro</Button>{call.type==='VIDEO'&&<Button variant="soft" onClick={()=>void toggle('camera')}>{camera?'Couper':'Activer'} la caméra</Button>}<Button variant="soft" onClick={()=>{void roomRef.current?.startAudio()}}>Activer le son reçu</Button></div></>}</div>
}
