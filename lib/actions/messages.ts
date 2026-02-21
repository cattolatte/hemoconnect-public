"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ConversationWithDetails, Message } from "@/lib/types/database"
import { checkConnector } from "@/services/badges"
import { messageLimiter } from "@/lib/rate-limit"

export async function getConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("updated_at", { ascending: false })

  if (!conversations || conversations.length === 0) return []

  const otherUserIds = conversations.map((c) =>
    c.participant_1 === user.id ? c.participant_2 : c.participant_1
  )

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", otherUserIds)

  const results: ConversationWithDetails[] = await Promise.all(
    conversations.map(async (conv) => {
      const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1
      const otherUser = profiles?.find((p) => p.id === otherId) ?? {
        id: otherId,
        first_name: "Unknown",
        last_name: "",
      }

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("read_at", null)

      return {
        ...conv,
        other_user: otherUser,
        last_message: lastMsg,
        unread_count: unreadCount ?? 0,
      }
    })
  )

  return results
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { success: rateLimitOk } = messageLimiter.check(user.id)
  if (!rateLimitOk) return { error: "Too many messages. Please wait a moment." }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  })

  if (error) return { error: error.message }

  // Update conversation's updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)

  // Check "Connector" badge (fire-and-forget)
  checkConnector(user.id).catch(() => {})

  revalidatePath("/messages")
  return { success: true }
}

export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null)
}

export async function startConversation(otherUserId: string) {
  const supabase = await createClient()

  const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
    other_user_id: otherUserId,
  })

  if (error) return { error: error.message }

  return { conversationId: convId }
}
