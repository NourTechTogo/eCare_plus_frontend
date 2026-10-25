import {apiRequest} from '@/lib/apiClient'
import type {Appointment,AppointmentAction,AppointmentStatus} from '../types/appointment'
interface AppointmentDto {
 id:string;patientId:string;patientNom:string;numeroPatient:string;
 motif:string;dateHeure:string;lieu?:string;statut:string
}
const statuses:Record<string,AppointmentStatus>={PLANIFIE:'planifie',CONFIRME:'confirme',REPORTE:'reporte',ANNULE:'annule',REALISE:'realise'}
const actions:Record<AppointmentAction,string>={confirmer:'confirmation',annuler:'annulation',realiser:'realisation'}
function mapAppointment(row:AppointmentDto):Appointment {
 const status=statuses[row.statut]
 if(!status)throw new Error('Statut de rendez-vous inconnu')
 return {id:row.id,patientId:row.patientId,patientName:row.patientNom,patientFileNumber:row.numeroPatient,
  reason:row.motif,scheduledAt:row.dateHeure,location:row.lieu,status}
}
export async function listAppointments():Promise<Appointment[]> {
 return (await apiRequest<AppointmentDto[]>('/rendez-vous')).map(mapAppointment)
}
export async function applyAppointmentAction(id:string,action:AppointmentAction):Promise<Appointment> {
 await apiRequest(`/rendez-vous/${encodeURIComponent(id)}/${actions[action]}`,{method:'PATCH'})
 const row=(await listAppointments()).find(item=>item.id===id)
 if(!row)throw new Error('Rendez-vous indisponible après actualisation')
 return row
}
