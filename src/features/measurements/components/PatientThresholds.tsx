import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { listThresholds } from '@/features/measurements/services/measurementService'

const types:Record<string,string>={GLYCEMIE:'Glycémie',TENSION_ARTERIELLE:'Tension artérielle',POIDS:'Poids',FREQUENCE_CARDIAQUE:'Fréquence cardiaque',TEMPERATURE:'Température',SPO2:'SpO2'}
const priorities:Record<string,string>={FAIBLE:'Faible',MOYEN:'Moyenne',ELEVE:'Élevée',CRITIQUE:'Critique'}
const operators:Record<string,string>={GT:'>',GTE:'≥',GE:'≥',LT:'<',LTE:'≤',LE:'≤',EQ:'=',HORS_PLAGE:'Hors plage'}

export function PatientThresholds({patientId}:{patientId:string}) {
 const state=useAsyncData(`thresholds:${patientId}`,()=>listThresholds(patientId))
 return <Card title="Règles de suivi du serveur">
  {state.status==='loading' && <p role="status" className="text-sm text-muted">Chargement des règles…</p>}
  {state.status==='error' && <Alert variant="error" title="Règles indisponibles">{state.error}</Alert>}
  {state.status==='success' && (state.data.length ? <ul className="flex flex-col gap-3">{state.data.map(rule=><li key={rule.id} className="rounded-lg bg-page p-3 text-sm">
   <p className="font-semibold">{types[rule.typeMesure] ?? rule.typeMesure}{rule.composante==='DIASTOLIQUE'?' · Diastolique':''} · Priorité {priorities[rule.niveauPriorite] ?? rule.niveauPriorite}</p>
   <p>{operators[rule.operateur] ?? rule.operateur} {rule.seuilMin != null ? rule.seuilMin : ''}{rule.seuilMin != null && rule.seuilMax != null ? ' – ' : ''}{rule.seuilMax != null ? rule.seuilMax : ''} {rule.unite}{rule.contexteMesure ? ` · ${rule.contexteMesure}` : ''}</p>
   <p className="text-xs text-muted">{rule.patientId?'Règle personnalisée du patient':'Règle générale'}</p>
  </li>)}</ul> : <p className="text-sm text-muted">Aucune règle active reçue du serveur.</p>)}
  <p className="mt-3 text-xs text-muted">Règles indicatives de démonstration, configurables sur le serveur. Elles ne constituent pas un diagnostic. La glycémie des règles est exprimée en mg/dL ; les mesures affichées en g/L sont divisées par 100.</p>
 </Card>
}
