import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {listDocuments,uploadDocument} from '../src/features/documents/services/documentService.ts'
import {getPlanning,getObservance} from '../src/features/treatments/services/treatmentService.ts'
import {listMessages,sendMessage} from '../src/features/messaging/services/messagingService.ts'
import {addTargetNote,listTargetNotes} from '../src/features/targeted-notes/services/targetNoteService.ts'
import {createCall} from '../src/features/messaging/services/callApi.ts'
import {getPreferences} from '../src/features/account/services/accountService.ts'
import {notificationDestination} from '../src/features/account/services/notificationNavigation.ts'
test('LIVE React adapters exchange real documents, planning, enriched messages and notes',{skip:process.env.RUN_CLIENTS_LIVE_TEST!=='1'},async()=>{
 const secrets=JSON.parse(readFileSync('../.maintenance/runtime-secrets.json','utf8')),fixture=JSON.parse(readFileSync('../.maintenance/integration-clients/fixture.json','utf8'))
 const nativeFetch=globalThis.fetch
 const login=await nativeFetch('http://127.0.0.1:8081/api/v1/auth/connexion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifiant:'medecin@ecare.test',motDePasse:secrets.APP_DEMO_PASSWORD})}).then(r=>r.json())
 setAccessToken(login.jeton)
 globalThis.sessionStorage={getItem:()=>JSON.stringify({user:{id:login.profil.id}})}
 globalThis.fetch=(url,init)=>nativeFetch(new URL(url,'http://127.0.0.1:8081'),init)
 try{
  assert.ok((await listDocuments(fixture.patientId)).content.some(d=>d.id===fixture.documentId))
  const document=await uploadDocument(fixture.patientId,new File(['%PDF-1.4\n%%EOF\n'],'react-live.pdf'), 'Document React fictif','AUTRE',fixture.today,'react-live-'+Date.now());assert.ok(document.id)
  assert.ok((await getPlanning(fixture.patientId,fixture.today,fixture.today)).occurrences.length)
  assert.ok((await getObservance(fixture.patientId,fixture.today,fixture.today)).prisesPrevues>=1)
  const messages=await listMessages(fixture.conversationId,fixture.patientId);assert.ok(messages.some(m=>m.pieces?.length))
  const message=await sendMessage(fixture.conversationId,'Message adaptateur React fictif '+Date.now());assert.ok(message.id)
  await addTargetNote('MESSAGE',message.id,'Note React fictive','PARTAGEE');assert.equal((await listTargetNotes('MESSAGE',message.id)).content.length,1)
  assert.equal(await notificationDestination({typeRessource:'TRAITEMENT',ressourceId:fixture.treatmentId}),`/patients/${fixture.patientId}?onglet=traitements`)
  await getPreferences();await assert.rejects(createCall(fixture.conversationId,'AUDIO','react-live-call-'+Date.now()),e=>e.status===503)
 }finally{globalThis.fetch=nativeFetch;await nativeFetch('http://127.0.0.1:8081/api/v1/auth/deconnexion',{method:'POST',headers:{Authorization:'Bearer '+login.jeton}});setAccessToken(null)}
})
