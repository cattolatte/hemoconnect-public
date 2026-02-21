"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Users,
  UserPlus,
  UserCheck,
  MapPin,
  Calendar,
  Send,
  Sun,
  Link2,
  Pencil,
  HandHeart,
  Award,
  Settings,
  Loader2,
  Sparkles,
  Activity,
  Briefcase,
  GraduationCap,
  Baby,
  Armchair,
  HeartHandshake,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AnimatedCounter } from "@/components/animations/animated-counter"
import { timeAgo, formatJoinDate } from "@/lib/utils/time"
import {
  HEMOPHILIA_TYPE_LABELS,
  SEVERITY_LABELS,
  TREATMENT_LABELS,
  BADGE_LABELS,
} from "@/lib/types/database"
import { toggleFollow } from "@/lib/actions/social"
import { updateProfile, type ProfileUpdateInput } from "@/lib/actions/profile"
import type {
  ProfileWithStats,
  UserBadge,
  BadgeType,
  HemophiliaType,
  SeverityLevel,
  Treatment,
} from "@/lib/types/database"

const BADGE_ICONS: Record<BadgeType, React.ComponentType<{ className?: string }>> = {
  guiding_light: Sun,
  connector: Link2,
  first_post: Pencil,
  helpful: HandHeart,
  active_member: MessageSquare,
  community_builder: Users,
}

const LIFE_STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  student: GraduationCap,
  "young-adult": Sparkles,
  parent: Baby,
  professional: Briefcase,
  retired: Armchair,
  caregiver: HeartHandshake,
}

interface ProfileViewProps {
  profile: ProfileWithStats
  recentPosts: {
    id: string
    title: string
    tags: string[]
    created_at: string
    like_count: number
    comment_count: number
  }[]
  isOwnProfile: boolean
  initialFollowing: boolean
  followerCount: number
  followingCount: number
  badges: UserBadge[]
}

export function ProfileView({
  profile,
  recentPosts,
  isOwnProfile,
  initialFollowing,
  followerCount,
  followingCount,
  badges,
}: ProfileViewProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    hemophilia_type: profile.hemophilia_type || "",
    severity_level: profile.severity_level || "",
    current_treatment: profile.current_treatment || "",
    life_stage: profile.life_stage || "",
  })

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || "User"
  const initials =
    [profile.first_name, profile.last_name]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  const handleFollow = () => {
    startTransition(async () => {
      const result = await toggleFollow(profile.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsFollowing(result.following ?? false)
        toast.success(result.following ? `Following ${profile.first_name}` : "Unfollowed")
      }
    })
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const input: ProfileUpdateInput = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      bio: editForm.bio,
      location: editForm.location,
      hemophilia_type: editForm.hemophilia_type || undefined,
      severity_level: editForm.severity_level || undefined,
      current_treatment: editForm.current_treatment || undefined,
      life_stage: editForm.life_stage || undefined,
    }

    const result = await updateProfile(input)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Profile updated!")
      setEditOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  const openEdit = () => {
    setEditForm({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      bio: profile.bio || "",
      location: profile.location || "",
      hemophilia_type: profile.hemophilia_type || "",
      severity_level: profile.severity_level || "",
      current_treatment: profile.current_treatment || "",
      life_stage: profile.life_stage || "",
    })
    setEditOpen(true)
  }

  const LifeStageIcon = profile.life_stage
    ? LIFE_STAGE_ICONS[profile.life_stage] || User
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Back Link */}
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      {/* ══════════════════════════════════════════
          PROFILE HEADER — Banner + Avatar + Info
          ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden py-0">
          {/* Banner Gradient */}
          <div className="relative h-36 sm:h-44 overflow-hidden bg-gradient-to-br from-primary/50 via-primary/30 to-rose-400/30 dark:from-primary/60 dark:via-primary/40 dark:to-rose-500/30">
            {/* Animated blobs */}
            <motion.div
              className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl"
              animate={{ y: [-8, 8, -8], x: [-4, 4, -4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-1/4 bottom-0 size-28 rounded-full bg-white/10 blur-2xl"
              animate={{ y: [4, -4, 4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
              className="absolute right-1/3 top-1/2 size-16 rounded-full bg-primary/20 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />

            {/* Edit button (overlay on banner) */}
            {isOwnProfile && (
              <motion.div
                className="absolute right-4 top-4 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90"
                  onClick={openEdit}
                >
                  <Settings className="size-3.5" />
                  Edit Profile
                </Button>
              </motion.div>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 pb-6">
            {/* Avatar — overlapping the banner */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
              <motion.div
                className="shrink-0 -mt-14 sm:-mt-16"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {/* Solid background circle behind avatar to mask the banner gradient */}
                <div className="rounded-full bg-background p-1">
                  <Avatar className="size-26 sm:size-30 border-2 border-primary/20 shadow-xl">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-3xl sm:text-4xl font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </motion.div>

              {/* Name + meta + actions — beside avatar on desktop, below on mobile */}
              <motion.div
                className="mt-3 sm:mt-0 flex-1 min-w-0 sm:pb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold sm:text-3xl">{fullName}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {profile.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          {profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        Joined {formatJoinDate(profile.created_at)}
                      </span>
                      {LifeStageIcon && profile.life_stage && (
                        <span className="flex items-center gap-1.5 capitalize">
                          <LifeStageIcon className="size-3.5 shrink-0" />
                          {profile.life_stage.replace("-", " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — follow / message */}
                  {!isOwnProfile && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        className="gap-1.5"
                        onClick={handleFollow}
                        disabled={isPending}
                      >
                        {isFollowing ? (
                          <><UserCheck className="size-4" /> Following</>
                        ) : (
                          <><UserPlus className="size-4" /> Follow</>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Send className="size-4" /> Message
                      </Button>
                    </div>
                  )}
                </div>

                {/* Clinical badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.hemophilia_type && (
                    <Badge className="text-xs">{HEMOPHILIA_TYPE_LABELS[profile.hemophilia_type as HemophiliaType]}</Badge>
                  )}
                  {profile.severity_level && (
                    <Badge variant="secondary" className="text-xs">
                      {SEVERITY_LABELS[profile.severity_level as SeverityLevel]}
                    </Badge>
                  )}
                  {profile.current_treatment && (
                    <Badge variant="outline" className="text-xs">
                      {TREATMENT_LABELS[profile.current_treatment as Treatment]}
                    </Badge>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Stats Row */}
            <Separator className="mt-5 mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Posts", value: profile.post_count, icon: MessageSquare },
                { label: "Connections", value: profile.connection_count, icon: Users },
                { label: "Followers", value: followerCount, icon: Heart },
                { label: "Following", value: followingCount, icon: UserPlus },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 rounded-lg py-2 transition-colors hover:bg-muted/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                >
                  <span className="text-xl font-bold sm:text-2xl">
                    <AnimatedCounter value={stat.value} suffix="" duration={1} />
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <stat.icon className="size-3" />
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════
          TABBED CONTENT — About / Activity / Badges
          ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="about" className="gap-1.5">
              <User className="size-3.5" />
              About
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="size-3.5" />
              Activity
            </TabsTrigger>
            {badges.length > 0 && (
              <TabsTrigger value="badges" className="gap-1.5">
                <Award className="size-3.5" />
                Badges
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {badges.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ─── About Tab ─── */}
          <TabsContent value="about" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Bio — takes up 2 columns */}
              <Card className="md:col-span-2 hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {profile.bio || (
                      <span className="italic text-muted-foreground/60">
                        {isOwnProfile
                          ? "You haven't written a bio yet. Click \"Edit Profile\" to tell the community about yourself!"
                          : "This user hasn't written a bio yet."}
                      </span>
                    )}
                  </p>

                  {(profile.life_stage || profile.age_range) && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex flex-wrap gap-6 text-sm">
                        {profile.life_stage && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Life Stage</p>
                            <Badge variant="secondary" className="capitalize">
                              {profile.life_stage.replace("-", " ")}
                            </Badge>
                          </div>
                        )}
                        {profile.age_range && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Age Range</p>
                            <Badge variant="outline" className="capitalize">
                              {profile.age_range.replace("-", " ").replace("plus", "+")}
                            </Badge>
                          </div>
                        )}
                        {profile.factor_level !== null && profile.factor_level !== undefined && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Factor Level</p>
                            <Badge variant="outline">{profile.factor_level}%</Badge>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Interests — sidebar column */}
              <Card className="hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.topics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.topics.map((topic, i) => (
                        <motion.div
                          key={topic}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * i }}
                        >
                          <Badge
                            variant="outline"
                            className="transition-colors hover:bg-primary/10 hover:border-primary/30"
                          >
                            {topic}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">
                      {isOwnProfile
                        ? "No interests added yet. Edit your profile to add some!"
                        : "No interests listed."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Activity Tab ─── */}
          <TabsContent value="activity" className="mt-4">
            <Card className="hover-glow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPosts.length > 0 ? (
                  <div className="space-y-1">
                    {recentPosts.map((post, i) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.3 }}
                      >
                        <Link
                          href={`/forum/${post.id}`}
                          className="group flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm group-hover:text-primary transition-colors">
                              {post.title}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{timeAgo(post.created_at)}</span>
                              <span className="flex items-center gap-1">
                                <Heart className="size-3" />
                                {post.like_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="size-3" />
                                {post.comment_count}
                              </span>
                            </div>
                          </div>
                          {post.tags[0] && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {post.tags[0]}
                            </Badge>
                          )}
                        </Link>
                        {i < recentPosts.length - 1 && <Separator />}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MessageSquare className="mx-auto size-8 text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isOwnProfile
                        ? "You haven't posted anything yet. Head to the forum to start a discussion!"
                        : "No posts yet."}
                    </p>
                    {isOwnProfile && (
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link href="/forum">Go to Forum</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Badges Tab ─── */}
          {badges.length > 0 && (
            <TabsContent value="badges" className="mt-4">
              <Card className="hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="size-4 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {badges.map((badge, i) => {
                        const info = BADGE_LABELS[badge.badge_type]
                        const Icon = BADGE_ICONS[badge.badge_type]
                        return (
                          <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.08 * i }}
                                className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-primary/5 via-transparent to-transparent p-4 transition-all hover:border-primary/30 hover:shadow-md cursor-default"
                              >
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                                  <Icon className="size-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">{info.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {timeAgo(badge.earned_at)}
                                  </p>
                                </div>
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="max-w-[200px] text-center text-xs">{info.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      {/* ══════════════════════════════════════════
          EDIT PROFILE DIALOG
          ══════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal info and clinical details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, first_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, last_name: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Tell the community about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editForm.bio.length}/500
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="e.g., New York, USA"
              />
            </div>

            <Separator />

            {/* Clinical Info */}
            <p className="text-sm font-medium text-muted-foreground">Clinical Information</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hemophilia Type</Label>
                <Select
                  value={editForm.hemophilia_type}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, hemophilia_type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEMOPHILIA_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={editForm.severity_level}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, severity_level: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Treatment</Label>
                <Select
                  value={editForm.current_treatment}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, current_treatment: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TREATMENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Life Stage</Label>
                <Select
                  value={editForm.life_stage}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, life_stage: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select life stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="young-adult">Young Adult</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="caregiver">Caregiver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
