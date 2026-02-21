import type { Metadata } from "next"
import { getFlaggedPosts } from "@/lib/actions/admin"

export const metadata: Metadata = {
  title: "Moderation Queue",
  robots: { index: false, follow: false },
}
import { ModerationQueue } from "./moderation-queue"

export default async function ModerationPage() {
  const posts = await getFlaggedPosts()

  return <ModerationQueue posts={posts} />
}
