import type { Metadata } from "next"
import { getPosts } from "@/lib/actions/forum"

export const metadata: Metadata = {
  title: "Forum",
  description: "Join discussions with the hemophilia community. Share experiences, ask questions, and find support.",
}
import { ForumContent } from "./forum-content"

export default async function ForumPage() {
  const posts = await getPosts()

  return <ForumContent initialPosts={posts} />
}
