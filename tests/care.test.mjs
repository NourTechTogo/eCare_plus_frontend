import {test} from 'node:test'
import assert from 'node:assert/strict'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {getPlanning,configurePlanning,getObservance} from '../src/features/treatments/services/treatmentService.ts'
import {getPreferences,savePreferences,resolveReference,consumeReference} from '../src/features/account/services/accountService.ts'
test('planning and configuration preserve dates, version and ISO weekdays',async()=>{
  setAccessToken('test');const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response('{}')}
  await getPlanning('p','2026-10-25','2026-10-26');assert.match(calls.at(-1).url,/du=2026-10-25&au=2026-10-26/)
  await configurePlanning('dose',3,'Africa/Lome',[1,7]);assert.deepEqual(JSON.parse(calls.at(-1).init.body),{version:3,fuseau:'Africa/Lome',joursSemaine:[1,7]})
  await getObservance('p','2026-10-01','2026-10-25');assert.match(calls.at(-1).url,/observance/)
})
test('account preferences and QR consume null dossier version on same backend',async()=>{
  setAccessToken('test');const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response('{}')}
  await getPreferences();assert.equal(calls.at(-1).url,'/api/v1/compte/preferences-notifications')
  await savePreferences(true,false);assert.equal(JSON.parse(calls.at(-1).init.body).whatsappActif,false)
  await resolveReference('opaque');await consumeReference('opaque','doctor',null)
  assert.deepEqual(JSON.parse(calls.at(-1).init.body),{jeton:'opaque',professionnelId:'doctor',versionDossier:null})
})
