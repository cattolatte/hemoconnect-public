import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/actions/notifications"
import type { BadgeType } from "@/lib/types/database"

async function awardBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
  const supabase = await createClient()

  // Check if already earned
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_type", badgeType)
    .maybeSingle()

  if (existing) return false

  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_type: badgeType,
  })

  if (error) return false

  // Notify user about the badge
  await createNotification({
    userId,
    actorId: userId,
    type: "badge_earned",
    badgeType,
    message: `You earned the "${badgeType.replace(/_/g, " ")}" badge!`,
  })

  return true
}

// ── Guiding Light: user has a comment with 10+ likes ──────

export async function checkGuidingLight(commentAuthorId: string): Promise<void> {
  const supabase = await createClient()

  // Get all comments by this user
  const { data: comments } = await supabase
    .from("forum_comments")
    .select("id")
    .eq("user_id", commentAuthorId)

  if (!comments || comments.length === 0) return

  const commentIds = comments.map((c) => c.id)

  // Count likes per comment
  const { data: likes } = await supabase
    .from("forum_likes")
    .select("comment_id")
    .in("comment_id", commentIds)

  if (!likes) return

  // Check if any comment has 10+ likes
  const likeCounts = new Map<string, number>()
  for (const like of likes) {
    if (like.comment_id) {
      likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) || 0) + 1)
    }
  }

  const hasQualifying = Array.from(likeCounts.values()).some((count) => count >= 10)
  if (hasQualifying) {
    await awardBadge(commentAuthorId, "guiding_light")
  }
}

// ── Connector: user has chatted with 3+ matched peers ─────

export async function checkConnector(userId: string): Promise<void> {
  const supabase = await createClient()

  // Get user's connections
  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "connected")

  if (!connections || connections.length < 3) return

  const connectedUserIds = connections.map((c) =>
    c.requester_id === userId ? c.receiver_id : c.requester_id
  )

  // Check if user has conversations with at least 3 connected peers
  const { data: conversations } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)

  if (!conversations) return

  const chatPartnerIds = conversations.map((c) =>
    c.participant_1 === userId ? c.participant_2 : c.participant_1
  )

  const connectedChats = chatPartnerIds.filter((id) => connectedUserIds.includes(id))

  if (connectedChats.length >= 3) {
    await awardBadge(userId, "connector")
  }
}

// ── First Post: user published their first forum post ─────

export async function checkFirstPost(userId: string): Promise<void> {
  await awardBadge(userId, "first_post")
}

// ── Active Member: user has 10+ forum posts ───────────────

export async function checkActiveMember(userId: string): Promise<void> {
  const supabase = await createClient()

  const { count } = await supabase
    .from("forum_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("moderation_status", "approved")

  if (count && count >= 10) {
    await awardBadge(userId, "active_member")
  }
}

// ── Community Builder: user joined 3+ micro-communities ───

export async function checkCommunityBuilder(userId: string): Promise<void> {
  const supabase = await createClient()

  const { count } = await supabase
    .from("micro_community_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (count && count >= 3) {
    await awardBadge(userId, "community_builder")
  }
}

// ── Get badges for a user ─────────────────────────────────

export async function getUserBadges(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })

  return data ?? []
}
