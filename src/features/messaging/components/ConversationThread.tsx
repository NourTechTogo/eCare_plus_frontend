import {Fragment,useEffect,useRef,useState,type FormEvent,type DragEvent} from 'react'
import {Alert} from '@/components/ui/Alert'
import {IconLink,recordIconPath} from '@/components/ui/IconLink'
import {TargetNotes} from '@/features/targeted-notes/components/TargetNotes'
import {useAsyncData} from '@/hooks/useAsyncData'
import {attachmentError,kindOf} from '../attachments'
import {audioCallIconPath,videoCallIconPath,documentIconPath,micIconPath} from '../callIcons'
import {dayKey,formatDay,formatTime,formatCallDuration} from '../format'
import {listMessages,markConversationRead,sendMessage,uploadPiece,downloadPiece,MESSAGE_MAX_LENGTH} from '../services/messagingService'
import type {Conversation} from '../types/message'
import type {ServerCall} from '../services/callApi'
import {InitialsTile} from './InitialsTile'
import {ServerCallPanel} from './ServerCallPanel'
import {AttachmentMenu} from './AttachmentMenu'
import {AttachmentPreview,type PendingAttachment} from './AttachmentPreview'
const sendIconPath='M3.4 20.4 21 12 3.4 3.6 3 10.2l12 1.8-12 1.8.4 6.6Z'
const backIconPath='M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2Z'
type DraftAttachment=PendingAttachment&{source:string}
interface ComposerButtonProps {
  label: string
  iconPath: string
  /** Action principale (envoi, micro), sur fond de couleur principale. */
  primary?: boolean
  busy?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
}

/** Bouton rond à pictogramme de la zone de saisie. */
function ComposerButton({
  label,
  iconPath,
  primary = false,
  busy = false,
  disabled = false,
  type = 'button',
  onClick,
}: ComposerButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${
        primary ? 'bg-primary text-white hover:bg-primary-strong' : 'text-muted hover:bg-danger-soft hover:text-danger'
      }`}
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={iconPath} />
      </svg>
    </button>
  )
}


export function ConversationThread({conversation}:{conversation:Conversation}){
 const [version,setVersion]=useState(0),[text,setText]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState('')
 const [attachments,setAttachments]=useState<DraftAttachment[]>([]),[calls,setCalls]=useState<ServerCall[]>([])
 const submission=useRef<{fingerprint:string;key:string}|undefined>(undefined)
 const uploaded=useRef(new Map<string,string>()),mounted=useRef(true),pending=useRef(attachments),end=useRef<HTMLLIElement>(null)
 useEffect(()=>{pending.current=attachments},[attachments])
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;pending.current.forEach(a=>URL.revokeObjectURL(a.previewUrl))}},[])
 const state=useAsyncData(`messages:${conversation.id}:${version}`,async()=>{
  const messages=await listMessages(conversation.id,conversation.patientId);await markConversationRead(conversation.id);return messages
 },5000)
 const items=[...(state.status==='success'?state.data.map(message=>({kind:'message' as const,id:message.id,at:message.sentAt,message})):[]),
  ...calls.map(call=>({kind:'call' as const,id:call.id,at:call.dateCreation,call}))].sort((a,b)=>a.at.localeCompare(b.at))
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'})},[items.length])
 function pickFile(file:File){
  const extension=file.name.split('.').at(-1)?.toLowerCase()
  const inferred=extension==='pdf'?'application/pdf':extension==='png'?'image/png':['jpg','jpeg'].includes(extension??'')?'image/jpeg':undefined
  const normalized=!file.type&&inferred?new File([file],file.name,{type:inferred,lastModified:file.lastModified}):file
  const problem=attachmentError(normalized)
  if(problem){setError(problem);return}
  if(attachments.length>=5){setError('5 pièces jointes maximum.');return}
  setError('');setAttachments(previous=>[...previous,{kind:kindOf(normalized.type)??'file',file:normalized,previewUrl:URL.createObjectURL(normalized),source:crypto.randomUUID()}])
 }
 function remove(source:string){setAttachments(previous=>previous.filter(a=>{if(a.source!==source)return true;URL.revokeObjectURL(a.previewUrl);return false}))}
 async function submit(event:FormEvent){
  event.preventDefault();if((!text.trim()&&!attachments.length)||sending)return
  setSending(true);setError('')
  try{
   const ids:string[]=[]
   for(const attachment of attachments){let id=uploaded.current.get(attachment.source);if(!id){id=(await uploadPiece(conversation.id,attachment.file,attachment.source)).id;uploaded.current.set(attachment.source,id)}ids.push(id)}
   const fingerprint=JSON.stringify([text.trim(),ids])
   if(submission.current?.fingerprint!==fingerprint)submission.current={fingerprint,key:crypto.randomUUID()}
   await sendMessage(conversation.id,text.trim(),ids,submission.current.key)
   submission.current=undefined
   if(mounted.current){attachments.forEach(a=>URL.revokeObjectURL(a.previewUrl));setText('');setAttachments([]);uploaded.current.clear();setVersion(value=>value+1)}
  }catch(problem){if(mounted.current)setError(problem instanceof Error?problem.message:'Envoi impossible. Votre brouillon est conservé.')}
  finally{if(mounted.current)setSending(false)}
 }
 function drop(event:DragEvent){if(event.dataTransfer.types.includes('Files')){event.preventDefault();const file=event.dataTransfer.files[0];if(file&&!sending)pickFile(file)}}
 return <section className="flex min-h-0 min-w-0 flex-1 flex-col" onDragOver={event=>{if(event.dataTransfer.types.includes('Files'))event.preventDefault()}} onDrop={drop}>
  <header className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
   <span className="lg:hidden"><IconLink to="/messagerie" label="Retour aux conversations" iconPath={backIconPath}/></span>
   <InitialsTile name={conversation.patientName}/><div className="min-w-0 flex-1"><h2 className="truncate font-display font-bold">{conversation.patientName}</h2><p className="text-xs text-muted">Dossier n° {conversation.patientFileNumber}</p></div>
   <ServerCallPanel conversation={conversation.id} name={conversation.patientName} onHistoryLoaded={setCalls}/>
   <IconLink to={`/patients/${conversation.patientId}`} label="Consulter le dossier" iconPath={recordIconPath}/>
  </header>
  <p role="note" className="border-b border-line bg-page px-4 py-2 text-xs text-muted">Ce canal ne remplace pas les urgences. En cas d’urgence, contactez les services d’urgence.</p>
  {state.status==='success'&&state.refreshError&&<p role="alert" className="px-4 text-sm text-danger">Actualisation impossible : {state.refreshError}</p>}
  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-page px-4 py-6 sm:px-6">
   {state.status==='loading'&&<div role="status" className="mt-auto flex flex-col gap-4"><span className="sr-only">Chargement des messages…</span><div aria-hidden="true" className="skeleton h-12 w-2/5 rounded-3xl"/><div aria-hidden="true" className="skeleton h-12 w-1/3 self-end rounded-3xl"/></div>}
   {state.status==='error'&&<Alert variant="error" title="Les messages n’ont pas pu être chargés.">{state.error}</Alert>}
   {state.status==='success'&&!items.length&&<p className="m-auto text-center text-sm text-muted">Aucun message échangé avec ce patient pour le moment.</p>}
   {!!items.length&&<ol className="mt-auto flex flex-col gap-4" aria-live="polite">{items.map((item,index)=><Fragment key={`${item.kind}:${item.id}`}>
    {(index===0||dayKey(items[index-1].at)!==dayKey(item.at))&&<li className="self-center rounded-full bg-surface px-3 py-1 text-xs text-muted">{formatDay(item.at)}</li>}
    {item.kind==='call'?<li ref={index===items.length-1?end:undefined} className="self-center rounded-3xl bg-surface p-3 text-center text-xs text-muted">
      <span className="inline-flex items-center gap-2"><svg className="size-4 text-primary-strong" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={item.call.type==='VIDEO'?videoCallIconPath:audioCallIconPath}/></svg>{item.call.type==='VIDEO'?'Appel vidéo':'Appel audio'} · {item.call.statut}{item.call.dureeSecondes==null?'':` · ${formatCallDuration(item.call.dureeSecondes)}`}</span><p>{formatTime(item.at)}</p><TargetNotes type="APPEL" id={item.id}/>
     </li>:<li ref={index===items.length-1?end:undefined} className={`flex max-w-[80%] flex-col gap-1 ${item.message.author==='professionnel'?'items-end self-end':'items-start self-start'}`}>
      <span className="sr-only">{item.message.author==='professionnel'?'Vous':conversation.patientName}</span>
      <div className={`rounded-3xl px-5 py-3 text-sm whitespace-pre-line shadow-sm ${item.message.author==='professionnel'?'bg-primary-strong text-white':'bg-surface text-ink'}`}>
       {item.message.text&&<p>{item.message.text}</p>}
       {item.message.pieces?.map(piece=><button key={piece.id} type="button" className="mt-2 flex max-w-full items-center gap-2 rounded-2xl bg-black/5 p-3 text-left text-sm" onClick={()=>void downloadPiece(conversation.id,piece).catch(problem=>setError(problem.message))}>
        <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={documentIconPath}/></svg><span className="min-w-0 break-words">{piece.nomOriginal}</span><span className="sr-only">Télécharger</span></button>)}
      </div><p className="px-2 text-xs text-muted">{formatTime(item.at)}{item.message.author==='professionnel'?(item.message.readAt?' · Lu':' · Envoyé'):''}</p><TargetNotes type="MESSAGE" id={item.id}/>
     </li>}
   </Fragment>)}</ol>}
  </div>
  <form onSubmit={event=>void submit(event)} className="flex flex-col gap-3 border-t border-line bg-surface p-4">
   {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
   {!!attachments.length&&<div className="max-h-40 space-y-2 overflow-y-auto">{attachments.map(attachment=><AttachmentPreview key={attachment.source} attachment={attachment} disabled={sending} onRemove={()=>remove(attachment.source)}/>)}</div>}
   <div className="flex items-end gap-1 rounded-4xl border border-control bg-surface py-2 pr-2 pl-2 focus-within:outline-2 focus-within:outline-primary">
    <AttachmentMenu disabled={sending||attachments.length>=5} onPick={pickFile}/>
    <label htmlFor="message-text" className="sr-only">Votre message</label><textarea id="message-text" rows={1} maxLength={MESSAGE_MAX_LENGTH} value={text} disabled={sending}
      onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form?.requestSubmit()}}}
      onPaste={event=>{const file=event.clipboardData.files[0];if(file){event.preventDefault();pickFile(file)}}}
      placeholder="Écrivez votre message…" className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-sm text-ink field-sizing-content placeholder:text-muted focus:outline-none disabled:text-muted"/>
    {text.trim()||attachments.length?<ComposerButton type="submit" label="Envoyer le message" iconPath={sendIconPath} primary busy={sending}/>:<ComposerButton label="Messages vocaux non connectés" iconPath={micIconPath} primary disabled/>}
   </div>
  </form>
 </section>
}
