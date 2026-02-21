"use server"

import { createClient } from "@/lib/supabase/server"
import { calculateRuleScore, calculateHybridScore } from "@/services/matching"

export interface DashboardStats {
  peerMatches: number
  unreadMessages: number
  forumPosts: number
  savedResources: number
}

export interface DashboardActivity {
  id: string
  title: string
  authorName: string
  commentCount: number
  createdAt: string
  tags: string[]
}

export interface SuggestedPeer {
  id: string
  first_name: string
  last_name: string
  hemophilia_type: string | null
  severity_level: string | null
  topics: string[]
  matchScore: number
  matchMethod: "hybrid" | "rule-based"
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { peerMatches: 0, unreadMessages: 0, forumPosts: 0, savedResources: 0 }
  }

  const [
    { count: peerMatches },
    { count: forumPosts },
    { count: savedResources },
  ] = await Promise.all([
    supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("saved_resources")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  // Count unread messages across all conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)

  let unreadMessages = 0
  if (conversations && conversations.length > 0) {
    const convIds = conversations.map((c) => c.id)
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .neq("sender_id", user.id)
      .is("read_at", null)
    unreadMessages = count ?? 0
  }

  return {
    peerMatches: peerMatches ?? 0,
    unreadMessages,
    forumPosts: forumPosts ?? 0,
    savedResources: savedResources ?? 0,
  }
}

export async function getRecentActivity(): Promise<DashboardActivity[]> {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("forum_posts")
    .select("id, title, tags, created_at, user_id, author:profiles!user_id(first_name, last_name)")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(3)

  if (!posts || posts.length === 0) return []

  const postIds = posts.map((p) => p.id)
  const { data: commentCounts } = await supabase
    .from("forum_comments")
    .select("post_id")
    .in("post_id", postIds)

  return posts.map((post) => {
    const author = Array.isArray(post.author) ? post.author[0] : post.author
    return {
      id: post.id,
      title: post.title,
      authorName: author
        ? `${author.first_name} ${author.last_name}`.trim()
        : "Unknown",
      commentCount: commentCounts?.filter((c) => c.post_id === post.id).length ?? 0,
      createdAt: post.created_at,
      tags: post.tags,
    }
  })
}

export async function getSuggestedPeers(): Promise<SuggestedPeer[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Get current user's profile (including embedding for AI matching)
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("hemophilia_type, severity_level, topics, embedding")
    .eq("id", user.id)
    .single()

  if (!myProfile) return []

  // ── Try AI-powered matching first ──────────────────────

  if (myProfile.embedding) {
    try {
      const { data: aiMatches, error } = await supabase.rpc("match_profiles", {
        query_embedding: myProfile.embedding,
        match_count: 10,
        exclude_user_id: user.id,
      })

      if (!error && aiMatches && aiMatches.length > 0) {
        const scored: SuggestedPeer[] = aiMatches.map(
          (match: {
            id: string
            first_name: string
            last_name: string
            hemophilia_type: string | null
            severity_level: string | null
            topics: string[]
            similarity: number
          }) => {
            const ruleScore = calculateRuleScore(myProfile, match)
            const hybridScore = calculateHybridScore(ruleScore, match.similarity)
            return {
              id: match.id,
              first_name: match.first_name,
              last_name: match.last_name,
              hemophilia_type: match.hemophilia_type,
              severity_level: match.severity_level,
              topics: match.topics ?? [],
              matchScore: hybridScore,
              matchMethod: "hybrid" as const,
            }
          }
        )

        return scored
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3)
      }
    } catch (err) {
      console.error("[HemoConnect AI] Vector matching failed, falling back to rule-based:", err)
    }
  }

  // ── Fall back to rule-based matching ───────────────────

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, hemophilia_type, severity_level, topics")
    .neq("id", user.id)
    .eq("profile_visible", true)
    .eq("peer_matching_enabled", true)
    .limit(10)

  if (!profiles || profiles.length === 0) return []

  const scored: SuggestedPeer[] = profiles.map((p) => {
    const matchScore = calculateRuleScore(myProfile, p)
    return {
      ...p,
      topics: p.topics ?? [],
      matchScore,
      matchMethod: "rule-based" as const,
    }
  })

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
}
