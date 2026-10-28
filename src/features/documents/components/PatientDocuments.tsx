import {controlClassName} from '@/components/ui/styles'
import { useRef, useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAsyncData } from '@/hooks/useAsyncData'
import { documentTypes, downloadDocument, listDocumentView, uploadDocument } from '../services/documentService'

export function PatientDocuments({patientId}:{patientId:string}) {
  return <PatientDocumentsView key={patientId} patientId={patientId}/>
}
function PatientDocumentsView({patientId}:{patientId:string}) {
  const [page,setPage]=useState(0),[revision,setRevision]=useState(0)
  const [reportsOnly,setReportsOnly]=useState(false)
  const [file,setFile]=useState<File>(),[title,setTitle]=useState(''),[type,setType]=useState('ORDONNANCE'),[date,setDate]=useState('')
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const source=useRef(crypto.randomUUID())
  const state=useAsyncData(`documents:${patientId}:${page}:${revision}:${reportsOnly}`,()=>listDocumentView(patientId,page,reportsOnly))
  async function submit(e:FormEvent) {
    e.preventDefault();if(!file||busy)return
    setBusy(true);setError('')
    try {await uploadDocument(patientId,file,title,type,date,source.current);source.current=crypto.randomUUID();setFile(undefined);setTitle('');setRevision(v=>v+1)}
    catch(e){setError(e instanceof Error?e.message:'Dépôt impossible.')}
    finally{setBusy(false)}
  }
  return <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
    <Card title={reportsOnly?'Rapports et comptes rendus':'Documents du patient'} action={<span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-strong">{state.status==='success'?`${state.data.totalElements} document${state.data.totalElements>1?'s':''}`:'…'}</span>}>
      <p className="mb-5 text-sm leading-relaxed text-muted">Les documents privés transmis dans le dossier de votre patient.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Filtrer les documents">
        <Button variant={!reportsOnly?'primary':'soft'} aria-pressed={!reportsOnly} onClick={()=>{setReportsOnly(false);setPage(0);setError('')}}>Tous</Button>
        <Button variant={reportsOnly?'primary':'soft'} aria-pressed={reportsOnly} onClick={()=>{setReportsOnly(true);setPage(0);setError('')}}>Rapports et comptes rendus</Button>
        <Button variant="secondary" onClick={()=>setRevision(v=>v+1)}>Actualiser</Button>
      </div>
      {reportsOnly&&<p className="mb-5 text-sm leading-relaxed text-muted">Les synthèses personnelles restent privées. Seules les copies déposées volontairement dans le carnet et les comptes rendus transmis au dossier apparaissent ici.</p>}
      {error&&<p role="alert" className="mb-4 rounded-2xl bg-danger-soft p-4 text-sm text-danger">{error}</p>}
      {state.status==='loading'&&<p role="status" className="rounded-2xl bg-page p-5 text-sm text-muted">Chargement des documents…</p>}
      {state.status==='error'&&<p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.status==='success'&&<>
        <ul className="flex min-w-0 flex-col gap-3">{state.data.content.map(d=><li key={d.id} className="min-w-0 rounded-2xl border border-line bg-page p-4">
          <div className="flex min-w-0 items-start gap-3"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/></svg></span>
          <div className="min-w-0 flex-1"><h3 className="font-display text-sm font-bold wrap-anywhere">{d.titre}</h3><p className="mt-1 text-xs text-muted">{documentTypes[d.typeDocument as keyof typeof documentTypes]??'Document'} · {new Date(d.dateDocument+'T12:00:00').toLocaleDateString('fr')} · {Math.ceil(d.tailleOctets/1024)} Ko</p></div></div>
          <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={()=>void downloadDocument(patientId,d).catch(e=>setError(e.message))}>Télécharger</Button></div>
        </li>)}</ul>
        {!state.data.totalElements&&<div className="rounded-2xl bg-page px-5 py-10 text-center"><p className="font-semibold">{reportsOnly?'Aucun compte rendu transmis':'Aucun document transmis'}</p><p className="mt-2 text-sm text-muted">{reportsOnly?'Le patient peut déposer une copie de son PDF depuis Mes rapports dans son application.':'Ajoutez un premier document au dossier avec le formulaire.'}</p></div>}
        {state.data.totalPages>1&&<nav aria-label="Pages des documents" className="mt-5 flex flex-wrap items-center justify-between gap-2"><Button variant="soft" disabled={!page} onClick={()=>setPage(p=>p-1)}>Précédent</Button><span className="text-xs text-muted">Page {page+1} / {state.data.totalPages}</span><Button variant="soft" disabled={page+1>=state.data.totalPages} onClick={()=>setPage(p=>p+1)}>Suivant</Button></nav>}
      </>}
    </Card>
    <Card title="Ajouter un document"><form onSubmit={e=>void submit(e)} className="flex min-w-0 flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted">PDF, JPG ou PNG · 5 Mo maximum par fichier.</p>
      <label className="flex min-w-0 flex-col gap-3 rounded-2xl border border-dashed border-line bg-page p-4 text-sm font-semibold text-ink">Fichier<input className="block w-full min-w-0 max-w-full text-xs font-normal text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-primary-soft file:px-3 file:py-3 file:font-semibold file:text-primary-strong" type="file" required accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]);source.current=crypto.randomUUID()}}/></label>
      <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Titre<input className={controlClassName(false)} placeholder="Ex. Bilan de consultation" value={title} required maxLength={200} disabled={busy} onChange={e=>{setTitle(e.target.value);source.current=crypto.randomUUID()}}/></label>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Type<select className={controlClassName(false)} value={type} disabled={busy} onChange={e=>{setType(e.target.value);source.current=crypto.randomUUID()}}>{Object.entries(documentTypes).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Date du document<input className={controlClassName(false)} type="date" value={date} required disabled={busy} onChange={e=>{setDate(e.target.value);source.current=crypto.randomUUID()}}/></label>
      </div>
      <div className="border-t border-line pt-5"><Button type="submit" loading={busy} disabled={busy||!file}>Transmettre au dossier</Button></div>
    </form></Card>
  </div>
}
