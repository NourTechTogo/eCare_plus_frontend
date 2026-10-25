import {test} from 'node:test'
import assert from 'node:assert/strict'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {createPrescription} from '../src/features/treatments/services/treatmentService.ts'
test('prescription sends all writes in one idempotent command with explicit zone',async()=>{
 setAccessToken('test');const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response('{"traitementId":"t","priseId":"p"}')}
 const command={sourceRef:'retry-key',traitement:{libelle:'Test',dateDebut:'2026-10-25',consignesGenerales:''},medicament:{nomCommercial:'Exemple',denomination:'Exemple',forme:'comprimé',dosage:'10',uniteDosage:'mg'},prise:{quantite:1,unite:'comprimé',heurePrevue:'08:00',voieAdministration:'orale',fuseau:'Europe/Paris',joursSemaine:[1,2,3,4,5,6,7]}}
 await createPrescription('patient',command);await createPrescription('patient',command)
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.url==='/api/v1/portail/patients/patient/prescriptions'))
 assert.deepEqual(JSON.parse(calls[0].init.body),command);assert.equal(calls[0].init.body,calls[1].init.body)
})
