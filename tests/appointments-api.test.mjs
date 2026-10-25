import test from 'node:test'
import assert from 'node:assert/strict'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {listAppointments,applyAppointmentAction} from '../src/features/appointments/services/appointmentService.ts'

test('restored agenda reads actual API rows and applies authenticated actions',async()=>{
 const original=globalThis.fetch;const requests=[];let status='PLANIFIE'
 setAccessToken('agenda-token')
 globalThis.fetch=async(url,options)=>{
  requests.push({url:String(url),...options})
  if(options.method==='PATCH'){status='CONFIRME';return new Response(JSON.stringify({id:'rdv',statut:status}),{status:200})}
  return new Response(JSON.stringify([{id:'rdv',patientId:'patient',patientNom:'Patient fictif',numeroPatient:'P001',motif:'Suivi',dateHeure:'2026-10-26T09:00:00Z',lieu:'Cabinet',statut:status}]),{status:200})
 }
 try{
  const rows=await listAppointments();assert.equal(rows.length,1);assert.equal(rows[0].patientName,'Patient fictif');assert.equal(rows[0].status,'planifie')
  const confirmed=await applyAppointmentAction('rdv','confirmer');assert.equal(confirmed.status,'confirme')
  assert(requests.some(r=>r.method==='PATCH'&&r.url.endsWith('/rendez-vous/rdv/confirmation')))
  assert(requests.every(r=>r.headers.Authorization==='Bearer agenda-token'))
 }finally{globalThis.fetch=original;setAccessToken(null)}
})
