import { Skeleton } from "@/components/ui/skeleton"

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />

      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-3 pt-2">
        {/* 2nd place */}
        <Skeleton className="h-28 w-28 rounded-xl" />
        {/* 1st place (taller) */}
        <Skeleton className="h-36 w-28 rounded-xl" />
        {/* 3rd place */}
        <Skeleton className="h-24 w-28 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border">
        <div className="h-10 bg-muted/50 border-b" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 border-b last:border-0">
            <Skeleton className="h-4 w-6 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
