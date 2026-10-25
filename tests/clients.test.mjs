import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiUpload, apiBlob, setAccessToken } from '../src/lib/apiClient.ts'

test('multipart keeps boundary and Bearer; binary requests use no-store', async () => {
  setAccessToken('test-token')
  let calls=[]
  globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response(init.body instanceof FormData ? '{"id":"doc"}' : new Uint8Array([1,2]),{status:200})}
  const form=new FormData();form.set('fichier',new Blob(['pdf']),'bilan.pdf')
  assert.deepEqual(await apiUpload('/mobile/me/documents',form),{id:'doc'})
  assert.equal(calls[0].init.headers.Authorization,'Bearer test-token')
  assert.equal(calls[0].init.headers['Content-Type'],undefined)
  assert.equal(await (await apiBlob('/document/contenu')).arrayBuffer().then(b=>b.byteLength),2)
  assert.equal(calls[1].init.cache,'no-store')
})
test('private download rejects response from replaced session',async()=>{
  setAccessToken('a');let resolve
  globalThis.fetch=()=>new Promise(r=>{resolve=r})
  const result=apiBlob('/document/contenu');setAccessToken('b');resolve(new Response('private'))
  await assert.rejects(result,/Session/)
})
