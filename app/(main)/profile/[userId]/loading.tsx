import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Banner + Avatar */}
      <Card className="overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <CardContent className="relative pt-0">
          <div className="-mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <Skeleton className="size-24 rounded-full border-4 border-background" />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <Skeleton className="mx-auto h-7 w-40 sm:mx-0" />
              <Skeleton className="mx-auto h-4 w-28 sm:mx-0" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="mx-auto h-8 w-12" />
              <Skeleton className="mx-auto mt-1 h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clinical Info */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-32 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  )
}
