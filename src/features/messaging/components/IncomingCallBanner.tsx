import {Link} from 'react-router'
import {useState} from 'react'
import {useAuth} from '@/features/auth'
import {useAsyncData} from '@/hooks/useAsyncData'
import {listConversations} from '../services/messagingService'
import {callHistory} from '../services/callApi'
export function IncomingCallBanner(){
  const {user}=useAuth()
  const [minimized,setMinimized]=useState<string[]>([])
  const state=useAsyncData('incoming-calls',async()=>{const conversations=await listConversations();const rows=await Promise.all(conversations.map(async c=>({conversation:c,calls:(await callHistory(c.id)).content})));return rows.flatMap(({conversation,calls})=>calls.filter(c=>c.statut==='EN_ATTENTE'&&c.destinataireId===user?.id).map(call=>({call,conversation})))},5000)
  if(state.status!=='success'||state.refreshError||!state.data.length)return null
  const collapsed=state.data.every(({call})=>minimized.includes(call.id))
  return <aside className="fixed right-4 bottom-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4 text-sm shadow-xl" aria-live="polite">
    <div className="flex items-center justify-between gap-3"><p className="font-semibold text-primary-strong">Appel entrant{state.data.length>1?` (${state.data.length})`:''}</p><button type="button" aria-label={collapsed?'Développer l’avis d’appel':'Réduire l’avis d’appel'} onClick={()=>setMinimized(collapsed?[]:state.data.map(({call})=>call.id))} className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-page focus-visible:outline-2 focus-visible:outline-primary"><span aria-hidden="true">{collapsed?'+':'−'}</span></button></div>
    {!collapsed&&<div className="mt-2 max-h-[35dvh] overflow-y-auto"><ul className="flex flex-col gap-3">{state.data.map(({call,conversation})=><li key={call.id} className="min-w-0"><p className="[overflow-wrap:anywhere]">{call.type==='VIDEO'?'Vidéo':'Audio'} · <strong>{conversation.patientName}</strong></p><Link className="mt-2 inline-flex min-h-10 items-center rounded-full bg-primary-soft px-4 py-2 font-semibold text-primary-strong focus-visible:outline-2 focus-visible:outline-primary" to={`/messagerie/${conversation.id}`}>Ouvrir pour accepter ou refuser</Link></li>)}</ul></div>}
  </aside>
}
