"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Users,
  MessageSquare,
  ThumbsUp,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { timeAgo } from "@/lib/utils/time"
import type { MicroCommunity, ForumPostWithAuthor } from "@/lib/types/database"

interface CommunityDetailProps {
  community: MicroCommunity
  members: {
    user_id: string
    joined_at: string
    profile: { id: string; first_name: string; last_name: string; hemophilia_type: string | null; severity_level: string | null } | null
  }[]
  posts: ForumPostWithAuthor[]
}

function getInitials(first: string, last: string) {
  return [first, last]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"
}

export function CommunityDetail({ community, members, posts }: CommunityDetailProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link href="/communities">
          <ArrowLeft className="size-4" />
          Back to Communities
        </Link>
      </Button>

      {/* Community Header */}
      <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{community.name}</CardTitle>
              <CardDescription className="text-base">{community.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {community.member_count} members
            </span>
            <Badge variant="secondary">{community.tag}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Discussions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="size-5 text-primary" />
            Community Discussions
          </h2>

          {posts.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No discussions with the &quot;{community.tag}&quot; tag yet.
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
              <Card className="hover-lift">
                <CardContent className="p-4">
                  <Button
                    asChild
                    variant="link"
                    className="h-auto p-0 text-left font-semibold"
                  >
                    <Link href={`/forum/${post.id}`}>{post.title}</Link>
                  </Button>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{timeAgo(post.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="size-3" /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="size-3" /> {post.comment_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Members */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" />
            Members ({community.member_count})
          </h2>

          <Card>
            <CardContent className="p-4 space-y-3">
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members yet. Be the first to join!
                </p>
              )}
              {members.map((member) => {
                const profile = member.profile
                if (!profile) return null
                const name = `${profile.first_name} ${profile.last_name}`.trim()
                return (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(profile.first_name, profile.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Button
                        asChild
                        variant="link"
                        className="h-auto p-0 text-sm font-medium"
                      >
                        <Link href={`/profile/${profile.id}`}>{name || "User"}</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
