import Link from "next/link"
import { TeamFlag } from "@/components/team-flag"
import { countdownLabel } from "@/lib/dashboard/derive"
import type { DashboardMatchVM } from "@/lib/dashboard/derive"

interface UpcomingMatchesProps {
  matches: DashboardMatchVM[]
  now: Date
}

export function UpcomingMatches({ matches, now }: UpcomingMatchesProps) {
  if (matches.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Najbliższe mecze</h2>
        <p className="text-muted-foreground text-sm">
          Brak nadchodzących meczów.
        </p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Najbliższe mecze</h2>
        <Link
          href="/predictions"
          className="text-sm text-primary hover:underline"
        >
          Wszystkie typy →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <UpcomingMatchCard key={m.id} match={m} now={now} />
        ))}
      </div>
    </section>
  )
}

function UpcomingMatchCard({
  match,
  now,
}: {
  match: DashboardMatchVM
  now: Date
}) {
  const countdown = countdownLabel(match.kickoffAt, now)
  const label =
    match.stage === "group" && match.group
      ? `Grupa ${match.group}`
      : (match.roundLabel ?? match.stage)

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-primary">{countdown}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {match.home && (
            <TeamFlag
              flagUrl={match.home.flagUrl}
              name={match.home.name}
              size="md"
            />
          )}
          <span className="text-sm font-medium truncate">
            {match.home?.shortName ?? "?"}
          </span>
        </div>

        <span className="text-sm font-bold text-muted-foreground shrink-0">
          vs
        </span>

        {/* Away */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <span className="text-sm font-medium truncate text-right">
            {match.away?.shortName ?? "?"}
          </span>
          {match.away && (
            <TeamFlag
              flagUrl={match.away.flagUrl}
              name={match.away.name}
              size="md"
            />
          )}
        </div>
      </div>
    </div>
  )
}
