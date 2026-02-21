"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Bookmark,
  ThumbsUp,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { timeAgo } from "@/lib/utils/time"
import type { ForumPostWithAuthor } from "@/lib/types/database"

interface BookmarksContentProps {
  posts: ForumPostWithAuthor[]
}

function getInitials(author: { first_name: string; last_name: string }) {
  return [author.first_name, author.last_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"
}

function getAuthorName(author: { first_name: string; last_name: string }) {
  return `${author.first_name} ${author.last_name}`.trim() || "Unknown"
}

export function BookmarksContent({ posts }: BookmarksContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Bookmark className="size-8 text-primary" />
          Bookmarks
        </h1>
        <p className="mt-1 text-muted-foreground">
          Posts you&apos;ve saved for later
        </p>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Bookmark className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p className="font-medium">No bookmarks yet</p>
              <p className="mt-1 text-sm">
                Save forum posts you want to revisit by clicking the bookmark icon.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/forum">Browse Forum</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="hover-lift hover-glow transition-all">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Avatar className="mt-1 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(post.author)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div>
                      <Button
                        asChild
                        variant="link"
                        className="h-auto p-0 text-left text-base font-semibold"
                      >
                        <Link href={`/forum/${post.id}`}>{post.title}</Link>
                      </Button>
                      <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {getAuthorName(post.author)}
                        </span>
                        <span>&middot;</span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(post.auto_tags ?? [])
                          .filter((t) => !post.tags.includes(t))
                          .map((tag) => (
                            <Badge
                              key={`auto-${tag}`}
                              variant="secondary"
                              className="gap-1 text-xs bg-primary/10 text-primary border-primary/20"
                            >
                              <Sparkles className="size-2.5" />
                              {tag}
                            </Badge>
                          ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="size-3.5" />
                          {post.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="size-3.5" />
                          {post.comment_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
