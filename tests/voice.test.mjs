import {test} from 'node:test'
import assert from 'node:assert/strict'
import {encodeVoiceWav,VoiceCaptureLifetime} from '../src/features/messaging/voiceWav.ts'
import {uploadVoicePiece,uploadPiece,loadVoicePiece,sendMessage} from '../src/features/messaging/services/messagingService.ts'
import {setAccessToken} from '../src/lib/apiClient.ts'

test('voice capture resamples PCM to mono 16kHz WAV with bounded signed samples',async()=>{
 const samples=new Float32Array(48000).fill(2);samples.fill(-2,24000)
 const wav=encodeVoiceWav(samples,48000),bytes=await wav.arrayBuffer(),view=new DataView(bytes)
 assert.equal(wav.type,'audio/wav');assert.equal(wav.size,32044)
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF')
 assert.equal(new TextDecoder().decode(bytes.slice(8,12)),'WAVE')
 assert.equal(view.getUint32(4,true),32036);assert.equal(view.getUint16(20,true),1)
 assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint32(24,true),16000)
 assert.equal(view.getUint16(34,true),16);assert.equal(view.getUint32(40,true),32000)
 assert.equal(view.getInt16(44,true),32767);assert.equal(view.getInt16(44+16000,true),-32768)
})
test('voice encoder rejects too short capture and clips at 120 seconds below 5MiB',()=>{
 assert.throws(()=>encodeVoiceWav(new Float32Array(3999),16000))
 assert.throws(()=>encodeVoiceWav(new Float32Array(16000),0))
 assert.equal(encodeVoiceWav(new Float32Array(121*16000),16000).size,3840044)
})
test('cancellation releases active resources once and discards delayed permission resources',()=>{
 const lifetime=new VoiceCaptureLifetime();let released=0
 const pending=lifetime.begin();lifetime.cancel()
 assert.equal(lifetime.attach(pending,()=>released++),false);assert.equal(released,1)
 const active=lifetime.begin();assert.equal(lifetime.attach(active,()=>released++),true)
 lifetime.cancel();lifetime.cancel();assert.equal(released,2);assert.equal(lifetime.current(active),false)
})
test('voice private multipart upload preserves retry source; document upload remains strict',async()=>{
 setAccessToken('voice-test');const requests=[]
 globalThis.fetch=async(url,init)=>{requests.push({url,init});return new Response(JSON.stringify({id:'voice',nomOriginal:'message-vocal.wav',typeMime:'audio/wav',tailleOctets:32044,dureeMs:1000}))}
 const wav=encodeVoiceWav(new Float32Array(16000),16000),file=new File([wav],'message-vocal.wav',{type:'audio/wav'})
 await uploadVoicePiece('conversation',file,'stable-source');await uploadVoicePiece('conversation',file,'stable-source')
 assert.equal(requests[0].url,'/api/v1/mobile/conversations/conversation/pieces-jointes')
 assert.equal(requests[0].init.headers.Authorization,'Bearer voice-test')
 assert.equal(requests[0].init.body.get('sourceRef'),requests[1].init.body.get('sourceRef'))
 assert.equal(requests[0].init.body.get('fichier').type,'audio/wav')
 assert.throws(()=>uploadPiece('conversation',file,'source'))
 await assert.rejects(()=>uploadVoicePiece('conversation',new File(['fake'],'x.wav',{type:'audio/wav'}),'bad'))
 await assert.rejects(()=>uploadVoicePiece('conversation',new File([wav],'x.webm',{type:'audio/webm'}),'bad'))
 const forged=await wav.arrayBuffer();new DataView(forged).setUint16(34,32,true)
 await assert.rejects(()=>uploadVoicePiece('conversation',new File([forged],'x.wav',{type:'audio/wav'}),'bad'))
 await sendMessage('conversation','',['voice'],'message-source')
 assert.deepEqual(JSON.parse(requests.at(-1).init.body),{contenu:'',sourceRef:'message-source',piecesJointes:['voice']})
})
test('voice preparation cannot upload using a replacement session',async()=>{
 setAccessToken('first');let uploaded=false
 globalThis.fetch=async()=>{uploaded=true;return new Response('{}')}
 const wav=encodeVoiceWav(new Float32Array(16000),16000)
 const file=new File([wav],'voice.wav',{type:'audio/wav'})
 const original=file.arrayBuffer.bind(file)
 file.arrayBuffer=async()=>{const bytes=await original();setAccessToken('replacement');return bytes}
 await assert.rejects(()=>uploadVoicePiece('c',file,'source'),/Session modifiée/)
 assert.equal(uploaded,false)
})
test('voice playback uses bearer private fetch and rejects a response after session change',async()=>{
 setAccessToken('private-voice');let request,resolve
 globalThis.fetch=(url,init)=>{request={url,init};return new Promise(r=>resolve=r)}
 const pending=loadVoicePiece('c',{id:'v'})
 assert.equal(request.url,'/api/v1/mobile/conversations/c/pieces-jointes/v/contenu')
 assert.equal(request.init.headers.Authorization,'Bearer private-voice');assert.equal(request.init.cache,'no-store')
 setAccessToken(null);resolve(new Response('audio'))
 await assert.rejects(pending,/Session modifiée/)
})
