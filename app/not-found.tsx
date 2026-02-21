import Link from "next/link"
import { Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-6 py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="size-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              HemoConnect
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-xl font-semibold">Page Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
          </div>

          <Button asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Go Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
