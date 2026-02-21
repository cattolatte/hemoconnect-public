"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { NotificationWithActor, NotificationType, BadgeType } from "@/lib/types/database"

export async function getNotifications(limit = 20): Promise<NotificationWithActor[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("notifications")
    .select("*, actor:profiles!actor_id(id, first_name, last_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((n) => ({
    ...n,
    actor: Array.isArray(n.actor) ? n.actor[0] : n.actor,
  }))
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 0

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  return count ?? 0
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  revalidatePath("/")
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)

  revalidatePath("/")
  return { success: true }
}

// ── Internal helper: create a notification ───────────────
// Called from other server actions (forum.ts, social.ts, etc.)

export async function createNotification(data: {
  userId: string
  actorId: string
  type: NotificationType
  postId?: string
  commentId?: string
  badgeType?: BadgeType
  message?: string
}) {
  // Don't notify yourself
  if (data.userId === data.actorId) return

  const supabase = await createClient()

  await supabase.from("notifications").insert({
    user_id: data.userId,
    actor_id: data.actorId,
    type: data.type,
    post_id: data.postId || null,
    comment_id: data.commentId || null,
    badge_type: data.badgeType || null,
    message: data.message || null,
  })
}
