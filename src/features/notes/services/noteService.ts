import { apiCollection, apiRequest } from '@/lib/apiClient'
import type { ClinicalNote } from '@/features/notes/types/note'
interface NoteDto { id:string; contenu:string; professionnelNom:string; dateCreation:string }
const mapNote = (d:NoteDto,patientId:string):ClinicalNote => ({id:d.id,patientId,author:d.professionnelNom,createdAt:d.dateCreation,text:d.contenu})
export async function listNotes(patientId:string) { return (await apiCollection<NoteDto>(`/portail/patients/${patientId}/observations`)).map(d=>mapNote(d,patientId)) }
export async function addNote(patientId:string,text:string,_author:string) { return mapNote(await apiRequest<NoteDto>(`/portail/patients/${patientId}/observations`, {method:'POST',body:{contenu:text}}),patientId) }
