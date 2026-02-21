"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/actions/notifications"
import { reportLimiter } from "@/lib/rate-limit"
import type { ForumPostWithAuthor, ReportReason } from "@/lib/types/database"

// ── Follows ──────────────────────────────────────────────

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }
  if (user.id === targetUserId) return { error: "Cannot follow yourself" }

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle()

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id)
    revalidatePath(`/profile/${targetUserId}`)
    return { following: false }
  } else {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    })

    // Notify the followed user (fire-and-forget)
    createNotification({
      userId: targetUserId,
      actorId: user.id,
      type: "new_follower",
    }).catch(() => {})

    revalidatePath(`/profile/${targetUserId}`)
    return { following: true }
  }
}

export async function isFollowing(targetUserId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle()

  return !!data
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId)
  return count ?? 0
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId)
  return count ?? 0
}

// ── Bookmarks ────────────────────────────────────────────

export async function toggleBookmark(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle()

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id)
    revalidatePath("/forum")
    return { bookmarked: false }
  } else {
    await supabase.from("bookmarks").insert({
      user_id: user.id,
      post_id: postId,
    })
    revalidatePath("/forum")
    return { bookmarked: true }
  }
}

export async function isBookmarked(postId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle()

  return !!data
}

export async function getBookmarkedPosts(): Promise<ForumPostWithAuthor[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (!bookmarks || bookmarks.length === 0) return []

  const postIds = bookmarks.map((b) => b.post_id)

  const { data: posts } = await supabase
    .from("forum_posts")
    .select("*, author:profiles!user_id(id, first_name, last_name)")
    .in("id", postIds)
    .eq("moderation_status", "approved")

  if (!posts || posts.length === 0) return []

  const [{ data: likeCounts }, { data: commentCounts }] = await Promise.all([
    supabase.from("forum_likes").select("post_id").in("post_id", postIds),
    supabase.from("forum_comments").select("post_id").in("post_id", postIds),
  ])

  return posts.map((post) => ({
    ...post,
    author: Array.isArray(post.author) ? post.author[0] : post.author,
    like_count: likeCounts?.filter((l) => l.post_id === post.id).length ?? 0,
    comment_count: commentCounts?.filter((c) => c.post_id === post.id).length ?? 0,
  }))
}

// ── Thread Subscriptions ─────────────────────────────────

export async function toggleSubscription(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("post_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle()

  if (existing) {
    await supabase.from("post_subscriptions").delete().eq("id", existing.id)
    return { subscribed: false }
  } else {
    await supabase.from("post_subscriptions").insert({
      user_id: user.id,
      post_id: postId,
    })
    return { subscribed: true }
  }
}

export async function isSubscribed(postId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from("post_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle()

  return !!data
}

export async function getSubscribers(postId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("post_subscriptions")
    .select("user_id")
    .eq("post_id", postId)

  return (data ?? []).map((s) => s.user_id)
}

// ── Report Content ───────────────────────────────────────

export async function reportContent(data: {
  postId?: string
  commentId?: string
  reason: ReportReason
  description?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }
  if (!data.postId && !data.commentId) return { error: "Must specify content to report" }

  const { success: rateLimitOk } = reportLimiter.check(user.id)
  if (!rateLimitOk) return { error: "Too many reports. Please wait a few minutes." }

  const { error } = await supabase.from("reported_content").insert({
    reporter_id: user.id,
    post_id: data.postId || null,
    comment_id: data.commentId || null,
    reason: data.reason,
    description: data.description || null,
  })

  if (error) return { error: error.message }

  return { success: true }
}

// ── User Search (for @mentions) ──────────────────────────

export async function searchUsers(query: string): Promise<
  Array<{ id: string; first_name: string; last_name: string }>
> {
  if (!query || query.length < 2) return []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .neq("id", user.id)
    .eq("profile_visible", true)
    .limit(5)

  return data ?? []
}
