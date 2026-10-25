import type { Measurement } from '@/features/measurements/types/measurement'
import { apiCollection, apiRequest } from '@/lib/apiClient'
import { listPatients } from '@/features/patients/services/patientService'
export interface MeasurementDto { id:string; patientId:string; typeMesure:string; valeurPrincipale:number; valeurSecondaire?:number; unite:string; dateMesure:string; contexteMesure?:string; source:string; commentaire?:string }
export function mapMeasurement(d: MeasurementDto): Measurement {
 if (!Number.isFinite(d.valeurPrincipale)) throw new Error('Valeur de mesure invalide')
 const base = {id:d.id,patientId:d.patientId,recordedAt:d.dateMesure,source:d.source,comment:d.commentaire}
 switch(d.typeMesure) {
 case 'GLYCEMIE':
 if (d.unite !== 'mg/dL') throw new Error('Unité de glycémie inattendue')
 return {...base,kind:'glycemie',value:d.valeurPrincipale / 100,context:d.contexteMesure === 'A_JEUN' ? 'a_jeun' : d.contexteMesure === 'POST_PRANDIALE' ? 'post_prandiale' : 'non_precise'}
 case 'TENSION_ARTERIELLE':
 if (!Number.isFinite(d.valeurSecondaire)) throw new Error('Valeur diastolique absente')
 return {...base,kind:'tension',systolic:d.valeurPrincipale,diastolic:d.valeurSecondaire as number}
 case 'POIDS': return {...base,kind:'poids',value:d.valeurPrincipale}
 case 'FREQUENCE_CARDIAQUE': return {...base,kind:'frequence_cardiaque',value:d.valeurPrincipale}
 case 'TEMPERATURE': return {...base,kind:'temperature',value:d.valeurPrincipale}
 case 'SPO2': return {...base,kind:'spo2',value:d.valeurPrincipale}
 default: throw new Error('Type de mesure inconnu')
 }
}
export interface ThresholdRule {
 id:string; typeMesure:string; composante:'PRINCIPALE'|'DIASTOLIQUE'; unite:string;
 operateur:string; seuilMin:number|null; seuilMax:number|null; niveauPriorite:string;
 patientId:string|null; contexteMesure:string|null
}
export const listThresholds=(patientId:string)=>apiRequest<ThresholdRule[]>(`/portail/patients/${patientId}/seuils`)
export async function listMeasurements(patientId:string): Promise<Measurement[]> { return (await apiCollection<MeasurementDto>(`/portail/patients/${patientId}/mesures`)).map(mapMeasurement).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt)) }
export async function listLatestMeasurements(): Promise<Record<string,Measurement>> {
 const entries = await Promise.all((await listPatients()).map(async p => [p.id,(await listMeasurements(p.id))[0]] as const))
 return Object.fromEntries(entries.filter((entry): entry is readonly [string,Measurement] => !!entry[1]))
}
