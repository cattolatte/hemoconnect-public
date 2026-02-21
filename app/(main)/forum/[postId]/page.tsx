import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPostById } from "@/lib/actions/forum"
import { getUser } from "@/lib/actions/user"
import { isBookmarked, isSubscribed } from "@/lib/actions/social"
import { PostDetail } from "./post-detail"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>
}): Promise<Metadata> {
  const { postId } = await params
  const post = await getPostById(postId)

  if (!post) return { title: "Post Not Found" }

  const authorName = post.author
    ? `${post.author.first_name} ${post.author.last_name}`.trim()
    : "Unknown"

  return {
    title: post.title,
    description: post.excerpt || post.body.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.body.substring(0, 160),
      type: "article",
      authors: [authorName],
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const [post, currentUser] = await Promise.all([
    getPostById(postId),
    getUser(),
  ])

  if (!post) notFound()

  const [bookmarked, subscribed] = await Promise.all([
    isBookmarked(postId),
    isSubscribed(postId),
  ])

  return (
    <PostDetail
      post={post}
      currentUser={currentUser}
      initialBookmarked={bookmarked}
      initialSubscribed={subscribed}
    />
  )
}
