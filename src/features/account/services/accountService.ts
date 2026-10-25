import {apiRequest} from '@/lib/apiClient'
export interface Preferences {pushActif:boolean;whatsappActif:boolean}
export const getPreferences=()=>apiRequest<Preferences>('/compte/preferences-notifications')
export const savePreferences=(push:boolean,whatsapp:boolean)=>apiRequest<Preferences>('/compte/preferences-notifications',{method:'PATCH',body:{pushActif:push,whatsappActif:whatsapp,versionConsentement:'2026-10-25'}})
export interface ReferenceResolution {patientId:string;nom:string;prenoms:string;dateNaissance?:string;dossierId:string|null;versionDossier:number|null}
export const resolveReference=(jeton:string)=>apiRequest<ReferenceResolution>('/portail/referencements/resolution',{method:'POST',body:{jeton}})
export const consumeReference=(jeton:string,professionnelId:string,versionDossier:number|null)=>apiRequest<{id:string}>('/portail/referencements',{method:'POST',body:{jeton,professionnelId,versionDossier}})
export interface NotificationDto {id:string;titre:string;message:string;dateEnvoi?:string;dateLecture?:string;typeRessource?:string;ressourceId?:string}
export const notifications=()=>apiRequest<{content:NotificationDto[];totalPages:number}>('/compte/notifications?page=0&size=30')
export const readNotification=(id:string)=>apiRequest<void>(`/compte/notifications/${id}/lecture`,{method:'POST'})
export const requestErasure=()=>apiRequest<{id:string;statut:string;information:string}>('/compte/demandes-effacement',{method:'POST'})
