"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { approvePost, rejectPost } from "@/lib/actions/admin"
import { timeAgo } from "@/lib/utils/time"

interface FlaggedPost {
  id: string
  title: string
  excerpt: string
  tags: string[]
  created_at: string
  moderation_status: string
  user_id: string
  author: { id: string; first_name: string; last_name: string } | null
}

interface ModerationQueueProps {
  posts: FlaggedPost[]
}

export function ModerationQueue({ posts: initialPosts }: ModerationQueueProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()

  const handleApprove = (postId: string) => {
    startTransition(async () => {
      const result = await approvePost(postId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
        toast.success("Post approved")
      }
    })
  }

  const handleReject = (postId: string) => {
    startTransition(async () => {
      const result = await rejectPost(postId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
        toast.success("Post removed")
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/admin">
            <ArrowLeft className="size-4" />
            Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} item{posts.length !== 1 ? "s" : ""} need review
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShieldCheck className="size-12 text-emerald-500" />
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground">
              No posts need moderation right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => {
            const authorName = post.author
              ? `${post.author.first_name} ${post.author.last_name}`.trim()
              : "Unknown"
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <CardDescription>
                          by {authorName} &middot; {timeAgo(post.created_at)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={post.moderation_status === "flagged" ? "destructive" : "secondary"}
                      >
                        {post.moderation_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        <Link href={`/forum/${post.id}`}>
                          <Eye className="size-3.5" />
                          View Full Post
                        </Link>
                      </Button>
                      <div className="flex-1" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleReject(post.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleApprove(post.id)}
                        disabled={isPending}
                      >
                        <ShieldCheck className="size-3.5" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
