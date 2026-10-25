import {test} from 'node:test'
import assert from 'node:assert/strict'
import {setAccessToken} from '../src/lib/apiClient.ts'
import {sendMessage,uploadPiece} from '../src/features/messaging/services/messagingService.ts'
import {listTargetNotes,addTargetNote,updateTargetNote} from '../src/features/targeted-notes/services/targetNoteService.ts'
test('message carries private pieces and upload key; empty text can accompany media',async()=>{
  setAccessToken('test');let sent
  globalThis.fetch=async(url,init)=>{sent={url,init};return new Response(JSON.stringify({id:'m',expediteurId:'p',contenu:'Pièce jointe',envoyeLe:'2026-10-25T08:00:00Z',piecesJointes:[{id:'piece',nomOriginal:'a.pdf',typeMime:'application/pdf',tailleOctets:3}]}))}
  const message=await sendMessage('c','',['piece'],'draft-retry');assert.deepEqual(JSON.parse(sent.init.body),{contenu:'',piecesJointes:['piece'],sourceRef:'draft-retry'});assert.equal(message.pieces[0].id,'piece')
  await uploadPiece('c',new File(['pdf'],'a.pdf'),'retry-1');assert.equal(sent.init.body.get('sourceRef'),'retry-1')
})
test('targeted notes preserve explicit visibility, target and optimistic version',async()=>{
  setAccessToken('test');let sent;globalThis.fetch=async(url,init)=>{sent={url,init};return new Response('{}')}
  await listTargetNotes('MESSAGE','m');assert.match(sent.url,/typeCible=MESSAGE&cibleId=m/)
  await addTargetNote('MESSAGE','m','Texte','PRIVEE');assert.deepEqual(JSON.parse(sent.init.body),{typeCible:'MESSAGE',cibleId:'m',contenu:'Texte',visibilite:'PRIVEE'})
  await updateTargetNote('n','Nouveau','PARTAGEE',5);assert.equal(JSON.parse(sent.init.body).version,5)
})
