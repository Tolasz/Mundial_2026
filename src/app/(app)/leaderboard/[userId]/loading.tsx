import { Skeleton } from "@/components/ui/skeleton"

export default function PlayerHistoryLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      {/* Distribution bar skeleton */}
      <Skeleton className="h-28 w-full rounded-xl" />
      {/* History table skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="h-10 bg-muted/50 border-b" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 border-b last:border-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-14 shrink-0" />
            <Skeleton className="h-4 w-14 shrink-0" />
            <Skeleton className="h-4 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
