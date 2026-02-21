"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Heart,
  LayoutDashboard,
  MessageSquare,
  Mail,
  BookOpen,
  Bookmark,
  Users,
  Settings,
  ShieldCheck,
  MessageSquareHeart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UserNav } from "@/components/shared/UserNav"
import { cn } from "@/lib/utils"
import type { UserData } from "@/lib/actions/user"
import type { UserRole } from "@/lib/types/database"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/resources", label: "Resources", icon: BookOpen },
]

interface SidebarProps {
  user: UserData
  userRole: UserRole | null
}

export function Sidebar({ user, userRole }: SidebarProps) {
  const isAdmin = userRole === "admin" || userRole === "moderator"
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar/80 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Button asChild variant="ghost" className="gap-2 px-2">
          <Link href="/dashboard">
            <motion.div
              className="flex size-8 items-center justify-center rounded-full bg-primary/10"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Heart className="size-4 text-primary" />
            </motion.div>
            <span className="text-lg font-semibold">HemoConnect</span>
          </Link>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "relative justify-start transition-all duration-200",
                  isActive && "font-medium"
                )}
              >
                <Link href={item.href}>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-md bg-secondary"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className={cn(
                      "size-4 transition-colors",
                      isActive && "text-primary"
                    )} />
                    {item.label}
                  </span>
                </Link>
              </Button>
            )
          })}
        </nav>

        <Separator className="my-4" />

        <nav className="flex flex-col gap-1">
          <Button
            asChild
            variant={pathname.startsWith("/profile") ? "secondary" : "ghost"}
            className="justify-start transition-all duration-200"
          >
            <Link href="/profile/setup">
              <Settings className={cn(
                "size-4 transition-colors",
                pathname.startsWith("/profile") && "text-primary"
              )} />
              Profile Setup
            </Link>
          </Button>

          <Button
            asChild
            variant={pathname.startsWith("/feedback") ? "secondary" : "ghost"}
            className="justify-start transition-all duration-200"
          >
            <Link href="/feedback">
              <MessageSquareHeart className={cn(
                "size-4 transition-colors",
                pathname.startsWith("/feedback") && "text-primary"
              )} />
              Feedback
            </Link>
          </Button>

          {isAdmin && (
            <Button
              asChild
              variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
              className="justify-start transition-all duration-200"
            >
              <Link href="/admin">
                <ShieldCheck className={cn(
                  "size-4 transition-colors",
                  pathname.startsWith("/admin") && "text-primary"
                )} />
                Admin
              </Link>
            </Button>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t px-3 py-3">
        <UserNav user={user} />
      </div>
    </aside>
  )
}
