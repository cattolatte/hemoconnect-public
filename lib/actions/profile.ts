"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { Profile, ProfileWithStats } from "@/lib/types/database"
import type { ProfileSetupValues } from "@/lib/validations/profile"
import {
  generateEmbedding,
  generateProfileEmbeddingText,
} from "@/services/huggingface"
import { autoJoinCommunities } from "@/lib/actions/communities"

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return data
}

export async function getProfileById(userId: string): Promise<ProfileWithStats | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (!profile) return null

  const [{ count: postCount }, { count: connectionCount }] = await Promise.all([
    supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "connected"),
  ])

  return {
    ...profile,
    post_count: postCount ?? 0,
    connection_count: connectionCount ?? 0,
  }
}

export async function saveProfile(values: ProfileSetupValues) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({
      ...values,
      profile_setup_complete: true,
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  // Auto-join micro-communities based on selected topics (fire-and-forget)
  if (values.topics && values.topics.length > 0) {
    autoJoinCommunities(user.id, values.topics).catch((err) => {
      console.error("[HemoConnect] Auto-join communities failed:", err)
    })
  }

  // Generate AI embedding (fire-and-forget — don't block redirect)
  const embeddingText = generateProfileEmbeddingText(values)
  generateEmbedding(embeddingText).then(async (embedding) => {
    if (embedding) {
      const supabaseForEmbed = await createClient()
      await supabaseForEmbed
        .from("profiles")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", user.id)
    }
  }).catch((err) => {
    console.error("[HemoConnect AI] Profile embedding failed:", err)
  })

  redirect("/dashboard")
}

export interface ProfileUpdateInput {
  first_name?: string
  last_name?: string
  bio?: string
  location?: string
  hemophilia_type?: string
  severity_level?: string
  current_treatment?: string
  life_stage?: string
  age_range?: string
  topics?: string[]
}

export async function updateProfile(input: ProfileUpdateInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const updateData: Record<string, unknown> = {}
  if (input.first_name !== undefined) updateData.first_name = input.first_name
  if (input.last_name !== undefined) updateData.last_name = input.last_name
  if (input.bio !== undefined) updateData.bio = input.bio || null
  if (input.location !== undefined) updateData.location = input.location || null
  if (input.hemophilia_type !== undefined) updateData.hemophilia_type = input.hemophilia_type
  if (input.severity_level !== undefined) updateData.severity_level = input.severity_level
  if (input.current_treatment !== undefined) updateData.current_treatment = input.current_treatment
  if (input.life_stage !== undefined) updateData.life_stage = input.life_stage
  if (input.age_range !== undefined) updateData.age_range = input.age_range
  if (input.topics !== undefined) updateData.topics = input.topics

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}

export async function getRecentPostsByUser(userId: string) {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("forum_posts")
    .select("id, title, tags, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3)

  if (!posts || posts.length === 0) return []

  const postIds = posts.map((p) => p.id)

  const [{ data: likeCounts }, { data: commentCounts }] = await Promise.all([
    supabase
      .from("forum_likes")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("forum_comments")
      .select("post_id")
      .in("post_id", postIds),
  ])

  return posts.map((post) => ({
    ...post,
    like_count: likeCounts?.filter((l) => l.post_id === post.id).length ?? 0,
    comment_count: commentCounts?.filter((c) => c.post_id === post.id).length ?? 0,
  }))
}
