import type { Metadata } from "next"
import { getAdminStats, getAuditLog } from "@/lib/actions/admin"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
}
import { AdminDashboard } from "./admin-dashboard"

export default async function AdminPage() {
  const [stats, auditLog] = await Promise.all([
    getAdminStats(),
    getAuditLog(),
  ])

  return <AdminDashboard stats={stats} auditLog={auditLog} />
}
