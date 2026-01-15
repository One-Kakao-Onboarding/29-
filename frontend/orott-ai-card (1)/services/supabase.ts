/**
 * Supabase Client for Realtime subscriptions
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase client singleton
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }
  return supabaseClient
}

export interface RealtimeChatMessage {
  id: string
  user_id: string
  chat_room_id: string
  message_content: string
  sender_type: 'user' | 'ai'
  sent_at: string
  created_at: string
}

/**
 * Subscribe to real-time chat messages
 * @param chatRoomId - The chat room to subscribe to (optional, null for all rooms)
 * @param onMessage - Callback when a new message is received
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToChatMessages(
  chatRoomId: string | null,
  onMessage: (message: RealtimeChatMessage) => void
): () => void {
  const client = getSupabaseClient()
  if (!client) {
    console.warn('Supabase client not initialized')
    return () => {}
  }

  // Create a unique channel name
  const channelName = chatRoomId
    ? `chat-room-${chatRoomId}`
    : 'chat-global'

  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_logs',
        ...(chatRoomId ? { filter: `chat_room_id=eq.${chatRoomId}` } : {}),
      },
      (payload) => {
        const newMessage = payload.new as RealtimeChatMessage
        onMessage(newMessage)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime: Subscribed to ${channelName}`)
      }
    })

  // Return cleanup function
  return () => {
    client.removeChannel(channel)
  }
}

/**
 * Subscribe to ALL chat messages (global feed)
 * @param onMessage - Callback when a new message is received
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToGlobalChat(
  onMessage: (message: RealtimeChatMessage) => void
): () => void {
  return subscribeToChatMessages(null, onMessage)
}
