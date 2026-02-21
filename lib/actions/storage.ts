"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) return { error: "No file provided" }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image." }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large. Maximum size is 2MB." }
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${user.id}/avatar-${Date.now()}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (uploadError) {
    console.error("[HemoConnect Storage] Avatar upload failed:", uploadError)
    return { error: "Failed to upload image. Please try again." }
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName)

  const avatarUrl = urlData.publicUrl

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)

  if (updateError) {
    return { error: "Failed to update profile. Please try again." }
  }

  revalidatePath("/profile/setup")
  revalidatePath(`/profile/${user.id}`)
  return { url: avatarUrl }
}

export async function removeAvatar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  // Clear avatar_url in profile
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)

  if (error) return { error: error.message }

  // Try to clean up storage (non-blocking)
  supabase.storage
    .from("avatars")
    .list(user.id)
    .then(async ({ data: files }) => {
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`)
        await supabase.storage.from("avatars").remove(filePaths)
      }
    })
    .catch(() => {})

  revalidatePath("/profile/setup")
  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}
