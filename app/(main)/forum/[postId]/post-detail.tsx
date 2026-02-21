"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Share2,
  Bell,
  BellOff,
  Flag,
  MoreHorizontal,
  Send,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { togglePostLike, toggleCommentLike, createComment } from "@/lib/actions/forum"
import { toggleBookmark, toggleSubscription, reportContent } from "@/lib/actions/social"
import { timeAgo } from "@/lib/utils/time"
import { REPORT_REASON_LABELS } from "@/lib/types/database"
import type { ForumCommentWithAuthor, ReportReason } from "@/lib/types/database"
import type { UserData } from "@/lib/actions/user"

interface PostData {
  id: string
  user_id: string
  title: string
  body: string
  excerpt: string
  tags: string[]
  auto_tags: string[]
  is_hot: boolean
  is_pinned: boolean
  view_count: number
  ai_summary: string | null
  ai_summary_updated_at: string | null
  created_at: string
  updated_at: string
  author: { id: string; first_name: string; last_name: string }
  like_count: number
  comment_count: number
  user_liked: boolean
  comments: (ForumCommentWithAuthor & { user_liked: boolean })[]
}

interface PostDetailProps {
  post: PostData
  currentUser: UserData
  initialBookmarked: boolean
  initialSubscribed: boolean
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

function KeyTakeawaysCard({ summary }: { summary: string }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="size-4" />
            Key Takeaways
          </div>
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
          <p className="mt-3 text-xs italic text-muted-foreground/60">
            AI-Generated Summary. Not Medical Advice. Consult your HTC.
          </p>
        </CardContent>
      )}
    </Card>
  )
}

export function PostDetail({ post, currentUser, initialBookmarked, initialSubscribed }: PostDetailProps) {
  const [replyText, setReplyText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason | "">("")

  const handleLikePost = () => {
    startTransition(async () => {
      const result = await togglePostLike(post.id)
      if (result.error) toast.error(result.error)
    })
  }

  const handleLikeComment = (commentId: string) => {
    startTransition(async () => {
      const result = await toggleCommentLike(commentId, post.id)
      if (result.error) toast.error(result.error)
    })
  }

  const handleReply = () => {
    if (!replyText.trim()) return
    startTransition(async () => {
      const result = await createComment(post.id, replyText.trim())
      if (result.error) {
        toast.error(result.error)
      } else {
        setReplyText("")
        toast.success("Reply posted!")
      }
    })
  }

  const handleBookmark = () => {
    startTransition(async () => {
      const result = await toggleBookmark(post.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsBookmarked(result.bookmarked ?? false)
        toast.success(result.bookmarked ? "Post bookmarked!" : "Bookmark removed")
      }
    })
  }

  const handleSubscribe = () => {
    startTransition(async () => {
      const result = await toggleSubscription(post.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsSubscribed(result.subscribed ?? false)
        toast.success(
          result.subscribed
            ? "You'll be notified of new replies"
            : "Unsubscribed from replies"
        )
      }
    })
  }

  const handleReport = () => {
    if (!reportReason) return
    startTransition(async () => {
      const result = await reportContent({
        postId: post.id,
        reason: reportReason as ReportReason,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Report submitted. Thank you for keeping the community safe.")
        setReportOpen(false)
        setReportReason("")
      }
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Link */}
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link href="/forum">
          <ArrowLeft className="size-4" />
          Back to Forum
        </Link>
      </Button>

      {/* Post Card */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/10 font-medium text-primary">
                  {getInitials(post.author)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{getAuthorName(post.author)}</p>
                <p className="text-sm text-muted-foreground">{timeAgo(post.created_at)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {(post.auto_tags ?? [])
                .filter((t) => !post.tags.includes(t))
                .map((tag) => (
                  <Badge
                    key={`auto-${tag}`}
                    variant="secondary"
                    className="gap-1 bg-primary/10 text-primary border-primary/20"
                  >
                    <Sparkles className="size-3" />
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {post.body.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("**")) {
                return (
                  <p key={i} className="font-semibold">
                    {paragraph.replace(/\*\*/g, "")}
                  </p>
                )
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={i} className="list-disc space-y-1 pl-5">
                    {paragraph.split("\n").map((item, j) => (
                      <li key={j} className="text-muted-foreground">
                        {item.replace("- ", "")}
                      </li>
                    ))}
                  </ul>
                )
              }
              if (paragraph.startsWith("*") && paragraph.endsWith("*")) {
                return (
                  <p key={i} className="italic text-muted-foreground">
                    {paragraph.replace(/\*/g, "")}
                  </p>
                )
              }
              return (
                <p key={i} className="leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              )
            })}
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 ${post.user_liked ? "text-primary" : ""}`}
                onClick={handleLikePost}
              >
                <ThumbsUp className="size-4" />
                {post.like_count}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <MessageCircle className="size-4" />
                {post.comment_count} Replies
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={isSubscribed ? "text-primary" : ""}
                onClick={handleSubscribe}
                title={isSubscribed ? "Unsubscribe from replies" : "Get notified of replies"}
              >
                {isSubscribed ? <BellOff className="size-4" /> : <Bell className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={isBookmarked ? "text-primary" : ""}
                onClick={handleBookmark}
                title={isBookmarked ? "Remove bookmark" : "Bookmark post"}
              >
                {isBookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportOpen(true)}
                title="Report post"
              >
                <Flag className="size-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Key Takeaways (AI Summary) */}
      {post.ai_summary && (
        <KeyTakeawaysCard summary={post.ai_summary} />
      )}

      <Separator />

      {/* Reply Box */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="mt-1 size-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {currentUser?.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share your thoughts or experience..."
                className="min-h-[80px] resize-none"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleReply}
                  disabled={isPending || !replyText.trim()}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {post.comments.length} {post.comments.length === 1 ? "Reply" : "Replies"}
        </h2>

        {post.comments.map((comment, i) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
          >
            <Card className="hover-glow">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="mt-1 size-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {getInitials(comment.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {getAuthorName(comment.author)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-muted-foreground">
                      {comment.body.split("\n\n").map((p, pi) => {
                        if (p.match(/^\d\./)) {
                          return (
                            <ol key={pi} className="my-2 list-decimal space-y-1 pl-5">
                              {p.split("\n").map((item, j) => (
                                <li key={j}>{item.replace(/^\d\.\s*/, "")}</li>
                              ))}
                            </ol>
                          )
                        }
                        return <p key={pi} className="mb-2">{p}</p>
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 gap-1 text-xs ${comment.user_liked ? "text-primary" : ""}`}
                      onClick={() => handleLikeComment(comment.id)}
                    >
                      <ThumbsUp className="size-3" />
                      {comment.like_count}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={reportReason}
              onValueChange={(v) => setReportReason(v as ReportReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReport}
                disabled={!reportReason || isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Flag className="mr-2 size-4" />
                )}
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
