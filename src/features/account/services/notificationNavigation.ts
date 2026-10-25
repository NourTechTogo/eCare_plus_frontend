import {apiRequest} from '@/lib/apiClient'
import {listConversations} from '@/features/messaging/services/messagingService'
import {callHistory} from '@/features/messaging/services/callApi'
import type {NotificationDto} from './accountService'
export async function notificationDestination(n:NotificationDto):Promise<string>{
  if(!n.ressourceId) return '/profil'
  if(n.typeRessource==='ALERTE')return `/alertes/${n.ressourceId}`
  if(n.typeRessource==='CONVERSATION')return `/messagerie/${n.ressourceId}`
  if(n.typeRessource==='TRAITEMENT'){
    const treatment=await apiRequest<{dossierId:string}>(`/traitements/${n.ressourceId}`)
    const dossier=await apiRequest<{patientId:string}>(`/dossiers-suivi/${treatment.dossierId}`)
    return `/patients/${dossier.patientId}?onglet=traitements`
  }
  if(n.typeRessource==='APPEL'){
    for(const c of await listConversations())if((await callHistory(c.id)).content.some(call=>call.id===n.ressourceId))return `/messagerie/${c.id}`
    throw new Error('Cet appel n’est plus disponible dans vos conversations récentes.')
  }
  return '/profil'
}
