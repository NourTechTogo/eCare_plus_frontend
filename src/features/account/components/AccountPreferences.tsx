import {useState} from 'react'
import {Card} from '@/components/ui/Card'
import {Button} from '@/components/ui/Button'
import {useAsyncData} from '@/hooks/useAsyncData'
import {getPreferences,savePreferences,requestErasure} from '../services/accountService'
export function AccountPreferences(){
  const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[information,setInformation]=useState('')
  const state=useAsyncData(`preferences:${revision}`,getPreferences)
  async function save(push:boolean,whatsapp:boolean){setBusy(true);setError('');try{await savePreferences(push,whatsapp);setRevision(v=>v+1)}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible.')}finally{setBusy(false)}}
  async function erase(){if(!window.confirm('Enregistrer une demande d’effacement ? La suppression n’est pas immédiate et dépend des obligations de conservation.'))return;setBusy(true);try{const r=await requestErasure();setInformation(`Demande ${r.id} : ${r.statut}. ${r.information}`)}catch(e){setError(e instanceof Error?e.message:'Demande refusée.')}finally{setBusy(false)}}
  return <Card title="Notifications et données"><div className="flex flex-col gap-3">{state.status==='loading'&&<p>Chargement…</p>}{state.status==='error'&&<p role="alert">{state.error}</p>}{error&&<p role="alert">{error}</p>}{state.status==='success'&&<><label className="flex items-start gap-3 text-sm text-ink"><input className="mt-0.5 size-4 shrink-0 accent-primary" type="checkbox" disabled={busy} checked={state.data.pushActif} onChange={e=>void save(e.target.checked,state.data.whatsappActif)}/> Recevoir les notifications push</label><label className="flex items-start gap-3 text-sm text-ink"><input className="mt-0.5 size-4 shrink-0 accent-primary" type="checkbox" disabled={busy} checked={state.data.whatsappActif} onChange={e=>void save(state.data.pushActif,e.target.checked)}/> J’accepte les notifications génériques sur WhatsApp</label><p className="text-sm text-muted">La réception exige un service configuré et, pour le push, un appareil enregistré.</p></>}{information&&<p role="status">{information}</p>}<Button variant="secondary" disabled={busy} onClick={()=>void erase()}>Demander l’effacement de mes données</Button></div></Card>
}
