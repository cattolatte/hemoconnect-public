"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { MicroCommunityWithMembership, MicroCommunity } from "@/lib/types/database"
import { checkCommunityBuilder } from "@/services/badges"

export async function getCommunities(): Promise<MicroCommunityWithMembership[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: communities } = await supabase
    .from("micro_communities")
    .select("*")
    .order("member_count", { ascending: false })

  if (!communities) return []

  if (!user) {
    return communities.map((c) => ({ ...c, is_member: false }))
  }

  const { data: memberships } = await supabase
    .from("micro_community_members")
    .select("community_id")
    .eq("user_id", user.id)

  const memberCommunityIds = new Set((memberships ?? []).map((m) => m.community_id))

  return communities.map((c) => ({
    ...c,
    is_member: memberCommunityIds.has(c.id),
  }))
}

export async function getCommunityById(communityId: string): Promise<MicroCommunity | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("micro_communities")
    .select("*")
    .eq("id", communityId)
    .single()

  return data
}

export async function getCommunityMembers(communityId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("micro_community_members")
    .select("user_id, joined_at, profile:profiles!user_id(id, first_name, last_name, hemophilia_type, severity_level)")
    .eq("community_id", communityId)
    .order("joined_at", { ascending: false })
    .limit(20)

  if (!data) return []

  return data.map((m) => ({
    ...m,
    profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
  }))
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("micro_community_members").insert({
    community_id: communityId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === "23505") return { error: "Already a member" }
    return { error: error.message }
  }

  // Increment member count (synchronous — must complete before returning)
  const { data: community } = await supabase
    .from("micro_communities")
    .select("member_count")
    .eq("id", communityId)
    .single()

  if (community) {
    await supabase
      .from("micro_communities")
      .update({ member_count: (community.member_count || 0) + 1 })
      .eq("id", communityId)
  }

  // Check "Community Builder" badge (fire-and-forget)
  checkCommunityBuilder(user.id).catch(() => {})

  revalidatePath("/communities")
  return { success: true }
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  await supabase
    .from("micro_community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id)

  // Decrement member count
  const { data: community } = await supabase
    .from("micro_communities")
    .select("member_count")
    .eq("id", communityId)
    .single()

  if (community) {
    await supabase
      .from("micro_communities")
      .update({ member_count: Math.max(0, (community.member_count || 0) - 1) })
      .eq("id", communityId)
  }

  revalidatePath("/communities")
  return { success: true }
}

export async function autoJoinCommunities(userId: string, topics: string[]) {
  const supabase = await createClient()

  // Find communities matching user's topics
  const { data: communities } = await supabase
    .from("micro_communities")
    .select("id, tag")
    .in("tag", topics)

  if (!communities || communities.length === 0) return

  for (const community of communities) {
    // Check if already a member
    const { data: existing } = await supabase
      .from("micro_community_members")
      .select("id")
      .eq("community_id", community.id)
      .eq("user_id", userId)
      .maybeSingle()

    if (!existing) {
      await supabase.from("micro_community_members").insert({
        community_id: community.id,
        user_id: userId,
      })

      // Increment member count
      const { data: current } = await supabase
        .from("micro_communities")
        .select("member_count")
        .eq("id", community.id)
        .single()

      if (current) {
        await supabase
          .from("micro_communities")
          .update({ member_count: (current.member_count || 0) + 1 })
          .eq("id", community.id)
      }
    }
  }
}
