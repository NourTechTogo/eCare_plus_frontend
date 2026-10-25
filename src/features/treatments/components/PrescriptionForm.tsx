import {controlClassName} from '@/components/ui/styles'
import {useRef,useState,type FormEvent} from 'react'
import {Card} from '@/components/ui/Card'
import {Button} from '@/components/ui/Button'
import {createPrescription,type PrescriptionCommand} from '../services/treatmentService'
import {ApiError} from '@/lib/apiClient'
export function PrescriptionForm({patientId,onSaved}:{patientId:string;onSaved:()=>void}){
  const pending=useRef<PrescriptionCommand|undefined>(undefined)
  const [locked,setLocked]=useState(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false)
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget),v=(key:string)=>String(form.get(key)??'').trim();setBusy(true);setError('')
    try{
      if(!pending.current)pending.current={sourceRef:crypto.randomUUID(),traitement:{libelle:v('libelle'),dateDebut:v('dateDebut'),...(v('dateFin')?{dateFin:v('dateFin')}:{}),consignesGenerales:v('consignes')},medicament:{nomCommercial:v('nom'),denomination:v('denomination'),forme:v('forme'),dosage:v('dosage'),uniteDosage:v('uniteDosage')},prise:{quantite:Number(v('quantite')),unite:v('unite'),heurePrevue:v('heure'),voieAdministration:v('voie'),fuseau:v('fuseau'),joursSemaine:[1,2,3,4,5,6,7]}}
      setLocked(true)
      await createPrescription(patientId,pending.current);pending.current=undefined;setDone(true);onSaved()
    }catch(e){
      if(e instanceof ApiError&&[400,422].includes(e.status)){pending.current=undefined;setLocked(false)}
      setError(e instanceof Error?e.message:'Prescription non confirmée. Réessayez avec les mêmes informations.')
    }finally{setBusy(false)}
  }
  if(done)return <Card title="Prescription enregistrée"><p>Consultez le planning au jour de démarrage.</p><Button onClick={()=>{setDone(false);setLocked(false);pending.current=undefined}}>Nouvelle prescription</Button></Card>
  const field=(name:string,label:string,type='text',value?:string)=><label key={name} className="flex min-w-0 flex-col gap-2 text-sm font-medium">{label}<input name={name} type={type} required={!['dateFin','consignes'].includes(name)} defaultValue={value} className={controlClassName(false)} step={type==='number'?'any':undefined} min={type==='number'?'0.001':undefined}/></label>
  return <Card title="Prescription médicale"><form onSubmit={e=>void submit(e)} className="flex min-w-0 flex-col gap-6">
    <p className="max-w-3xl text-sm leading-relaxed text-muted">Renseignez la prescription et son horaire quotidien. Les jours de prise pourront ensuite être ajustés dans le planning.</p>
    {error&&<p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">{error}</p>}{locked&&<p className="rounded-2xl bg-primary-soft p-4 text-sm text-primary-strong">Enregistrement non confirmé : le réessai conserve exactement la même prescription pour éviter les doublons.</p>}
    <fieldset disabled={busy||locked} className="min-w-0 rounded-2xl border border-line p-4 sm:p-5"><legend className="px-2 font-display text-sm font-bold text-primary-strong">Traitement</legend><div className="grid min-w-0 gap-4 sm:grid-cols-2">{field('libelle','Libellé du traitement')}{field('consignes','Consignes générales')}{field('dateDebut','Date de début','date')}{field('dateFin','Date de fin facultative','date')}</div></fieldset>
    <fieldset disabled={busy||locked} className="min-w-0 rounded-2xl border border-line p-4 sm:p-5"><legend className="px-2 font-display text-sm font-bold text-primary-strong">Médicament prescrit</legend><div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">{field('nom','Nom commercial')}{field('denomination','Dénomination')}{field('forme','Forme')}{field('dosage','Dosage')}{field('uniteDosage','Unité du dosage')}</div></fieldset>
    <fieldset disabled={busy||locked} className="min-w-0 rounded-2xl border border-line p-4 sm:p-5"><legend className="px-2 font-display text-sm font-bold text-primary-strong">Organisation des prises</legend><div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">{field('quantite','Quantité par prise','number')}{field('unite','Unité par prise')}{field('heure','Heure prévue','time')}{field('voie','Voie d’administration')}{field('fuseau','Fuseau IANA','text','Africa/Lome')}</div></fieldset>
    <div className="flex justify-end border-t border-line pt-5"><Button type="submit" disabled={busy} loading={busy}>{locked?'Réessayer l’enregistrement':'Enregistrer la prescription'}</Button></div>
  </form></Card>
}
