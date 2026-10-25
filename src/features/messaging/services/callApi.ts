import {apiRequest} from '@/lib/apiClient'
export interface ServerCall {id:string;conversationId:string;initiateurId:string;destinataireId:string;type:'AUDIO'|'VIDEO';statut:string;dateCreation:string;debutLe?:string;finLe?:string;dureeSecondes?:number;fermetureConfirmee:boolean;version:number}
export const activeCall=(call:ServerCall)=>['PREPARATION','EN_ATTENTE','ACCEPTE'].includes(call.statut)
export const callHistory=(conversation:string)=>apiRequest<{content:ServerCall[];totalPages:number}>(`/mobile/conversations/${conversation}/appels?page=0&size=30&sort=dateCreation,desc`)
export const createCall=(conversation:string,type:'AUDIO'|'VIDEO',sourceRef:string)=>apiRequest<ServerCall>(`/mobile/conversations/${conversation}/appels`,{method:'POST',body:{type,sourceRef}})
export const callAction=(id:string,action:'acceptation'|'refus'|'fin')=>apiRequest<ServerCall>(`/appels/${id}/${action}`,{method:'POST'})
export const callConnection=(id:string)=>apiRequest<{url:string;jeton:string;expireLe:string}>(`/appels/${id}/connexion`)
