import type { Metadata } from "next"
import { getResources } from "@/lib/actions/resources"

export const metadata: Metadata = {
  title: "Resources",
  description: "Curated resources and AI-generated summaries about hemophilia, treatments, and living well with bleeding disorders.",
}
import { ResourcesContent } from "./resources-content"

export default async function ResourcesPage() {
  const resources = await getResources()

  return <ResourcesContent initialResources={resources} />
}
