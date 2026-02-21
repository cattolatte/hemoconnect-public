"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { UserRole, ReportStatus } from "@/lib/types/database"

// ── Helpers ──────────────────────────────────────────────

async function requireAdmin() {
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

  return { supabase, user, role: profile.role as UserRole }
}

async function logAdminAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  targetUserId?: string,
  targetPostId?: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_user_id: targetUserId ?? null,
      target_post_id: targetPostId ?? null,
      details: details ?? null,
    })
  } catch {
    // Audit logging is best-effort — never block the action
  }
}

// ── Admin Stats ──────────────────────────────────────────

export async function getAdminStats() {
  const { supabase } = await requireAdmin()

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: flaggedPosts },
    { count: pendingReports },
    { count: totalCommunities },
    { count: totalComments },
    { count: bannedUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("forum_posts").select("*", { count: "exact", head: true }),
    supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "flagged"),
    supabase
      .from("reported_content")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("micro_communities").select("*", { count: "exact", head: true }),
    supabase.from("forum_comments").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .not("banned_at", "is", null),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalPosts: totalPosts ?? 0,
    flaggedPosts: flaggedPosts ?? 0,
    pendingReports: pendingReports ?? 0,
    totalCommunities: totalCommunities ?? 0,
    totalComments: totalComments ?? 0,
    bannedUsers: bannedUsers ?? 0,
  }
}

// ── Flagged Posts (Moderation Queue) ─────────────────────

export async function getFlaggedPosts() {
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from("forum_posts")
    .select("id, title, excerpt, tags, created_at, moderation_status, user_id, author:profiles!user_id(id, first_name, last_name)")
    .in("moderation_status", ["flagged", "pending"])
    .order("created_at", { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((post) => ({
    ...post,
    author: Array.isArray(post.author) ? post.author[0] : post.author,
  }))
}

export async function approvePost(postId: string) {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from("forum_posts")
    .update({ moderation_status: "approved" })
    .eq("id", postId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "approve_post", undefined, postId)

  revalidatePath("/admin/moderation")
  revalidatePath("/forum")
  return { success: true }
}

export async function rejectPost(postId: string) {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from("forum_posts")
    .delete()
    .eq("id", postId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "reject_post", undefined, postId)

  revalidatePath("/admin/moderation")
  revalidatePath("/forum")
  return { success: true }
}

// ── Reports ──────────────────────────────────────────────

export async function getReports() {
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from("reported_content")
    .select(`
      id, reason, description, status, created_at, resolved_at,
      reporter:profiles!reporter_id(id, first_name, last_name),
      post:forum_posts!post_id(id, title),
      comment:forum_comments!comment_id(id, body)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((report) => ({
    ...report,
    reporter: Array.isArray(report.reporter) ? report.reporter[0] : report.reporter,
    post: Array.isArray(report.post) ? report.post[0] : report.post,
    comment: Array.isArray(report.comment) ? report.comment[0] : report.comment,
  }))
}

export async function resolveReport(
  reportId: string,
  action: "dismissed" | "action_taken"
) {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from("reported_content")
    .update({
      status: action as ReportStatus,
      reviewed_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "resolve_report", undefined, undefined, {
    reportId,
    action,
  })

  revalidatePath("/admin/reports")
  return { success: true }
}

// ── User Management ──────────────────────────────────────

export async function getAllUsers() {
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, hemophilia_type, profile_setup_complete, banned_at, ban_reason, suspended_until, suspension_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  return data ?? []
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { supabase, user } = await requireAdmin()

  if (userId === user.id) {
    return { error: "Cannot change your own role" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "update_role", userId, undefined, { newRole: role })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function banUser(userId: string, reason: string) {
  const { supabase, user } = await requireAdmin()

  if (userId === user.id) {
    return { error: "Cannot ban yourself" }
  }

  // Don't allow banning other admins
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (targetProfile?.role === "admin") {
    return { error: "Cannot ban an admin user" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      banned_at: new Date().toISOString(),
      ban_reason: reason || "Banned by admin",
      suspended_until: null,
      suspension_reason: null,
    })
    .eq("id", userId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "ban_user", userId, undefined, { reason })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function unbanUser(userId: string) {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from("profiles")
    .update({
      banned_at: null,
      ban_reason: null,
    })
    .eq("id", userId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "unban_user", userId)

  revalidatePath("/admin/users")
  return { success: true }
}

export async function suspendUser(userId: string, days: number, reason: string) {
  const { supabase, user } = await requireAdmin()

  if (userId === user.id) {
    return { error: "Cannot suspend yourself" }
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (targetProfile?.role === "admin") {
    return { error: "Cannot suspend an admin user" }
  }

  const suspendedUntil = new Date()
  suspendedUntil.setDate(suspendedUntil.getDate() + days)

  const { error } = await supabase
    .from("profiles")
    .update({
      suspended_until: suspendedUntil.toISOString(),
      suspension_reason: reason || `Suspended for ${days} days`,
    })
    .eq("id", userId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "suspend_user", userId, undefined, { days, reason })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function unsuspendUser(userId: string) {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from("profiles")
    .update({
      suspended_until: null,
      suspension_reason: null,
    })
    .eq("id", userId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "unsuspend_user", userId)

  revalidatePath("/admin/users")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { supabase, user, role } = await requireAdmin()

  // Only full admins can delete users
  if (role !== "admin") {
    return { error: "Only admins can delete users. Moderators can ban or suspend." }
  }

  if (userId === user.id) {
    return { error: "Cannot delete your own account" }
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", userId)
    .single()

  if (targetProfile?.role === "admin") {
    return { error: "Cannot delete another admin account" }
  }

  // Log before deleting (cascading delete will remove the profile)
  await logAdminAction(supabase, user.id, "delete_user", userId, undefined, {
    deletedUserName: `${targetProfile?.first_name} ${targetProfile?.last_name}`.trim(),
  })

  // Delete the profile (cascading deletes handle posts, comments, etc.)
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)

  if (error) return { error: error.message }

  // Also delete the auth user via admin API if possible
  // Note: This requires the service_role key. If unavailable, the auth user
  // will remain but the profile is gone, effectively disabling the account.
  await supabase.auth.admin.deleteUser(userId).catch(() => {})

  revalidatePath("/admin/users")
  return { success: true }
}

export async function deleteUserPosts(userId: string) {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from("forum_posts")
    .delete()
    .eq("user_id", userId)

  if (error) return { error: error.message }

  await logAdminAction(supabase, user.id, "delete_user_posts", userId)

  revalidatePath("/admin/users")
  revalidatePath("/forum")
  return { success: true }
}

// ── Admin Audit Log ──────────────────────────────────────

export async function getAuditLog() {
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from("admin_audit_log")
    .select(`
      id, action, details, created_at,
      admin:profiles!admin_id(id, first_name, last_name),
      target_user:profiles!target_user_id(id, first_name, last_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((entry) => ({
    ...entry,
    admin: Array.isArray(entry.admin) ? entry.admin[0] : entry.admin,
    target_user: Array.isArray(entry.target_user) ? entry.target_user[0] : entry.target_user,
  }))
}

// ── Get current user role ────────────────────────────────

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return (profile?.role as UserRole) ?? "user"
}
