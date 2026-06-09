import { Skeleton } from "@/components/ui/skeleton"

export default function PredictionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header + progress */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-7 w-16 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Toolbar skeleton */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-14 rounded-md" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Group stage cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-20" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  )
}
