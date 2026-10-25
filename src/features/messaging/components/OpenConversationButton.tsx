import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { openConversation } from '@/features/messaging/services/messagingService'
export function OpenConversationButton({patientId}:{patientId:string}) {
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const navigate=useNavigate()
 async function open() {setBusy(true);setError('');try{const c=await openConversation(patientId);await navigate(`/messagerie/${c.id}`)}catch(e){setError(e instanceof Error ? e.message : 'Conversation indisponible.');setBusy(false)}}
 return <div className="flex flex-col gap-2"><Button variant="secondary" loading={busy} onClick={()=>void open()}>Contacter le patient</Button>{error && <p role="alert" className="text-sm text-danger">{error}</p>}</div>
}
