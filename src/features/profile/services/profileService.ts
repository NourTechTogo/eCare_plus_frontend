import type { User } from '@/features/auth'
import { apiRequest } from '@/lib/apiClient'
export interface ProfileChanges { firstName:string; lastName:string; phone:string }
export async function updateProfile(user:User,changes:ProfileChanges):Promise<User> {
 const d=await apiRequest<{id:string;nom:string;prenoms:string;telephone?:string;email?:string}>('/compte',{method:'PATCH',body:{nom:changes.lastName.trim(),prenoms:changes.firstName.trim(),telephone:changes.phone.trim()}})
 return {...user,id:d.id,name:`${d.prenoms} ${d.nom}`,firstName:d.prenoms,lastName:d.nom,phone:d.telephone,email:d.email}
}

export async function getProfile(user:User):Promise<User> {
 const d=await apiRequest<{id:string;nom:string;prenoms:string;telephone?:string;email?:string}>('/compte')
 return {...user,id:d.id,name:`${d.prenoms} ${d.nom}`,firstName:d.prenoms,lastName:d.nom,phone:d.telephone,email:d.email}
}
