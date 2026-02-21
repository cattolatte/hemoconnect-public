import type { Metadata } from "next"
import { getBookmarkedPosts } from "@/lib/actions/social"

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved forum posts and discussions.",
}
import { BookmarksContent } from "./bookmarks-content"

export default async function BookmarksPage() {
  const posts = await getBookmarkedPosts()

  return <BookmarksContent posts={posts} />
}
