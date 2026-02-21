import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProfileById, getRecentPostsByUser } from "@/lib/actions/profile"
import { getUser } from "@/lib/actions/user"
import { isFollowing, getFollowerCount, getFollowingCount } from "@/lib/actions/social"
import { getUserBadges } from "@/services/badges"
import { ProfileView } from "./profile-view"
import { HEMOPHILIA_TYPE_LABELS } from "@/lib/types/database"
import type { HemophiliaType } from "@/lib/types/database"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<Metadata> {
  const { userId } = await params
  const profile = await getProfileById(userId)

  if (!profile) return { title: "Profile Not Found" }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || "User"
  const typeLabel = profile.hemophilia_type
    ? HEMOPHILIA_TYPE_LABELS[profile.hemophilia_type as HemophiliaType]
    : null
  const description = typeLabel
    ? `${fullName} — ${typeLabel} community member on HemoConnect`
    : `${fullName} — HemoConnect community member`

  return {
    title: `${fullName}'s Profile`,
    description,
    openGraph: {
      title: `${fullName}'s Profile`,
      description,
      type: "profile",
    },
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const [profile, recentPosts, currentUser] = await Promise.all([
    getProfileById(userId),
    getRecentPostsByUser(userId),
    getUser(),
  ])

  if (!profile) notFound()

  const isOwnProfile = currentUser?.id === profile.id

  const [following, followerCount, followingCount, badges] = await Promise.all([
    isOwnProfile ? Promise.resolve(false) : isFollowing(userId),
    getFollowerCount(userId),
    getFollowingCount(userId),
    getUserBadges(userId),
  ])

  return (
    <ProfileView
      profile={profile}
      recentPosts={recentPosts}
      isOwnProfile={isOwnProfile}
      initialFollowing={following}
      followerCount={followerCount}
      followingCount={followingCount}
      badges={badges}
    />
  )
}
