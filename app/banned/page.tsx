"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Ban, Clock, Heart } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"

function BannedContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") // "banned" | "suspended"
  const reason = searchParams.get("reason")
  const until = searchParams.get("until")

  const isSuspended = type === "suspended"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Heart className="size-5 text-primary" />
        </div>
        <span className="text-xl font-semibold">HemoConnect</span>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            {isSuspended ? (
              <Clock className="size-7 text-amber-600" />
            ) : (
              <Ban className="size-7 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSuspended ? "Account Suspended" : "Account Banned"}
          </CardTitle>
          <CardDescription>
            {isSuspended
              ? "Your account has been temporarily suspended."
              : "Your account has been permanently banned from HemoConnect."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {reason && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Reason</p>
              <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
            </div>
          )}

          {isSuspended && until && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-50 p-4 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Suspension Expires
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(until).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {isSuspended
              ? "You will regain access after the suspension period ends. Please check back later."
              : "If you believe this was a mistake, please contact the community administrators."}
          </p>

          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BannedPage() {
  return (
    <Suspense>
      <BannedContent />
    </Suspense>
  )
}
