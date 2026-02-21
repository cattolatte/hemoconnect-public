import type { Metadata } from "next"
import { getProfile } from "@/lib/actions/profile"

export const metadata: Metadata = {
  title: "Profile Setup",
  description: "Set up your HemoConnect profile to connect with the right peers.",
}
import { ProfileSetupForm } from "./profile-setup-form"

export default async function ProfileSetupPage() {
  const profile = await getProfile()

  return <ProfileSetupForm existingProfile={profile} />
}
