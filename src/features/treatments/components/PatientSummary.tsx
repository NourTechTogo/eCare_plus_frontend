import {Link} from 'react-router'
import {apiRequest} from '@/lib/apiClient'
import {useAsyncData} from '@/hooks/useAsyncData'
import {Card} from '@/components/ui/Card'
import type {Observance} from '../services/treatmentService'
interface Summary {observance:Observance;alertesOuvertes:{content:{id:string;titre:string;gravite:string}[];totalElements:number};dernieresMesures:{totalElements:number};conversations:{id:string}[]}
export function PatientSummary({patientId}:{patientId:string}){
  const state=useAsyncData(`patient-summary:${patientId}`,()=>apiRequest<Summary>(`/portail/patients/${patientId}/resume`))
  return <Card title="Résumé du télésuivi">{state.status==='loading'&&<p>Chargement…</p>}{state.status==='error'&&<p role="alert">{state.error}</p>}{state.status==='success'&&<div className="flex flex-col gap-3"><p>{state.data.alertesOuvertes.totalElements} alerte(s) ouverte(s) · {state.data.dernieresMesures.totalElements} mesure(s)</p><p>Observance sur 30 jours : {state.data.observance.taux==null?'non calculable':`${state.data.observance.taux.toFixed(0)} %`}</p><ul>{state.data.alertesOuvertes.content.map(a=><li key={a.id}><Link className="underline" to={`/alertes/${a.id}`}>{a.gravite} · {a.titre}</Link></li>)}</ul></div>}</Card>
}
