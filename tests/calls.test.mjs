import {test} from 'node:test'
import assert from 'node:assert/strict'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {createCall,callAction,callConnection,callHistory} from '../src/features/messaging/services/callApi.ts'
test('calls use backend state and fixed retry key; grants are requested only via private API',async()=>{
  setAccessToken('test');const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response('{}')}
  await createCall('c','VIDEO','same-key');assert.deepEqual(JSON.parse(calls.at(-1).init.body),{type:'VIDEO',sourceRef:'same-key'})
  await callAction('id','acceptation');assert.equal(calls.at(-1).url,'/api/v1/appels/id/acceptation')
  await callConnection('id');assert.equal(calls.at(-1).init.headers.Authorization,'Bearer test')
  await callHistory('c');assert.match(calls.at(-1).url,/appels\?page=0&size=30/)
})
test('provider failure is propagated without fabricated call success',async()=>{
  globalThis.fetch=async()=>new Response('{"detail":"Fournisseur non configuré"}',{status:503})
  await assert.rejects(createCall('c','AUDIO','same'),/Fournisseur non configuré/)
})
