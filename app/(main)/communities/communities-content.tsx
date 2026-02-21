"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users,
  Heart,
  Shield,
  Plane,
  Dumbbell,
  Baby,
  Brain,
  Apple,
  Dna,
  FileText,
  Briefcase,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { joinCommunity, leaveCommunity } from "@/lib/actions/communities"
import type { MicroCommunityWithMembership } from "@/lib/types/database"

const iconMap: Record<string, typeof Users> = {
  Users,
  Heart,
  Shield,
  Plane,
  Dumbbell,
  Baby,
  Brain,
  Apple,
  Dna,
  FileText,
  Briefcase,
}

interface CommunitiesContentProps {
  communities: MicroCommunityWithMembership[]
}

export function CommunitiesContent({ communities }: CommunitiesContentProps) {
  const [membershipState, setMembershipState] = useState<Record<string, boolean>>(
    Object.fromEntries(communities.map((c) => [c.id, c.is_member]))
  )
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>(
    Object.fromEntries(communities.map((c) => [c.id, c.member_count]))
  )
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleMembership = (communityId: string, isMember: boolean) => {
    setLoadingId(communityId)
    startTransition(async () => {
      if (isMember) {
        const result = await leaveCommunity(communityId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setMembershipState((prev) => ({ ...prev, [communityId]: false }))
          setMemberCounts((prev) => ({
            ...prev,
            [communityId]: Math.max(0, (prev[communityId] || 0) - 1),
          }))
          toast.success("Left community")
        }
      } else {
        const result = await joinCommunity(communityId)
        if (result.error) {
          toast.error(result.error)
        } else {
          setMembershipState((prev) => ({ ...prev, [communityId]: true }))
          setMemberCounts((prev) => ({
            ...prev,
            [communityId]: (prev[communityId] || 0) + 1,
          }))
          toast.success("Joined community!")
        }
      }
      setLoadingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Users className="size-8 text-primary" />
          Micro-Communities
        </h1>
        <p className="mt-1 text-muted-foreground">
          Join groups based on shared experiences and interests
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community, i) => {
          const Icon = iconMap[community.icon] || Users
          const isMember = membershipState[community.id]

          return (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Card className="hover-lift hover-glow h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <Icon className="size-5 text-primary" />
                    </div>
                    {isMember && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Member
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">
                    <Button asChild variant="link" className="h-auto p-0 text-left text-lg font-semibold">
                      <Link href={`/communities/${community.id}`}>
                        {community.name}
                      </Link>
                    </Button>
                  </CardTitle>
                  <CardDescription>{community.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="size-3.5" />
                    {memberCounts[community.id] ?? community.member_count} members
                  </span>
                  <Button
                    variant={isMember ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleMembership(community.id, isMember)}
                    disabled={isPending && loadingId === community.id}
                  >
                    {isPending && loadingId === community.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isMember ? (
                      "Leave"
                    ) : (
                      "Join"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {communities.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No communities available yet. Run the Phase 4 migration to seed communities.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
