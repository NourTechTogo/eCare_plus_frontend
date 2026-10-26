import { currentUserId } from '@/features/auth/services/authService'
import { apiBlob, apiCollection, apiRequest, apiUpload, downloadPrivate, sessionRevision } from '@/lib/apiClient'
import type { Conversation, Message } from '@/features/messaging/types/message'
export const MESSAGE_MAX_LENGTH=2000
export interface PieceDto {id:string;nomOriginal:string;typeMime:string;tailleOctets:number;dureeMs?:number}
export interface MessageDto { id:string;expediteurId:string;contenu:string;envoyeLe:string;luLe?:string;piecesJointes?:PieceDto[] }
interface ConversationDto {id:string;patientId:string;professionnelId:string;patientNom:string;numeroPatient:string;nonLus:number;dernierMessage?:MessageDto}
export function mapMessage(d:MessageDto,conversationId:string,_patientId:string):Message {return {id:d.id,conversationId,author:d.expediteurId===currentUserId()?'professionnel':'patient',text:d.contenu,sentAt:d.envoyeLe,readAt:d.luLe,...(d.piecesJointes?{pieces:d.piecesJointes}:{})}}
export async function listConversations():Promise<Conversation[]> {return (await apiRequest<ConversationDto[]>('/mobile/conversations')).map(d=>({id:d.id,patientId:d.patientId,patientName:d.patientNom,patientFileNumber:d.numeroPatient,unreadCount:d.nonLus,lastMessage:d.dernierMessage ? mapMessage(d.dernierMessage,d.id,d.patientId):undefined}))}
export async function listMessages(id:string,patientId:string):Promise<Message[]> {return (await apiCollection<MessageDto>(`/mobile/conversations/${id}/messages`)).map(d=>mapMessage(d,id,patientId)).sort((a,b)=>a.sentAt.localeCompare(b.sentAt))}
export async function sendMessage(id:string,text:string,pieces:string[]=[],sourceRef?:string):Promise<Message> {return mapMessage(await apiRequest<MessageDto>(`/mobile/conversations/${id}/messages`,{method:'POST',body:{contenu:text,...(sourceRef?{sourceRef}:{}),...(pieces.length?{piecesJointes:pieces}:{})}}),id,'')}
export function uploadPiece(id:string,file:File,sourceRef:string){if(!file.size||file.size>5*1024*1024||!/\.(pdf|jpe?g|png)$/i.test(file.name))throw new Error('PDF, JPG ou PNG non vide, 5 Mo maximum.');const form=new FormData();form.set('fichier',file);form.set('sourceRef',sourceRef);return apiUpload<PieceDto>(`/mobile/conversations/${id}/pieces-jointes`,form)}
export const downloadPiece=(id:string,piece:PieceDto)=>downloadPrivate(`/mobile/conversations/${id}/pieces-jointes/${piece.id}/contenu`,piece.nomOriginal)
export const loadVoicePiece=(id:string,piece:Pick<PieceDto,'id'>)=>apiBlob(`/mobile/conversations/${id}/pieces-jointes/${piece.id}/contenu`)
/** Only conversation voice capture uses WAV; document uploads keep their allowlist. */
export async function uploadVoicePiece(id:string,file:File,sourceRef:string):Promise<PieceDto>{
 const session=sessionRevision()
 if(file.type!=='audio/wav'||!file.name.endsWith('.wav')||file.size<44||file.size>5*1024*1024)throw new Error('Message vocal WAV invalide.')
 const bytes=await file.arrayBuffer(),view=new DataView(bytes)
 const magic=(offset:number,length:number)=>new TextDecoder().decode(bytes.slice(offset,offset+length))
 const rate=view.getUint32(24,true),length=view.getUint32(40,true)
 if(magic(0,4)!=='RIFF'||magic(8,4)!=='WAVE'||magic(12,4)!=='fmt '||magic(36,4)!=='data'||view.getUint32(4,true)!==file.size-8||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint16(32,true)!==2||view.getUint32(28,true)!==32000||view.getUint16(34,true)!==16||rate!==16000||length!==file.size-44||length%2!==0||length<8000||length>3840000)throw new Error('Message vocal WAV invalide (120 secondes maximum).')
 const form=new FormData();form.set('fichier',file);form.set('sourceRef',sourceRef)
 if(session!==sessionRevision())throw new Error('Session modifiée. Reconnectez-vous.')
 return apiUpload<PieceDto>(`/mobile/conversations/${id}/pieces-jointes`,form)
}
export const markConversationRead=(id:string)=>apiRequest<void>(`/mobile/conversations/${id}/lecture`,{method:'POST'})
export const openConversation=(patientId:string)=>apiRequest<{id:string}>('/mobile/conversations',{method:'POST',body:{patientId}})
