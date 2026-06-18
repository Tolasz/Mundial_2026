import Link from "next/link"
import { CalendarX } from "lucide-react"
import { DashboardMatchCard } from "@/components/dashboard/DashboardMatchCard"
import type { DashboardMatchVM } from "@/lib/dashboard/derive"

interface UpcomingMatchesProps {
  matches: DashboardMatchVM[]
  now: Date
}

export function UpcomingMatches({ matches, now }: UpcomingMatchesProps) {
  if (matches.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Najbliższe mecze (24h)</h2>
        <div className="flex flex-col items-center gap-3 py-10 rounded-xl border border-dashed border-border text-center">
          <CalendarX className="size-9 text-muted-foreground/30" aria-hidden />
          <p className="text-sm text-muted-foreground">Brak nadchodzących meczów.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Najbliższe mecze (24h)</h2>
        <Link
          href="/predictions"
          className="text-sm text-primary hover:underline"
        >
          Wszystkie typy →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <DashboardMatchCard key={m.id} match={m} now={now} />
        ))}
      </div>
    </section>
  )
}
