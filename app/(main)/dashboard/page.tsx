import type { Metadata } from "next"
import { getUser } from "@/lib/actions/user"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personalized HemoConnect dashboard — activity, stats, peer matches, and community updates.",
}
import { getDashboardStats, getRecentActivity, getSuggestedPeers } from "@/lib/actions/dashboard"
import { getUserBadges } from "@/services/badges"
import { DashboardContent } from "./dashboard-content"

export default async function DashboardPage() {
  const user = await getUser()

  const [stats, activity, peers, badges] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getSuggestedPeers(),
    user?.id ? getUserBadges(user.id) : Promise.resolve([]),
  ])

  return (
    <DashboardContent
      user={user}
      stats={stats}
      recentActivity={activity}
      suggestedPeers={peers}
      badges={badges}
    />
  )
}
