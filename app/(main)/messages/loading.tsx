import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function MessagesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Card className="flex h-[calc(100vh-12rem)] overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r p-3 space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        <div className="flex flex-1 flex-col">
          <div className="border-b p-4 flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-12 rounded-xl ${i % 2 === 0 ? "w-48" : "w-40"}`} />
              </div>
            ))}
          </div>
          <div className="border-t p-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>
    </div>
  )
}
