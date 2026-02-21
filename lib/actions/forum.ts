"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ForumPostWithAuthor, ForumCommentWithAuthor, ForumSearchResult, SearchMethod } from "@/lib/types/database"
import {
  generateEmbedding,
  generatePostEmbeddingText,
  checkToxicity,
  classifyTopics,
  summarizeThread,
  composeThreadText,
} from "@/services/huggingface"
import { INTEREST_TOPICS } from "@/lib/types/database"
import { createNotification } from "@/lib/actions/notifications"
import { getSubscribers } from "@/lib/actions/social"
import { checkFirstPost, checkActiveMember, checkGuidingLight } from "@/services/badges"
import { postLimiter, commentLimiter } from "@/lib/rate-limit"

export async function getPosts(options?: {
  tag?: string
  sort?: "recent" | "trending"
  search?: string
}): Promise<ForumPostWithAuthor[]> {
  const supabase = await createClient()

  let query = supabase
    .from("forum_posts")
    .select("*, author:profiles!user_id(id, first_name, last_name)")
    .eq("moderation_status", "approved")

  if (options?.tag && options.tag !== "all") {
    query = query.contains("tags", [options.tag])
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,body.ilike.%${options.search}%`)
  }

  if (options?.sort === "trending") {
    query = query.eq("is_hot", true)
  }

  query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false })

  const { data: posts } = await query.limit(20)

  if (!posts || posts.length === 0) return []

  const postIds = posts.map((p) => p.id)

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

// ── Semantic Search ─────────────────────────────────────

export async function searchPostsSemantic(
  query: string
): Promise<{ posts: ForumSearchResult[]; searchMethod: SearchMethod }> {
  const supabase = await createClient()

  // Try semantic search first
  const queryEmbedding = await generateEmbedding(query)

  if (queryEmbedding) {
    // Call the pgvector RPC function
    const { data: matches, error } = await supabase.rpc("match_forum_posts", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 20,
      similarity_threshold: 0.3,
    })

    if (!error && matches && matches.length > 0) {
      // Fetch full post data with authors for matched IDs
      const matchedIds = matches.map((m: { id: string }) => m.id)
      const similarityMap = new Map(
        matches.map((m: { id: string; similarity: number }) => [m.id, m.similarity])
      )

      const { data: posts } = await supabase
        .from("forum_posts")
        .select("*, author:profiles!user_id(id, first_name, last_name)")
        .in("id", matchedIds)
        .eq("moderation_status", "approved")

      if (posts && posts.length > 0) {
        const postIds = posts.map((p) => p.id)
        const [{ data: likeCounts }, { data: commentCounts }] = await Promise.all([
          supabase.from("forum_likes").select("post_id").in("post_id", postIds),
          supabase.from("forum_comments").select("post_id").in("post_id", postIds),
        ])

        const results: ForumSearchResult[] = posts
          .map((post) => ({
            ...post,
            author: Array.isArray(post.author) ? post.author[0] : post.author,
            like_count: likeCounts?.filter((l) => l.post_id === post.id).length ?? 0,
            comment_count: commentCounts?.filter((c) => c.post_id === post.id).length ?? 0,
            similarity: similarityMap.get(post.id) ?? 0,
            search_method: "semantic" as const,
          }))
          .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))

        return { posts: results, searchMethod: "semantic" }
      }
    }
  }

  // Fall back to keyword search
  const keywordResults = await getPosts({ search: query })
  const results: ForumSearchResult[] = keywordResults.map((post) => ({
    ...post,
    search_method: "keyword" as const,
  }))

  return { posts: results, searchMethod: "keyword" }
}

// ── Post Detail ─────────────────────────────────────────

export async function getPostById(postId: string) {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("forum_posts")
    .select("*, author:profiles!user_id(id, first_name, last_name)")
    .eq("id", postId)
    .single()

  if (!post) return null

  // Increment view count (fire and forget)
  supabase
    .from("forum_posts")
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq("id", postId)
    .then()

  const [{ data: likes }, { data: comments }, { data: currentUserLike }] = await Promise.all([
    supabase.from("forum_likes").select("id").eq("post_id", postId).is("comment_id", null),
    supabase
      .from("forum_comments")
      .select("*, author:profiles!user_id(id, first_name, last_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
    supabase
      .from("forum_likes")
      .select("id")
      .eq("post_id", postId)
      .is("comment_id", null)
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle(),
  ])

  // Get like counts for each comment
  const commentIds = (comments || []).map((c) => c.id)
  const { data: commentLikes } = commentIds.length
    ? await supabase.from("forum_likes").select("comment_id").in("comment_id", commentIds)
    : { data: [] }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: userCommentLikes } = user && commentIds.length
    ? await supabase
        .from("forum_likes")
        .select("comment_id")
        .in("comment_id", commentIds)
        .eq("user_id", user.id)
    : { data: [] }

  const enrichedComments: (ForumCommentWithAuthor & { user_liked: boolean })[] = (comments || []).map((comment) => ({
    ...comment,
    author: Array.isArray(comment.author) ? comment.author[0] : comment.author,
    like_count: commentLikes?.filter((l) => l.comment_id === comment.id).length ?? 0,
    user_liked: userCommentLikes?.some((l) => l.comment_id === comment.id) ?? false,
  }))

  return {
    ...post,
    author: Array.isArray(post.author) ? post.author[0] : post.author,
    like_count: likes?.length ?? 0,
    comment_count: comments?.length ?? 0,
    user_liked: !!currentUserLike,
    comments: enrichedComments,
  }
}

// ── Create Post (with moderation + embedding) ───────────

export async function createPost(values: { title: string; body: string; tags: string[] }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { success: rateLimitOk } = postLimiter.check(user.id)
  if (!rateLimitOk) return { error: "Too many posts. Please wait a moment and try again." }

  const excerpt = values.body.substring(0, 200) + (values.body.length > 200 ? "..." : "")

  // Content moderation — check toxicity before insert
  let moderationStatus: "approved" | "flagged" = "approved"
  const toxicityResult = await checkToxicity(`${values.title} ${values.body}`)
  if (toxicityResult?.isToxic) {
    moderationStatus = "flagged"
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      user_id: user.id,
      title: values.title,
      body: values.body,
      excerpt,
      tags: values.tags,
      moderation_status: moderationStatus,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Badge checks (fire-and-forget)
  ;(async () => {
    await checkFirstPost(user.id)
    await checkActiveMember(user.id)
  })().catch(() => {})

  // Generate embedding (fire-and-forget — don't block response)
  const embeddingText = generatePostEmbeddingText({ title: values.title, body: values.body })
  generateEmbedding(embeddingText).then(async (embedding) => {
    if (embedding) {
      const supabaseForEmbed = await createClient()
      await supabaseForEmbed
        .from("forum_posts")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", data.id)
    }
  }).catch((err) => {
    console.error("[HemoConnect AI] Post embedding failed:", err)
  })

  // Auto-tag with zero-shot classification (fire-and-forget)
  const classificationText = `${values.title}. ${values.body}`.slice(0, 500)
  classifyTopics(classificationText, INTEREST_TOPICS).then(async (results) => {
    if (results && results.length > 0) {
      const autoTags = results.map((r) => r.label)
      const supabaseForTags = await createClient()
      await supabaseForTags
        .from("forum_posts")
        .update({ auto_tags: autoTags })
        .eq("id", data.id)
    }
  }).catch((err) => {
    console.error("[HemoConnect AI] Post auto-tagging failed:", err)
  })

  revalidatePath("/forum")
  return { id: data.id, flagged: moderationStatus === "flagged" }
}

// ── Create Comment (with moderation) ────────────────────

export async function createComment(postId: string, body: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { success: rateLimitOk } = commentLimiter.check(user.id)
  if (!rateLimitOk) return { error: "Too many comments. Please wait a moment." }

  // Content moderation — check toxicity before insert
  const toxicityResult = await checkToxicity(body)
  if (toxicityResult?.isToxic) {
    return { error: "Your comment was flagged for review. Please revise it and try again." }
  }

  const { error } = await supabase.from("forum_comments").insert({
    post_id: postId,
    user_id: user.id,
    body,
  })

  if (error) return { error: error.message }

  // Generate or refresh AI summary (fire-and-forget)
  generateOrRefreshSummary(postId).catch((err) => {
    console.error("[HemoConnect AI] Summary generation failed:", err)
  })

  // Notify post author + thread subscribers (fire-and-forget)
  const notifyPostAuthorAndSubscribers = async () => {
    const supabaseForNotify = await createClient()
    const { data: post } = await supabaseForNotify
      .from("forum_posts")
      .select("user_id")
      .eq("id", postId)
      .single()
    if (!post) return

    // Notify post author
    await createNotification({
      userId: post.user_id,
      actorId: user.id,
      type: "new_comment",
      postId,
    })

    // Notify subscribers (except post author and commenter)
    const subscribers = await getSubscribers(postId)
    for (const subscriberId of subscribers) {
      if (subscriberId !== user.id && subscriberId !== post.user_id) {
        await createNotification({
          userId: subscriberId,
          actorId: user.id,
          type: "thread_reply",
          postId,
        })
      }
    }
  }
  notifyPostAuthorAndSubscribers().catch((err) => {
    console.error("[HemoConnect] Comment notification failed:", err)
  })

  revalidatePath(`/forum/${postId}`)
  return { success: true }
}

// ── Likes ───────────────────────────────────────────────

export async function togglePostLike(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("forum_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .is("comment_id", null)
    .maybeSingle()

  if (existing) {
    await supabase.from("forum_likes").delete().eq("id", existing.id)
  } else {
    await supabase.from("forum_likes").insert({
      user_id: user.id,
      post_id: postId,
    })

    // Notify post author (fire-and-forget)
    ;(async () => {
      const { data: post } = await supabase
        .from("forum_posts")
        .select("user_id")
        .eq("id", postId)
        .single()
      if (post) {
        await createNotification({
          userId: post.user_id,
          actorId: user.id,
          type: "post_liked",
          postId,
        })
      }
    })().catch(() => {})
  }

  revalidatePath(`/forum/${postId}`)
  return { liked: !existing }
}

export async function toggleCommentLike(commentId: string, postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("forum_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .is("post_id", null)
    .maybeSingle()

  if (existing) {
    await supabase.from("forum_likes").delete().eq("id", existing.id)
  } else {
    await supabase.from("forum_likes").insert({
      user_id: user.id,
      comment_id: commentId,
    })

    // Notify comment author + badge check (fire-and-forget)
    ;(async () => {
      const { data: comment } = await supabase
        .from("forum_comments")
        .select("user_id")
        .eq("id", commentId)
        .single()
      if (comment) {
        await createNotification({
          userId: comment.user_id,
          actorId: user.id,
          type: "comment_liked",
          postId,
          commentId,
        })
        // Check if the comment author now qualifies for "Guiding Light" badge
        await checkGuidingLight(comment.user_id)
      }
    })().catch(() => {})
  }

  revalidatePath(`/forum/${postId}`)
  return { liked: !existing }
}

// ── AI Summary (Knowledge Distiller) ─────────────────────

const MIN_COMMENTS_FOR_SUMMARY = 3
const SUMMARY_STALE_MS = 60 * 60 * 1000 // 1 hour

async function generateOrRefreshSummary(postId: string): Promise<void> {
  const supabase = await createClient()

  // Fetch post to check threshold and get content
  const { data: post } = await supabase
    .from("forum_posts")
    .select("id, title, body, ai_summary, ai_summary_updated_at")
    .eq("id", postId)
    .single()

  if (!post) return

  const { data: comments } = await supabase
    .from("forum_comments")
    .select("body")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (!comments || comments.length < MIN_COMMENTS_FOR_SUMMARY) return

  // Check staleness — skip if summary was generated recently
  if (post.ai_summary && post.ai_summary_updated_at) {
    const lastUpdated = new Date(post.ai_summary_updated_at).getTime()
    if (Date.now() - lastUpdated < SUMMARY_STALE_MS) return
  }

  // Compose thread text and generate summary
  const threadText = composeThreadText(
    { title: post.title, body: post.body },
    comments.map((c: { body: string }) => c.body)
  )

  const summary = await summarizeThread(threadText)
  if (!summary) return

  await supabase
    .from("forum_posts")
    .update({
      ai_summary: summary,
      ai_summary_updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
}

export async function regenerateSummary(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Clear timestamp to force refresh
  await supabase
    .from("forum_posts")
    .update({ ai_summary_updated_at: null })
    .eq("id", postId)

  await generateOrRefreshSummary(postId)

  revalidatePath(`/forum/${postId}`)
  return { success: true }
}
