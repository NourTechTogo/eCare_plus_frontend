import {test} from 'node:test'
import assert from 'node:assert/strict'
import {activateVoicePlayback,LazyVoiceAudio} from '../src/features/messaging/voicePlayback.ts'

test('StrictMode setup-cleanup-setup restores the source and URL replacement owns the new source',()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document
 globalThis.window=new EventTarget();globalThis.document={querySelectorAll:()=>[]}
 class Audio extends EventTarget{src='';pauses=0;loads=0;pause(){this.pauses++}load(){this.loads++}removeAttribute(name){if(name==='src')this.src=''}play(){return Promise.resolve()}}
 const audio=new Audio()
 try{
  let cleanup=activateVoicePlayback(audio,'blob:one',false,()=>{})
  assert.equal(audio.src,'blob:one');cleanup();assert.equal(audio.src,'')
  cleanup=activateVoicePlayback(audio,'blob:one',false,()=>{})
  assert.equal(audio.src,'blob:one');cleanup()
  cleanup=activateVoicePlayback(audio,'blob:two',false,()=>{})
  assert.equal(audio.src,'blob:two');window.dispatchEvent(new Event('ecare:stop-voice'))
  assert.equal(audio.pauses,3);cleanup();assert.equal(audio.src,'');assert.equal(audio.loads,3)
 }finally{globalThis.window=previousWindow;globalThis.document=previousDocument}
})
test('async autoplay rejection requests explicit playback, stale play rejection does not affect replay',async()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document
 globalThis.window=new EventTarget();globalThis.document={querySelectorAll:()=>[]}
 class Audio extends EventTarget{src='';pause(){}load(){}removeAttribute(){}play(){return Promise.reject(new Error('NotAllowedError'))}}
 let blocked=0
 try{
  const cleanup=activateVoicePlayback(new Audio(),'blob:one',true,()=>blocked++);cleanup()
  await Promise.resolve();assert.equal(blocked,0)
  const finalCleanup=activateVoicePlayback(new Audio(),'blob:one',true,()=>blocked++)
  await Promise.resolve();assert.equal(blocked,1);finalCleanup()
 }finally{globalThis.window=previousWindow;globalThis.document=previousDocument}
})
test('private audio loads lazily, deduplicates requests, caches one URL and revokes on cleanup',async()=>{
 let requests=0
 const resource=new LazyVoiceAudio(async()=>{requests++;return new Blob(['audio'])})
 assert.equal(requests,0)
 const first=resource.load(),second=resource.load();assert.equal(first,second)
 const url=await first;assert.equal(requests,1);assert.equal(await resource.load(),url)
 resource.reset()
 await assert.rejects(fetch(url))
 await resource.load();assert.equal(requests,2);resource.reset()
})
test('private audio cleanup or new media intent discards delayed blob response and supports retry',async()=>{
 let resolve,requests=0
 const resource=new LazyVoiceAudio(()=>{requests++;return new Promise(r=>resolve=r)})
 const pending=resource.load();resource.cancelPending();resolve(new Blob(['audio']))
 await assert.rejects(pending,/annulée/)
 const retry=resource.load();resolve(new Blob(['audio']));assert.match(await retry,/^blob:/)
 assert.equal(requests,2);resource.reset()
})
test('failed private audio request can be retried',async()=>{
 let requests=0
 const resource=new LazyVoiceAudio(async()=>{if(++requests===1)throw new Error('403');return new Blob(['audio'])})
 await assert.rejects(resource.load(),/403/)
 assert.match(await resource.load(),/^blob:/);assert.equal(requests,2);resource.reset()
})

test('new voice selection cancels a slower earlier load, preserves its own load and only plays selected audio',async()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document
 globalThis.window=new EventTarget();globalThis.document={querySelectorAll:()=>[]}
 const {selectVoicePlayback,onOtherVoiceSelection}=await import('../src/features/messaging/voicePlayback.ts')
 let resolveA,resolveB,autoplayA=0,autoplayB=0
 const a=new LazyVoiceAudio(()=>new Promise(resolve=>resolveA=resolve))
 const b=new LazyVoiceAudio(()=>new Promise(resolve=>resolveB=resolve))
 const stopA=onOtherVoiceSelection(a,()=>a.cancelPending())
 const stopB=onOtherVoiceSelection(b,()=>b.cancelPending())
 try{
  selectVoicePlayback(a)
  const first=a.load().then(()=>autoplayA++)
  selectVoicePlayback(b)
  const second=b.load().then(()=>autoplayB++)
  resolveB(new Blob(['B']));await second
  assert.equal(autoplayB,1)
  resolveA(new Blob(['A']));await assert.rejects(first,/annulée/)
  assert.equal(autoplayA,0)
  selectVoicePlayback(b);assert.match(await b.load(),/^blob:/)
  class DelayedAudio extends EventTarget{src='';pause(){}load(){}removeAttribute(){}play(){autoplayA++;return Promise.resolve()}}
  const cleanup=activateVoicePlayback(new DelayedAudio(),'blob:stale-A',true,()=>{},a)
  assert.equal(autoplayA,0,'a delayed React commit must not autoplay an older selection');cleanup()
 }finally{stopA();stopB();a.reset();b.reset();globalThis.window=previousWindow;globalThis.document=previousDocument}
})
