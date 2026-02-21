"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  Check,
  CheckCheck,
  MessageCircle,
  ThumbsUp,
  UserPlus,
  Award,
  Sparkles,
  AtSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { timeAgo } from "@/lib/utils/time"
import { createClient } from "@/lib/supabase/client"
import type { NotificationWithActor, NotificationType } from "@/lib/types/database"

interface NotificationBellProps {
  initialCount: number
  userId: string
}

const typeIcons: Record<NotificationType, typeof Bell> = {
  new_comment: MessageCircle,
  post_liked: ThumbsUp,
  comment_liked: ThumbsUp,
  new_follower: UserPlus,
  connection_request: UserPlus,
  connection_accepted: Check,
  badge_earned: Award,
  mention: AtSign,
  thread_reply: MessageCircle,
  smart_match: Sparkles,
}

const typeLabels: Record<NotificationType, string> = {
  new_comment: "commented on your post",
  post_liked: "liked your post",
  comment_liked: "liked your comment",
  new_follower: "started following you",
  connection_request: "sent you a connection request",
  connection_accepted: "accepted your connection",
  badge_earned: "You earned a badge!",
  mention: "mentioned you",
  thread_reply: "replied in a thread you follow",
  smart_match: "New post matches your interests",
}

export function NotificationBell({ initialCount, userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      getNotifications(10).then(setNotifications)
    }
  }, [isOpen])

  // Subscribe to new notifications via Supabase Realtime
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((c) => c + 1)
          // Refresh notifications if dropdown is open
          if (isOpen) {
            getNotifications(10).then(setNotifications)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isOpen])

  const handleMarkRead = (notificationId: string) => {
    startTransition(async () => {
      await markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 p-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}

        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type] || Bell
          const actorName = notification.actor
            ? `${notification.actor.first_name} ${notification.actor.last_name}`.trim()
            : ""
          const label = notification.message || typeLabels[notification.type]
          const href = notification.post_id
            ? `/forum/${notification.post_id}`
            : notification.type === "new_follower"
              ? `/profile/${notification.actor_id}`
              : "/dashboard"

          return (
            <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
              <Link
                href={href}
                className={`flex items-start gap-3 p-3 ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (!notification.read) handleMarkRead(notification.id)
                }}
              >
                <div className={`mt-0.5 rounded-full p-1.5 ${!notification.read ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`size-3.5 ${!notification.read ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-tight">
                    {actorName && <span className="font-medium">{actorName} </span>}
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
