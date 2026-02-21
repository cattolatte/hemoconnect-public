import { getUser } from "@/lib/actions/user"
import { getUnreadCount } from "@/lib/actions/notifications"
import { getCurrentUserRole } from "@/lib/actions/admin"
import { MainLayoutClient } from "@/components/shared/MainLayoutClient"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  const [unreadNotifications, userRole] = await Promise.all([
    user ? getUnreadCount() : Promise.resolve(0),
    user ? getCurrentUserRole() : Promise.resolve(null),
  ])

  return (
    <MainLayoutClient
      user={user}
      unreadNotifications={unreadNotifications}
      userRole={userRole}
    >
      {children}
    </MainLayoutClient>
  )
}
