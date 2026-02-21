"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Resource, ResourceCategory } from "@/lib/types/database"

export async function getResources(category?: string): Promise<Resource[]> {
  const supabase = await createClient()

  let query = supabase
    .from("resources")
    .select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const { data } = await query

  return data ?? []
}

export async function toggleSaveResource(resourceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("saved_resources")
    .select("id")
    .eq("user_id", user.id)
    .eq("resource_id", resourceId)
    .maybeSingle()

  if (existing) {
    await supabase.from("saved_resources").delete().eq("id", existing.id)
    return { saved: false }
  } else {
    await supabase.from("saved_resources").insert({
      user_id: user.id,
      resource_id: resourceId,
    })
    return { saved: true }
  }
}

export async function getSavedResourceIds(): Promise<string[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("saved_resources")
    .select("resource_id")
    .eq("user_id", user.id)

  return data?.map((r) => r.resource_id) ?? []
}

// ── Admin Resource Management ────────────────────────────

async function requireResourceAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    throw new Error("Unauthorized: Admin or moderator role required")
  }

  return { supabase, user, role: profile.role }
}

export interface ResourceInput {
  title: string
  summary: string
  body?: string
  category: ResourceCategory
  tags: string[]
  read_time_minutes: number
  featured: boolean
  icon: string
  external_url?: string
}

export async function createResource(input: ResourceInput) {
  const { supabase } = await requireResourceAdmin()

  const { data, error } = await supabase
    .from("resources")
    .insert({
      title: input.title,
      summary: input.summary,
      body: input.body || "",
      category: input.category,
      tags: input.tags,
      read_time_minutes: input.read_time_minutes,
      featured: input.featured,
      icon: input.icon,
      external_url: input.external_url || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath("/resources")
  revalidatePath("/admin/resources")
  return { success: true, resource: data as Resource }
}

export async function updateResource(
  resourceId: string,
  input: Partial<ResourceInput>
) {
  const { supabase } = await requireResourceAdmin()

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.summary !== undefined) updateData.summary = input.summary
  if (input.body !== undefined) updateData.body = input.body
  if (input.category !== undefined) updateData.category = input.category
  if (input.tags !== undefined) updateData.tags = input.tags
  if (input.read_time_minutes !== undefined)
    updateData.read_time_minutes = input.read_time_minutes
  if (input.featured !== undefined) updateData.featured = input.featured
  if (input.icon !== undefined) updateData.icon = input.icon
  if (input.external_url !== undefined)
    updateData.external_url = input.external_url || null

  const { error } = await supabase
    .from("resources")
    .update(updateData)
    .eq("id", resourceId)

  if (error) return { error: error.message }

  revalidatePath("/resources")
  revalidatePath("/admin/resources")
  return { success: true }
}

export async function deleteResource(resourceId: string) {
  const { supabase, role } = await requireResourceAdmin()

  // Only full admins can delete resources
  if (role !== "admin") {
    return { error: "Only admins can delete resources. Moderators can add and edit." }
  }

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)

  if (error) return { error: error.message }

  revalidatePath("/resources")
  revalidatePath("/admin/resources")
  return { success: true }
}

export async function toggleFeatured(resourceId: string, featured: boolean) {
  const { supabase } = await requireResourceAdmin()

  const { error } = await supabase
    .from("resources")
    .update({ featured })
    .eq("id", resourceId)

  if (error) return { error: error.message }

  revalidatePath("/resources")
  revalidatePath("/admin/resources")
  return { success: true }
}
