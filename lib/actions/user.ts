import { createClient } from "@/lib/supabase/server"

export type UserData = {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
} | null

export async function getUser(): Promise<UserData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const firstName = user.user_metadata?.first_name || ""
  const lastName = user.user_metadata?.last_name || ""
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    user.email?.split("@")[0] ||
    "User"
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U"

  return {
    id: user.id,
    email: user.email || "",
    firstName,
    lastName,
    fullName,
    initials,
  }
}
