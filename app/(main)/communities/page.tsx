import type { Metadata } from "next"
import { getCommunities } from "@/lib/actions/communities"

export const metadata: Metadata = {
  title: "Communities",
  description: "Join micro-communities based on your interests — from joint health to parenting and gene therapy discussions.",
}
import { CommunitiesContent } from "./communities-content"

export default async function CommunitiesPage() {
  const communities = await getCommunities()

  return <CommunitiesContent communities={communities} />
}
