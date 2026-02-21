import type { Metadata } from "next"
import { getResources } from "@/lib/actions/resources"

export const metadata: Metadata = {
  title: "Manage Resources",
  robots: { index: false, follow: false },
}
import { AdminResourcesList } from "./admin-resources-list"

export default async function AdminResourcesPage() {
  const resources = await getResources()

  return <AdminResourcesList initialResources={resources} />
}
