import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCommunityById, getCommunityMembers } from "@/lib/actions/communities"
import { getPosts } from "@/lib/actions/forum"
import { CommunityDetail } from "./community-detail"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ communityId: string }>
}): Promise<Metadata> {
  const { communityId } = await params
  const community = await getCommunityById(communityId)

  if (!community) {
    return { title: "Community Not Found" }
  }

  return {
    title: community.name,
    description: community.description || `Join the ${community.name} community on HemoConnect.`,
  }
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ communityId: string }>
}) {
  const { communityId } = await params
  const community = await getCommunityById(communityId)

  if (!community) notFound()

  const [members, posts] = await Promise.all([
    getCommunityMembers(communityId),
    getPosts({ tag: community.tag }),
  ])

  return (
    <CommunityDetail
      community={community}
      members={members}
      posts={posts}
    />
  )
}
