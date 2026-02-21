"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"
import { Sidebar } from "@/components/shared/Sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { NotificationBell } from "@/components/shared/NotificationBell"
import type { UserData } from "@/lib/actions/user"
import type { UserRole } from "@/lib/types/database"

interface MainLayoutClientProps {
  children: React.ReactNode
  user: UserData
  unreadNotifications: number
  userRole: UserRole | null
}

export function MainLayoutClient({ children, user, unreadNotifications, userRole }: MainLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:sticky md:top-0 md:h-screen">
        <Sidebar user={user} userRole={userRole} />
      </div>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b glass px-4 md:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar user={user} userRole={userRole} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {user && (
            <NotificationBell
              initialCount={unreadNotifications}
              userId={user.id}
            />
          )}
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
