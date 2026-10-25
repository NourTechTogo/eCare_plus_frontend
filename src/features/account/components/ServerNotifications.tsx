import {useState} from 'react'
import {useNavigate} from 'react-router'
import {useAsyncData} from '@/hooks/useAsyncData'
import {notifications,readNotification,type NotificationDto} from '../services/accountService'
import {notificationDestination} from '../services/notificationNavigation'
import {Button} from '@/components/ui/Button'
export function ServerNotifications(){
  const navigate=useNavigate()
  const [revision,setRevision]=useState(0),[error,setError]=useState('')
  const state=useAsyncData(`common-notifications:${revision}`,notifications,5000)
  async function mark(id:string){try{await readNotification(id);setRevision(v=>v+1)}catch(e){setError(e instanceof Error?e.message:'Lecture non enregistrée.')}}
  async function open(n:NotificationDto){try{const to=await notificationDestination(n);await readNotification(n.id);setRevision(v=>v+1);navigate(to)}catch(e){setError(e instanceof Error?e.message:'Ressource indisponible.')}}
  return <details className="relative"><summary className="w-fit cursor-pointer rounded-full border border-line px-3 py-2 text-sm">Notifications {state.status==='success'?`(${state.data.content.filter(n=>!n.dateLecture).length})`:''}</summary><div className="absolute left-0 z-40 mt-2 max-h-[min(24rem,40dvh)] w-[min(20rem,calc(100vw-2rem))] overflow-auto sm:right-0 sm:left-auto rounded-2xl border border-line bg-surface p-4 shadow-xl">{error&&<p role="alert">{error}</p>}{state.status==='loading'&&<p>Chargement…</p>}{state.status==='error'&&<p role="alert">{state.error}</p>}{state.status==='success'&&(!state.data.content.length?<p>Aucune notification.</p>:<ul className="divide-y divide-line">{state.data.content.map(n=><li key={n.id} className="py-3 [overflow-wrap:anywhere]"><button className="text-left font-semibold" type="button" onClick={()=>void open(n)}>{n.titre}</button><p className="text-sm">{n.message}</p>{n.dateLecture?<span className="text-xs">Lu</span>:<Button size="sm" variant="soft" onClick={()=>void mark(n.id)}>Marquer lu</Button>}</li>)}</ul>)}</div></details>
}
