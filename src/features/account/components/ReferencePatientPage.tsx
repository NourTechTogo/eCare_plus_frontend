import {controlClassName} from '@/components/ui/styles'
import {useState,type FormEvent} from 'react'
import {useNavigate} from 'react-router'
import {Page} from '@/components/layouts/Page'
import {Card} from '@/components/ui/Card'
import {Button} from '@/components/ui/Button'
import {useAsyncData} from '@/hooks/useAsyncData'
import {listProfessionals} from '@/features/patients/services/patientService'
import {resolveReference,consumeReference,type ReferenceResolution} from '../services/accountService'
export function ReferencePatientPage(){
  const navigate=useNavigate(),pros=useAsyncData('reference-professionals',listProfessionals)
  const [token,setToken]=useState(''),[resolved,setResolved]=useState<ReferenceResolution>(),[professional,setProfessional]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function resolve(e:FormEvent){e.preventDefault();setResolved(undefined);setBusy(true);setError('');try{setResolved(await resolveReference(token.trim()))}catch(e){setError(e instanceof Error?e.message:'Code refusé.')}finally{setBusy(false)}}
  async function confirm(){if(!resolved||!professional||busy)return;setBusy(true);setError('');try{const patient=await consumeReference(token.trim(),professional,resolved.versionDossier);navigate(`/patients/${patient.id}`)}catch(e){setError(e instanceof Error?e.message:'Rattachement refusé.')}finally{setBusy(false)}}
  return <Page title="Référencer un patient" backLink={{to:'/patients',label:'Retour aux patients'}}><Card><div className="flex flex-col gap-4"><p>Demandez au patient son code temporaire dans son application. Vérifiez son identité avant confirmation. Ce rattachement ne remplace pas son consentement.</p>{error&&<p role="alert">{error}</p>}<form onSubmit={e=>void resolve(e)} className="flex flex-col gap-3"><label>Code temporaire<input className={controlClassName(false)} autoComplete="off" required maxLength={128} value={token} disabled={busy} onChange={e=>{setToken(e.target.value);setResolved(undefined)}}/></label><Button type="submit" disabled={busy}>Vérifier le code</Button></form>{resolved&&<><p><strong>{resolved.prenoms} {resolved.nom}</strong> · {resolved.dateNaissance??'Date de naissance non renseignée'}</p><p>{resolved.dossierId?'Dossier existant dans votre structure':'Nouveau dossier pour ce compte'}</p>{pros.status==='error'&&<p role="alert">{pros.error}</p>}<label>Médecin référent<select className={controlClassName(false)} value={professional} disabled={busy} onChange={e=>setProfessional(e.target.value)}><option value="">Sélectionner</option>{pros.status==='success'&&pros.data.map(p=><option key={p.id} value={p.id}>{p.prenoms} {p.nom}</option>)}</select></label><Button disabled={busy||!professional} onClick={()=>void confirm()}>Confirmer le rattachement</Button></>}</div></Card></Page>
}
