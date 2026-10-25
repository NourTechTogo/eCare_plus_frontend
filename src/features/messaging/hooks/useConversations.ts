import { listConversations } from '@/features/messaging/services/messagingService'
import { useAsyncData } from '@/hooks/useAsyncData'

export function useConversations() {
  return useAsyncData('conversations', listConversations, 5000)
}
