"use client"

import { useRef, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users,
  MessageSquare,
  ShieldAlert,
  Flag,
  Network,
  ArrowRight,
  Ban,
  Clock,
  UserX,
  UserCheck,
  Trash2,
  ShieldCheck,
  FileX,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedCounter } from "@/components/animations/animated-counter"
import { AnimatedSection } from "@/components/animations/animated-section"
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children"

interface AuditEntry {
  id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
  admin: { id: string; first_name: string; last_name: string } | null
  target_user: { id: string; first_name: string; last_name: string } | null
}

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    totalPosts: number
    flaggedPosts: number
    pendingReports: number
    totalCommunities: number
    totalComments: number
    bannedUsers: number
  }
  auditLog: AuditEntry[]
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof Ban; color: string }
> = {
  ban_user: { label: "Banned User", icon: Ban, color: "text-red-600" },
  unban_user: { label: "Unbanned User", icon: UserCheck, color: "text-green-600" },
  suspend_user: { label: "Suspended User", icon: Clock, color: "text-amber-600" },
  unsuspend_user: { label: "Lifted Suspension", icon: UserCheck, color: "text-green-600" },
  delete_user: { label: "Deleted User", icon: UserX, color: "text-red-700" },
  delete_user_posts: { label: "Deleted User Posts", icon: Trash2, color: "text-red-600" },
  update_role: { label: "Changed Role", icon: ShieldCheck, color: "text-blue-600" },
  approve_post: { label: "Approved Post", icon: ShieldCheck, color: "text-green-600" },
  reject_post: { label: "Rejected Post", icon: FileX, color: "text-red-600" },
  resolve_report: { label: "Resolved Report", icon: Flag, color: "text-blue-600" },
}

function formatRelativeTime(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

interface QuickLink {
  label: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  count: number
}

function QuickActionCard({ link, index }: { link: QuickLink; index: number }) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollX, setScrollX] = useState(0)
  const [overflow, setOverflow] = useState(0)
  const animRef = useRef<number | null>(null)

  const startScroll = useCallback(() => {
    const el = textRef.current
    const container = containerRef.current
    if (!el || !container) return

    const diff = el.scrollWidth - container.clientWidth
    if (diff <= 0) return // no overflow, nothing to scroll

    setOverflow(diff)
    let start: number | null = null
    const duration = Math.max(diff * 20, 1500) // ~20ms per pixel, min 1.5s

    function step(timestamp: number) {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      // ease in-out
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setScrollX(-eased * diff)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      }
    }

    animRef.current = requestAnimationFrame(step)
  }, [])

  const stopScroll = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    setScrollX(0)
    setOverflow(0)
  }, [])

  return (
    <motion.div
      key={link.href}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      onMouseEnter={startScroll}
      onMouseLeave={stopScroll}
    >
      <Button
        asChild
        variant="outline"
        className="h-auto w-full flex-col items-start gap-2 overflow-hidden p-4 text-left"
      >
        <Link href={link.href}>
          <div className="flex w-full items-center justify-between">
            <link.icon className="size-5 shrink-0 text-primary" />
            {link.count > 0 && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {link.count}
              </span>
            )}
          </div>
          <div ref={containerRef} className="w-full min-w-0 overflow-hidden">
            <p className="truncate font-medium">{link.label}</p>
            <p
              ref={textRef}
              className="whitespace-nowrap text-xs text-muted-foreground transition-none"
              style={{ transform: `translateX(${scrollX}px)` }}
            >
              {link.description}
              {overflow > 0 && (
                <span className="pointer-events-none ml-4 inline-block h-full w-8 bg-gradient-to-l from-transparent to-transparent" />
              )}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </Button>
    </motion.div>
  )
}

export function AdminDashboard({ stats, auditLog }: AdminDashboardProps) {
  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-950",
    },
    {
      label: "Forum Posts",
      value: stats.totalPosts,
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950",
    },
    {
      label: "Flagged Posts",
      value: stats.flaggedPosts,
      icon: ShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-950",
      href: "/admin/moderation",
    },
    {
      label: "Pending Reports",
      value: stats.pendingReports,
      icon: Flag,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-950",
      href: "/admin/reports",
    },
    {
      label: "Banned Users",
      value: stats.bannedUsers,
      icon: Ban,
      color: "text-rose-600",
      bg: "bg-rose-100 dark:bg-rose-950",
      href: "/admin/users",
    },
    {
      label: "Communities",
      value: stats.totalCommunities,
      icon: Network,
      color: "text-violet-600",
      bg: "bg-violet-100 dark:bg-violet-950",
    },
  ]

  const quickLinks = [
    {
      label: "Moderation Queue",
      description: "Review flagged posts and approve or reject content",
      href: "/admin/moderation",
      icon: ShieldAlert,
      count: stats.flaggedPosts,
    },
    {
      label: "Reports",
      description: "Handle user-submitted reports of inappropriate content",
      href: "/admin/reports",
      icon: Flag,
      count: stats.pendingReports,
    },
    {
      label: "User Management",
      description: "Manage users, roles, bans & suspensions",
      href: "/admin/users",
      icon: Users,
      count: stats.totalUsers,
    },
    {
      label: "Resources",
      description: "Add, edit, or remove resource articles",
      href: "/admin/resources",
      icon: BookOpen,
      count: 0,
    },
  ]

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and moderate the HemoConnect community
          </p>
        </div>
      </AnimatedSection>

      {/* Stats Grid */}
      <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* Quick Links */}
      <AnimatedSection delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link, i) => (
              <QuickActionCard key={link.href} link={link} index={i} />
            ))}
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Recent Activity / Audit Log */}
      <AnimatedSection delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest admin actions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLog.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No admin activity recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {auditLog.map((entry, i) => {
                  const config = ACTION_CONFIG[entry.action] ?? {
                    label: entry.action.replace(/_/g, " "),
                    icon: ShieldAlert,
                    color: "text-muted-foreground",
                  }
                  const ActionIcon = config.icon

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div
                        className={`mt-0.5 rounded-md bg-muted p-1.5 ${config.color}`}
                      >
                        <ActionIcon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(entry.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">
                          <span className="font-medium">
                            {entry.admin
                              ? `${entry.admin.first_name} ${entry.admin.last_name}`
                              : "Unknown admin"}
                          </span>
                          {entry.target_user && (
                            <>
                              {" \u2192 "}
                              <span className="font-medium">
                                {entry.target_user.first_name}{" "}
                                {entry.target_user.last_name}
                              </span>
                            </>
                          )}
                        </p>
                        {entry.details && (() => {
                          const d = entry.details as Record<string, unknown>
                          return (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {d.reason ? (
                                <span>Reason: {String(d.reason)}</span>
                              ) : null}
                              {d.newRole ? (
                                <span>New role: {String(d.newRole)}</span>
                              ) : null}
                              {d.days ? (
                                <span>
                                  {" "}
                                  ({String(d.days)} days)
                                </span>
                              ) : null}
                            </p>
                          )
                        })()}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  )
}
