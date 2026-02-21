import type { Metadata } from "next"
import { getReports } from "@/lib/actions/admin"

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
}
import { ReportsList } from "./reports-list"

export default async function ReportsPage() {
  const reports = await getReports()

  return <ReportsList reports={reports} />
}
