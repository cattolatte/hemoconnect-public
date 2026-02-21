"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[HemoConnect Messages Error]", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 justify-center">
              <Mail className="size-5" />
              Messages Error
            </h2>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load your messages. Please try again.
            </p>
          </div>
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            Reload Messages
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
