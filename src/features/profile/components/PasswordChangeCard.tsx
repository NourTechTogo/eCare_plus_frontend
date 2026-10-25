import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/PasswordField'
import { apiRequest } from '@/lib/apiClient'
import { meetsPasswordRules } from '@/features/auth/passwordRules'
export function PasswordChangeCard(_props:{email?:string}) {
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState('')
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false)
 async function submit(event:FormEvent){
  event.preventDefault();setError('');setSuccess(false)
  if(!current || !meetsPasswordRules(next)){setError('Saisissez le mot de passe actuel et un nouveau mot de passe de 12 caractères minimum, avec une lettre de A à Z, un chiffre et 72 octets maximum.');return}
  if(next!==confirm){setError('Les deux nouveaux mots de passe diffèrent.');return}
  setBusy(true)
  try{await apiRequest<void>('/compte/mot-de-passe',{method:'POST',body:{motDePasseActuel:current,nouveauMotDePasse:next}});setCurrent('');setNext('');setConfirm('');setSuccess(true)}
  catch(e){setError(e instanceof Error?e.message:'Modification impossible.')}
  finally{setBusy(false)}
 }
 return <Card title="Mot de passe"><form onSubmit={e=>void submit(e)} className="flex flex-col gap-4"><fieldset disabled={busy} className="flex flex-col gap-4"><PasswordField label="Mot de passe actuel" required value={current} onChange={e=>setCurrent(e.target.value)} autoComplete="current-password"/><PasswordField label="Nouveau mot de passe" required minLength={12} value={next} onChange={e=>setNext(e.target.value)} autoComplete="new-password"/><PasswordField label="Confirmer le nouveau mot de passe" required value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/></fieldset>{error && <p role="alert" className="text-sm text-danger">{error}</p>}{success && <p role="status" className="text-sm text-success">Mot de passe enregistré.</p>}<Button type="submit" loading={busy}>Enregistrer le mot de passe</Button></form></Card>
}
