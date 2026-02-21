"use client"

import {
  Users,
  MessageSquare,
  BookOpen,
  Mail,
  Heart,
  TrendingUp,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Award,
  Sun,
  Link2,
  Pencil,
  HandHeart,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
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
import { AnimatedCounter } from "@/components/animations/animated-counter"
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children"
import { AnimatedSection } from "@/components/animations/animated-section"
import { timeAgo } from "@/lib/utils/time"
import { HEMOPHILIA_TYPE_LABELS, SEVERITY_LABELS, BADGE_LABELS } from "@/lib/types/database"
import type { UserData } from "@/lib/actions/user"
import type { DashboardStats, DashboardActivity, SuggestedPeer } from "@/lib/actions/dashboard"
import type { HemophiliaType, SeverityLevel, UserBadge, BadgeType } from "@/lib/types/database"

const BADGE_ICONS: Record<BadgeType, React.ComponentType<{ className?: string }>> = {
  guiding_light: Sun,
  connector: Link2,
  first_post: Pencil,
  helpful: HandHeart,
  active_member: MessageSquare,
  community_builder: Users,
}

interface DashboardContentProps {
  user: UserData
  stats: DashboardStats
  recentActivity: DashboardActivity[]
  suggestedPeers: SuggestedPeer[]
  badges: UserBadge[]
}

export function DashboardContent({ user, stats, recentActivity, suggestedPeers, badges }: DashboardContentProps) {
  const firstName = user?.firstName || "there"
  const initials = user?.initials || "U"

  const statCards = [
    {
      label: "Peer Matches",
      value: stats.peerMatches,
      icon: Users,
      description: "Based on your profile",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Messages",
      value: stats.unreadMessages,
      icon: Mail,
      description: `${stats.unreadMessages} unread`,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-950",
    },
    {
      label: "Forum Posts",
      value: stats.forumPosts,
      icon: MessageSquare,
      description: "Your contributions",
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950",
    },
    {
      label: "Saved Resources",
      value: stats.savedResources,
      icon: BookOpen,
      description: "In your library",
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-950",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <AnimatedSection>
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animated-gradient overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <Avatar className="size-14 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
              <p className="text-muted-foreground">
                {stats.unreadMessages > 0
                  ? `You have ${stats.unreadMessages} unread message${stats.unreadMessages === 1 ? "" : "s"}.`
                  : "You're all caught up!"}
              </p>
            </div>
            <Button asChild className="shrink-0 group">
              <Link href="/profile/setup">
                Complete Profile
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Stats Grid */}
      <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="hover-lift hover-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <motion.div
                    className={`rounded-lg p-2 ${stat.bg}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <stat.icon className={`size-5 ${stat.color}`} />
                  </motion.div>
                  <AnimatedCounter
                    value={stat.value}
                    className="text-3xl font-bold"
                  />
                </div>
                <p className="mt-2 font-medium">{stat.label}</p>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* Badges */}
      {badges.length > 0 && (
        <AnimatedSection delay={0.05}>
          <Card className="hover-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="size-5 text-amber-600" />
                    Your Badges
                  </CardTitle>
                  <CardDescription>
                    {badges.length} badge{badges.length !== 1 ? "s" : ""} earned
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/profile/${user?.id}`}>View profile</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge, i) => {
                  const info = BADGE_LABELS[badge.badge_type]
                  const Icon = BADGE_ICONS[badge.badge_type]
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="flex items-center gap-2 rounded-lg border bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 p-3 transition-all hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700"
                      title={info.description}
                    >
                      <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                        <Icon className="size-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Suggested Peers */}
        <AnimatedSection delay={0.1}>
          <Card className="hover-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Suggested Peers
                  </CardTitle>
                  <CardDescription>
                    People with similar profiles
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedPeers.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Complete your profile to see peer suggestions.
                </p>
              )}
              {suggestedPeers.map((peer, i) => {
                const peerInitials = [peer.first_name, peer.last_name]
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"
                const peerName = `${peer.first_name} ${peer.last_name}`.trim() || "Unknown"
                return (
                  <motion.div
                    key={peer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-all duration-200 hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {peerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{peerName}</p>
                      <div className="flex items-center gap-2">
                        {peer.hemophilia_type && (
                          <Badge variant="secondary" className="text-xs">
                            {HEMOPHILIA_TYPE_LABELS[peer.hemophilia_type as HemophiliaType]}
                          </Badge>
                        )}
                        {peer.severity_level && (
                          <Badge variant="outline" className="text-xs">
                            {SEVERITY_LABELS[peer.severity_level as SeverityLevel]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        {peer.matchMethod === "hybrid" ? (
                          <Sparkles className="size-3" />
                        ) : (
                          <TrendingUp className="size-3" />
                        )}
                        <AnimatedCounter value={peer.matchScore} suffix="%" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {peer.matchMethod === "hybrid" ? "AI match" : "match"}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
              {suggestedPeers.length > 0 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 mt-2">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Peer suggestions are generated by AI based on profile similarity. They do not constitute medical advice or endorsement.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Recent Forum Activity */}
        <AnimatedSection delay={0.2}>
          <Card className="hover-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-emerald-600" />
                    Recent Forum Activity
                  </CardTitle>
                  <CardDescription>
                    Latest discussions from the community
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/forum">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No forum activity yet. Start a discussion!
                </p>
              )}
              {recentActivity.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <Button
                        asChild
                        variant="link"
                        className="h-auto justify-start p-0 text-left font-medium"
                      >
                        <Link href={`/forum/${post.id}`}>{post.title}</Link>
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.authorName}</span>
                        <span>·</span>
                        <span>{timeAgo(post.createdAt)}</span>
                        <span>·</span>
                        <span>{post.commentCount} replies</span>
                      </div>
                    </div>
                    {post.tags[0] && (
                      <Badge variant="outline" className="shrink-0">
                        {post.tags[0]}
                      </Badge>
                    )}
                  </div>
                  {i < recentActivity.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}
