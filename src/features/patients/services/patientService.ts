import type { Patient, PatientInput } from '@/features/patients/types/patient'
import { apiCollection, apiRequest } from '@/lib/apiClient'
export interface PatientDto {
 id: string; numeroPatient: string; nom: string; prenoms: string; sexe: string; dateNaissance: string; telephone: string;
 email?: string; adresse?: string; ville?: string; pays?: string; personneAContacter?: string; telephoneUrgence?: string;
 pathologie?: PatientInput['condition']; professionnelId?: string; professionnelNom?: string; groupeSanguin?: string;
 tailleCm?: number; poidsKg?: number; allergies?: string; antecedents?: string; dateCreation: string; consentementAccepte: boolean;
}
export function mapPatient(d: PatientDto): Patient {
 return { id:d.id, fileNumber:d.numeroPatient, lastName:d.nom, firstName:d.prenoms,
 sex: d.sexe === 'FEMININ' ? 'F' : d.sexe === 'MASCULIN' ? 'M' : d.sexe === 'AUTRE' ? 'A' : 'N', birthDate:d.dateNaissance ?? '', phone:d.telephone ?? '',
 email:d.email, address:d.adresse, city:d.ville, country:d.pays, emergencyContactName:d.personneAContacter, emergencyContactPhone:d.telephoneUrgence,
 condition:d.pathologie ?? '', professionalId:d.professionnelId, professionalName:d.professionnelNom, bloodGroup:d.groupeSanguin,
 heightCm:d.tailleCm?.toString(), weightKg:d.poidsKg?.toString(), allergies:d.allergies, history:d.antecedents, createdAt:d.dateCreation, consentAccepted:d.consentementAccepte }
}
export function patientBody(i: PatientInput, administrativeOnly = false) {
 return { nom:i.lastName, prenoms:i.firstName, sexe: {F:'FEMININ',M:'MASCULIN',A:'AUTRE',N:'NON_RENSEIGNE'}[i.sex], dateNaissance:i.birthDate,
 telephone:i.phone, email:i.email || null, adresse:i.address || null, ville:i.city || null, pays:i.country || null, ...(administrativeOnly ? {} : {pathologie:i.condition || null}),
 personneAContacter:i.emergencyContactName, telephoneUrgence:i.emergencyContactPhone, professionnelId:i.professionalId,
 ...(administrativeOnly ? {} : {groupeSanguin:i.bloodGroup || null, tailleCm:i.heightCm ? Number(i.heightCm) : null, poidsKg:i.weightKg ? Number(i.weightKg) : null, allergies:i.allergies || null, antecedents:i.history || null}), ...(i.password ? {motDePasse:i.password, consentementAccepte:false} : {}) }
}
export async function listPatients() { return (await apiCollection<PatientDto>('/portail/patients')).map(mapPatient) }
export async function getPatient(id: string) { return mapPatient(await apiRequest<PatientDto>(`/portail/patients/${id}`)) }
export async function createPatient(input: PatientInput) { return mapPatient(await apiRequest<PatientDto>('/portail/patients', {method:'POST',body:patientBody(input)})) }
export async function updatePatient(id: string,input: PatientInput,previous?: PatientInput) {
 const {professionnelId,...administrative}=patientBody(input,true)
 const body=previous && previous.professionalId===input.professionalId ? administrative : {...administrative,professionnelId}
 return mapPatient(await apiRequest<PatientDto>(`/portail/patients/${id}`, {method:'PATCH',body}))
}
export interface Professional { id:string; nom:string; prenoms:string; specialite?:string }
export const listProfessionals = () => apiCollection<Professional>('/portail/professionnels')
