import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {useAuth} from '@/features/auth'
import {useAsyncData} from '@/hooks/useAsyncData'
import {activeCall,callAction,callHistory,createCall,type ServerCall} from '../services/callApi'
import {audioCallIconPath,videoCallIconPath} from '../callIcons'
import {ServerCallScreen} from './ServerCallScreen'
import type {LiveCallControls} from './LiveCallRoom'
import {TargetNotes} from '@/features/targeted-notes/components/TargetNotes'
const LiveCallRoom=lazy(()=>import('./LiveCallRoom').then(module=>({default:module.LiveCallRoom})))

export function ServerCallPanel({conversation,name,onHistoryLoaded}:{conversation:string;name:string;onHistoryLoaded?:(rows:ServerCall[])=>void}){
 const {user}=useAuth()
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [opened,setOpened]=useState(false),[selectedType,setSelectedType]=useState<'AUDIO'|'VIDEO'>('AUDIO')
 const [mediaStopped,setMediaStopped]=useState<string>()
 const source=useRef<{type:'AUDIO'|'VIDEO';key:string}|undefined>(undefined)
 const state=useAsyncData(`calls:${conversation}:${revision}`,()=>callHistory(conversation),2000)
 const history=state.status==='success'?state.data.content:undefined
 const active=history?.find(activeCall)
 useEffect(()=>{if(history)onHistoryLoaded?.(history)},[history,onHistoryLoaded])
 async function start(type:'AUDIO'|'VIDEO'){
  if(busy||active)return
  setBusy(true);setError('');setSelectedType(type);setOpened(true)
  if(source.current?.type!==type)source.current={type,key:crypto.randomUUID()}
  try{await createCall(conversation,type,source.current.key);source.current=undefined;setRevision(value=>value+1)}
  catch(problem){setError(problem instanceof Error?problem.message:'Appel indisponible.')}
  finally{setBusy(false)}
 }
 async function action(call:ServerCall,command:'acceptation'|'refus'|'fin'){
  if(busy)return
  setBusy(true);setError('')
  if(command==='fin'){setOpened(true);setMediaStopped(call.id)}
  try{await callAction(call.id,command);setRevision(value=>value+1);if(command!=='acceptation')setOpened(false)}
  catch(problem){setError(problem instanceof Error?problem.message:'Action refusée.')}
  finally{setBusy(false)}
 }
 function renderScreen(media?:LiveCallControls){
  const status=active?.statut==='EN_ATTENTE'?'Sonnerie…':active?.statut==='ACCEPTE'?'Appel accepté':busy?'Connexion…':'Appel indisponible'
  return <ServerCallScreen name={name} type={active?.type??selectedType} status={mediaStopped===active?.id&&active?'Média local arrêté, fermeture à confirmer':status}
   error={error} busy={busy} incoming={active?.statut==='EN_ATTENTE'&&active.destinataireId===user?.id} media={media}
   onAccept={()=>{if(active)void action(active,'acceptation')}} onRefuse={()=>{if(active)void action(active,'refus')}}
   onEnd={()=>{if(active)void action(active,'fin');else setOpened(false)}} onRetry={!active?()=>void start(selectedType):undefined}/>
 }
 return <>
  <div className="flex shrink-0 items-center gap-1">
   {(['AUDIO','VIDEO'] as const).map(type=><button key={type} type="button" title={type==='VIDEO'?'Lancer un appel vidéo':'Lancer un appel audio'}
    aria-label={type==='VIDEO'?'Lancer un appel vidéo':'Lancer un appel audio'} disabled={busy||state.status!=='success'}
    onClick={()=>{if(active)setOpened(true);else void start(type)}}
    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-primary-strong hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={type==='VIDEO'?videoCallIconPath:audioCallIconPath}/></svg></button>)}
  </div>
  {state.status==='error'&&<span role="alert" className="text-xs text-danger">Appels indisponibles</span>}
  {!onHistoryLoaded&&history&&<details className="text-sm"><summary className="cursor-pointer text-primary-strong">Historique des appels</summary>
   {history.filter(call=>!activeCall(call)).map(call=><div key={call.id} className="rounded-2xl bg-page p-3">{call.type==='VIDEO'?'Vidéo':'Audio'} · {call.statut}<TargetNotes type="APPEL" id={call.id}/></div>)}</details>}
  {(opened||(!!active&&active.id!==mediaStopped))&&(active?.statut==='ACCEPTE'&&active.id!==mediaStopped?<Suspense fallback={<p role="status">Chargement du média…</p>}><LiveCallRoom key={active.id} call={active}>{renderScreen()}</LiveCallRoom></Suspense>:renderScreen())}
 </>
}
