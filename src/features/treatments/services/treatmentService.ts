import {apiRequest} from '@/lib/apiClient'
export interface DosePlanning {id:string;frequence:string;heurePrevue:string;fuseau:string;joursSemaine:number[];configurationRequise:boolean;version:number}
export interface Treatment {id:string;libelle:string;dateDebut:string;dateFin?:string;statut:string;consignes?:string;prises:DosePlanning[]}
export interface Occurrence {id:string;traitementId:string;medicament:string;dosage?:string;uniteDosage?:string;quantite:number;unite:string;prevueLe:string;reporteeAu?:string;statut:string;annulee:boolean;version:number;fuseau:string}
export interface Planning {version:string;du:string;au:string;traitements:Treatment[];occurrences:Occurrence[]}
export interface Observance {prisesPrevues:number;prisesConfirmees:number;prisesIgnorees:number;prisesNonConfirmees:number;taux:number|null}
export const getPlanning=(id:string,du:string,au:string)=>apiRequest<Planning>(`/portail/patients/${id}/planning-traitements?du=${du}&au=${au}`)
export const getObservance=(id:string,du:string,au:string)=>apiRequest<Observance>(`/portail/patients/${id}/observance?du=${du}&au=${au}`)
export const configurePlanning=(id:string,version:number,fuseau:string,joursSemaine:number[])=>apiRequest<DosePlanning>(`/portail/prises/${id}/planning`,{method:'PUT',body:{version,fuseau,joursSemaine}})
export const getPatientDossier=(id:string)=>apiRequest<{dossierId:string}>(`/portail/patients/${id}`)
export const createTreatment=(dossierId:string,body:{libelle:string;dateDebut:string;dateFin?:string;consignesGenerales:string})=>apiRequest<{id:string}>(`/dossiers-suivi/${dossierId}/traitements`,{method:'POST',body})
export const createMedication=(body:{nomCommercial:string;denomination:string;forme:string;dosage:string;uniteDosage:string})=>apiRequest<{id:string}>('/medicaments',{method:'POST',body})
export const createDose=(treatmentId:string,body:{medicamentId:string;quantite:number;unite:string;frequence:string;heurePrevue:string;voieAdministration:string})=>apiRequest<{id:string;version:number}>(`/traitements/${treatmentId}/prises`,{method:'POST',body})
export interface PrescriptionCommand {
  sourceRef:string
  traitement:{libelle:string;dateDebut:string;dateFin?:string;consignesGenerales:string}
  medicament:{nomCommercial:string;denomination:string;forme:string;dosage:string;uniteDosage:string}
  prise:{quantite:number;unite:string;heurePrevue:string;voieAdministration:string;fuseau:string;joursSemaine:number[]}
}
export const createPrescription=(patientId:string,command:PrescriptionCommand)=>apiRequest<{traitementId:string;medicamentId:string;priseId:string;versionPrise:number;fuseau:string;joursSemaine:number[]}>(`/portail/patients/${patientId}/prescriptions`,{method:'POST',body:command})
