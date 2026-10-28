import {test} from 'node:test'
import assert from 'node:assert/strict'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {listDocumentView} from '../src/features/documents/services/documentService.ts'

test('reports filter traverses authorized pages before local pagination',async()=>{
  setAccessToken('test-token');const calls=[]
  globalThis.fetch=async(url,init)=>{
    calls.push({url,init});const page=new URL(url,'http://local').searchParams.get('page')
    return new Response(JSON.stringify({totalPages:2,content:page==='0'
      ?[{id:'other',typeDocument:'ORDONNANCE'},{id:'r1',typeDocument:'COMPTE_RENDU'}]
      :[{id:'r2',typeDocument:'COMPTE_RENDU'}]}))
  }
  const result=await listDocumentView('patient-a',1,true,1)
  assert.equal(result.totalElements,2);assert.equal(result.totalPages,2)
  assert.deepEqual(result.content.map(d=>d.id),['r2'])
  assert.equal(calls.length,2)
  for(const call of calls){assert.match(call.url,/\/portail\/patients\/patient-a\/documents\?/);assert.equal(call.init.headers.Authorization,'Bearer test-token');assert.doesNotMatch(call.url,/rapports-consultation/)}
})
test('all documents retain the existing server pagination',async()=>{
  setAccessToken('test-token');const calls=[]
  globalThis.fetch=async(url)=>{calls.push(url);return new Response(JSON.stringify({content:[],totalPages:0,totalElements:0}))}
  await listDocumentView('patient-b',2,false)
  assert.equal(calls.length,1);assert.match(calls[0],/page=2&size=20/)
})
