import { useParams } from 'react-router'
import { Page } from '@/components/layouts/Page'
import { Alert } from '@/components/ui/Alert'
import { ConversationList } from '@/features/messaging/components/ConversationList'
import { ConversationThread } from '@/features/messaging/components/ConversationThread'
import { useConversations } from '@/features/messaging/hooks/useConversations'
export function MessagingPage() {
 const {conversationId}=useParams()
 const state=useConversations()
 const selected=state.status==='success'?state.data.find(c=>c.id===conversationId):undefined
 return <Page title="Messagerie" description="Échanges avec les patients suivis">
  {state.status==='loading' && <div role="status"><span className="sr-only">Chargement des conversations…</span><div aria-hidden="true" className="skeleton h-[75vh] min-h-112 rounded-3xl"/></div>}
  {state.status==='error' && <Alert variant="error" title="Conversations indisponibles">{state.error}</Alert>}
  {state.status==='success' && state.refreshError && <Alert variant="error" title="Actualisation impossible">{state.refreshError}</Alert>}
  {state.status==='success' && <div className="flex h-[75vh] min-h-112 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm lg:h-[calc(100vh-8rem)]">
   <div className={`min-h-0 w-full flex-col lg:flex lg:w-88 lg:shrink-0 lg:border-r lg:border-line ${conversationId?'hidden':'flex'}`}><ConversationList conversations={state.data}/></div>
   <div className={`min-h-0 min-w-0 flex-1 flex-col lg:flex ${conversationId?'flex':'hidden'}`}>{selected ? <ConversationThread key={selected.id} conversation={selected}/> : <div className="m-auto flex flex-col items-center gap-4 p-6 text-center"><span aria-hidden="true" className="inline-flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-strong"><svg className="size-8" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg></span><p className="text-sm text-muted">{conversationId?"Cette conversation n'existe pas ou n'est plus disponible.":'Sélectionnez une conversation pour afficher les messages.'}</p></div>}</div>
  </div>}
 </Page>
}
