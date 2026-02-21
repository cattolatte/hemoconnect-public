"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Users,
  Shield,
  Crown,
  CheckCircle2,
  Ban,
  Clock,
  Trash2,
  MoreHorizontal,
  FileX2,
  ShieldOff,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  updateUserRole,
  banUser,
  unbanUser,
  suspendUser,
  unsuspendUser,
  deleteUser,
  deleteUserPosts,
} from "@/lib/actions/admin"
import { HEMOPHILIA_TYPE_LABELS } from "@/lib/types/database"
import type { UserRole, HemophiliaType } from "@/lib/types/database"
import { timeAgo } from "@/lib/utils/time"

interface UserItem {
  id: string
  first_name: string
  last_name: string
  role: string
  hemophilia_type: string | null
  profile_setup_complete: boolean
  banned_at: string | null
  ban_reason: string | null
  suspended_until: string | null
  suspension_reason: string | null
  created_at: string
}

interface UsersListProps {
  users: UserItem[]
}

type DialogState =
  | { type: "none" }
  | { type: "ban"; userId: string; userName: string }
  | { type: "suspend"; userId: string; userName: string }
  | { type: "delete"; userId: string; userName: string }

export function UsersList({ users: initialUsers }: UsersListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<DialogState>({ type: "none" })
  const [banReason, setBanReason] = useState("")
  const [suspendDays, setSuspendDays] = useState("7")
  const [suspendReason, setSuspendReason] = useState("")

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole as UserRole)
      if (result.error) {
        toast.error(result.error)
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
        toast.success(`Role updated to ${newRole}`)
      }
    })
  }

  const handleBan = () => {
    if (dialog.type !== "ban") return
    const userId = dialog.userId
    startTransition(async () => {
      const result = await banUser(userId, banReason)
      if (result.error) {
        toast.error(result.error)
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, banned_at: new Date().toISOString(), ban_reason: banReason }
              : u
          )
        )
        toast.success("User banned")
      }
      setDialog({ type: "none" })
      setBanReason("")
    })
  }

  const handleUnban = (userId: string) => {
    startTransition(async () => {
      const result = await unbanUser(userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, banned_at: null, ban_reason: null } : u
          )
        )
        toast.success("User unbanned")
      }
    })
  }

  const handleSuspend = () => {
    if (dialog.type !== "suspend") return
    const userId = dialog.userId
    const days = parseInt(suspendDays) || 7
    startTransition(async () => {
      const result = await suspendUser(userId, days, suspendReason)
      if (result.error) {
        toast.error(result.error)
      } else {
        const until = new Date()
        until.setDate(until.getDate() + days)
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, suspended_until: until.toISOString(), suspension_reason: suspendReason }
              : u
          )
        )
        toast.success(`User suspended for ${days} days`)
      }
      setDialog({ type: "none" })
      setSuspendDays("7")
      setSuspendReason("")
    })
  }

  const handleUnsuspend = (userId: string) => {
    startTransition(async () => {
      const result = await unsuspendUser(userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, suspended_until: null, suspension_reason: null }
              : u
          )
        )
        toast.success("Suspension lifted")
      }
    })
  }

  const handleDelete = () => {
    if (dialog.type !== "delete") return
    const userId = dialog.userId
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        toast.success("User deleted permanently")
      }
      setDialog({ type: "none" })
    })
  }

  const handleDeletePosts = (userId: string, userName: string) => {
    startTransition(async () => {
      const result = await deleteUserPosts(userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`All posts by ${userName} deleted`)
      }
    })
  }

  const getUserStatus = (user: UserItem) => {
    if (user.banned_at) return "banned"
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) return "suspended"
    return "active"
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
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {users.map((user, i) => {
            const fullName =
              `${user.first_name} ${user.last_name}`.trim() || "Unnamed User"
            const initials =
              [user.first_name, user.last_name]
                .filter(Boolean)
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"
            const status = getUserStatus(user)

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4"
              >
                <Avatar className={status === "banned" ? "opacity-40" : ""}>
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      asChild
                      variant="link"
                      className="h-auto p-0 text-base font-medium"
                    >
                      <Link href={`/profile/${user.id}`}>{fullName}</Link>
                    </Button>
                    {user.profile_setup_complete && (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                    {status === "banned" && (
                      <Badge variant="destructive" className="text-xs">Banned</Badge>
                    )}
                    {status === "suspended" && (
                      <Badge className="bg-amber-500 text-white text-xs">Suspended</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {user.hemophilia_type && (
                      <span className="truncate">
                        {HEMOPHILIA_TYPE_LABELS[user.hemophilia_type as HemophiliaType] ?? user.hemophilia_type}
                      </span>
                    )}
                    <span>&middot;</span>
                    <span className="shrink-0">Joined {timeAgo(user.created_at)}</span>
                  </div>
                  {status === "banned" && user.ban_reason && (
                    <p className="mt-0.5 text-xs text-destructive">
                      Reason: {user.ban_reason}
                    </p>
                  )}
                  {status === "suspended" && user.suspended_until && (
                    <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                      Until: {new Date(user.suspended_until).toLocaleDateString()}
                      {user.suspension_reason && ` — ${user.suspension_reason}`}
                    </p>
                  )}
                </div>

                {/* Role selector */}
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <span className="flex items-center gap-2">
                        <Users className="size-3.5" /> User
                      </span>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <span className="flex items-center gap-2">
                        <Shield className="size-3.5" /> Moderator
                      </span>
                    </SelectItem>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2">
                        <Crown className="size-3.5" /> Admin
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {status === "banned" ? (
                      <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                        <ShieldOff className="mr-2 size-4" />
                        Unban User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => setDialog({ type: "ban", userId: user.id, userName: fullName })}
                      >
                        <Ban className="mr-2 size-4" />
                        Ban User
                      </DropdownMenuItem>
                    )}
                    {status === "suspended" ? (
                      <DropdownMenuItem onClick={() => handleUnsuspend(user.id)}>
                        <Clock className="mr-2 size-4" />
                        Lift Suspension
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => setDialog({ type: "suspend", userId: user.id, userName: fullName })}
                      >
                        <Clock className="mr-2 size-4" />
                        Suspend User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeletePosts(user.id, fullName)}
                    >
                      <FileX2 className="mr-2 size-4" />
                      Delete All Posts
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDialog({ type: "delete", userId: user.id, userName: fullName })}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={dialog.type === "ban"} onOpenChange={() => setDialog({ type: "none" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Permanently ban {dialog.type === "ban" ? dialog.userName : ""} from the platform.
              They will not be able to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Input
              id="ban-reason"
              placeholder="Enter reason for ban..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ type: "none" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={isPending}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={dialog.type === "suspend"} onOpenChange={() => setDialog({ type: "none" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Temporarily suspend {dialog.type === "suspend" ? dialog.userName : ""}.
              They cannot access the platform until the suspension expires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-days">Duration</Label>
              <Select value={suspendDays} onValueChange={setSuspendDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason</Label>
              <Input
                id="suspend-reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ type: "none" })}>
              Cancel
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSuspend} disabled={isPending}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog.type === "delete"} onOpenChange={() => setDialog({ type: "none" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User Permanently</DialogTitle>
            <DialogDescription>
              This will permanently delete {dialog.type === "delete" ? dialog.userName : ""} and all
              their data including posts, comments, and messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ type: "none" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
