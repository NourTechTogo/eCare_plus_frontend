import {controlClassName} from '@/components/ui/styles'
import {useState,type FormEvent} from 'react'
import {Card} from '@/components/ui/Card'
import {Button} from '@/components/ui/Button'
import {useAsyncData} from '@/hooks/useAsyncData'
import {configurePlanning,getPlanning,getObservance,type DosePlanning} from '../services/treatmentService'
import {PrescriptionForm} from './PrescriptionForm'
const civil=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
function DoseEditor({dose,onSaved}:{dose:DosePlanning;onSaved:()=>void}){
  const [zone,setZone]=useState(dose.fuseau),[days,setDays]=useState(dose.joursSemaine),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await configurePlanning(dose.id,dose.version,zone,days);onSaved()}catch(e){setError(e instanceof Error?e.message:'Configuration refusée.')}finally{setBusy(false)}}
  return <form onSubmit={e=>void submit(e)} className="mt-4 rounded-2xl bg-page p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-primary-strong">Prise de {dose.heurePrevue.slice(0,5)}</h4><span className="text-xs text-muted">{dose.configurationRequise?'Horaires à préciser':dose.frequence==='QUOTIDIEN'?'Chaque jour':dose.frequence}</span></div>
    <fieldset disabled={busy} className="grid min-w-0 gap-4 xl:grid-cols-[minmax(160px,1fr)_minmax(0,2fr)]">
      <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Fuseau<input className={controlClassName(false)} value={zone} required onChange={e=>setZone(e.target.value)}/></label>
      <fieldset className="min-w-0"><legend className="mb-2 text-sm font-medium">Jours de prise</legend><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((label,i)=><label key={label} className="cursor-pointer"><input className="peer sr-only" type="checkbox" checked={days.includes(i+1)} onChange={e=>setDays(e.target.checked?[...days,i+1]:days.filter(d=>d!==i+1))}/><span className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-2 py-2 text-xs font-semibold text-muted peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">{label}</span></label>)}</div></fieldset>
    </fieldset>
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">{error&&<p role="alert" className="mr-auto text-sm text-danger">{error}</p>}<Button loading={busy} disabled={busy||!days.length} type="submit">Enregistrer l’horaire</Button></div>
  </form>
}
export function PatientTreatments({patientId}:{patientId:string}){
  const [day,setDay]=useState(()=>civil(new Date())),[revision,setRevision]=useState(0)
  const from=new Date(`${day}T12:00:00`);from.setDate(from.getDate()-29)
  const state=useAsyncData(`treatments:${patientId}:${day}:${revision}`,async()=>{const [planning,observance]=await Promise.all([getPlanning(patientId,day,day),getObservance(patientId,civil(from),day)]);return {planning,observance}})
  return <div className="flex min-w-0 flex-col gap-6"><Card title="Traitements et observance" action={<div className="flex flex-wrap items-end gap-3"><label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">Jour consulté<input className={controlClassName(false)} type="date" value={day} required onChange={e=>{if(e.target.value)setDay(e.target.value)}}/></label><Button variant="secondary" onClick={()=>setRevision(v=>v+1)}>Actualiser</Button></div>}>
    {state.status==='loading'&&<p role="status" className="rounded-2xl bg-page p-5 text-sm text-muted">Chargement du planning…</p>}{state.status==='error'&&<p role="alert" className="text-sm text-danger">{state.error}</p>}
    {state.status==='success'&&<div className="flex min-w-0 flex-col gap-6">
      <div className="rounded-2xl bg-primary-soft p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary-strong">Observance sur 30 jours</p><p className="mt-1 text-xs text-muted">{state.data.observance.prisesConfirmees} prise(s) confirmée(s) sur {state.data.observance.prisesPrevues} prévue(s)</p></div><strong className="font-display text-3xl text-primary-strong">{state.data.observance.taux===null?'—':`${state.data.observance.taux.toFixed(0)} %`}</strong></div>{state.data.observance.taux!==null&&<div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-primary" style={{width:`${Math.min(100,Math.max(0,state.data.observance.taux))}%`}}/></div>}</div>
      <div className="flex flex-col gap-4">{state.data.planning.traitements.map(t=><section key={t.id} className="min-w-0 rounded-2xl border border-line p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-display font-bold">{t.libelle}</h3><span className="rounded-full bg-page px-3 py-1 text-xs font-medium text-muted">{t.statut==='ACTIF'?'Actif':t.statut}</span></div>{t.consignes&&<p className="mt-2 text-sm leading-relaxed text-muted">{t.consignes}</p>}{t.prises.map(d=><DoseEditor key={`${d.id}:${d.version}`} dose={d} onSaved={()=>setRevision(v=>v+1)}/>)}</section>)}</div>
      <section><h3 className="mb-3 font-display text-base font-bold">Prises du jour</h3><ul className="grid min-w-0 gap-3 sm:grid-cols-2">{state.data.planning.occurrences.map(o=><li className="min-w-0 rounded-2xl border border-line bg-page p-4" key={o.id}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-primary-strong">{new Date(o.reporteeAu??o.prevueLe).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}</span><span className="rounded-full bg-surface px-3 py-1 text-xs text-muted">{o.annulee?'Annulée':o.statut==='PRISE'?'Prise confirmée':o.statut==='ATTENTE'?'À prendre':o.statut}</span></div><p className="mt-3 text-sm font-semibold wrap-anywhere">{o.medicament} {o.dosage} {o.uniteDosage}</p><p className="mt-1 text-xs text-muted">{o.quantite} {o.unite}</p></li>)}</ul>{!state.data.planning.occurrences.length&&<p className="rounded-2xl bg-page p-5 text-sm text-muted">Aucune prise prévue ce jour.</p>}</section>
    </div>}
  </Card><PrescriptionForm patientId={patientId} onSaved={()=>setRevision(v=>v+1)}/></div>
}
