import type { Metadata } from "next"
import { getAllUsers } from "@/lib/actions/admin"

export const metadata: Metadata = {
  title: "User Management",
  robots: { index: false, follow: false },
}
import { UsersList } from "./users-list"

export default async function UsersPage() {
  const users = await getAllUsers()

  return <UsersList users={users} />
}
