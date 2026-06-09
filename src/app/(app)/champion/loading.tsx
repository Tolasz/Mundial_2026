import { Skeleton } from "@/components/ui/skeleton"

export default function ChampionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* Group sections skeleton (4 groups × 4 teams) */}
      {Array.from({ length: 4 }).map((_, g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-3.5 w-16" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
