import {apiRequest} from '@/lib/apiClient'
export type TargetType='MESSAGE'|'APPEL'|'MESURE'|'ALERTE'
export type Visibility='PRIVEE'|'PARTAGEE'
export interface TargetNote {id:string;auteurId:string;contenu:string;visibilite:Visibility;version:number;dateCreation:string}
export const listTargetNotes=(typeCible:TargetType,cibleId:string)=>apiRequest<{content:TargetNote[];totalPages:number}>(`/notes?typeCible=${typeCible}&cibleId=${encodeURIComponent(cibleId)}&size=30`)
export const addTargetNote=(typeCible:TargetType,cibleId:string,contenu:string,visibilite:Visibility)=>apiRequest<TargetNote>('/notes',{method:'POST',body:{typeCible,cibleId,contenu,visibilite}})
export const updateTargetNote=(id:string,contenu:string,visibilite:Visibility,version:number)=>apiRequest<TargetNote>(`/notes/${id}`,{method:'PATCH',body:{contenu,visibilite,version}})
export const deleteTargetNote=(id:string)=>apiRequest<void>(`/notes/${id}`,{method:'DELETE'})
