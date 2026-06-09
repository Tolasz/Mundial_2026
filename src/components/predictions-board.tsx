"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import type {
  MatchVM,
  PendingKnockoutVM,
  FilterState,
  SortDir,
} from "@/lib/predictions/derive"
import { filterMatches, sortMatches } from "@/lib/predictions/derive"
import { PredictionsToolbar } from "@/components/predictions-toolbar"
import { MatchPredictionCard } from "@/components/match-prediction-card"
import { OthersPredictions } from "@/components/others-predictions"

const KNOCKOUT_STAGES = ["r32", "r16", "qf", "sf", "final"] as const

const STAGE_LABELS: Record<string, string> = {
  r32: "1/16 finału",
  r16: "1/8 finału",
  qf: "Ćwierćfinały",
  sf: "Półfinały",
  final: "Finał",
}

interface PredictionsBoardProps {
  matches: MatchVM[]
  pendingKnockoutMatches: PendingKnockoutVM[]
  availableGroups: string[]
  totalCount: number
}

export function PredictionsBoard({
  matches,
  pendingKnockoutMatches,
  availableGroups,
  totalCount,
}: PredictionsBoardProps) {
  const [filter, setFilter] = useState<FilterState>({
    group: "all",
    status: "all",
    query: "",
  })
  const [sortDir, setSortDir] = useState<SortDir>("grouped")

  const filledCount = matches.filter((m) => m.predictionStatus !== "empty").length
  const filtered = sortMatches(filterMatches(matches, filter), sortDir)

  // Split into group stage and knockout
  const groupMatches = filtered.filter((m) => m.stage === "group")
  const knockoutMatches = filtered.filter((m) => m.stage !== "group")

  // Group stage: group by group letter
  const groupsMap = new Map<string, MatchVM[]>()
  for (const m of groupMatches) {
    const g = m.group ?? "?"
    if (!groupsMap.has(g)) groupsMap.set(g, [])
    groupsMap.get(g)!.push(m)
  }
  const sortedGroupKeys = [...groupsMap.keys()].sort()

  // Knockout: group by stage
  const knockoutByStage = new Map<string, MatchVM[]>()
  for (const m of knockoutMatches) {
    if (!knockoutByStage.has(m.stage)) knockoutByStage.set(m.stage, [])
    knockoutByStage.get(m.stage)!.push(m)
  }

  // Pending knockout by stage (always shown, not filtered)
  const pendingByStage = new Map<string, PendingKnockoutVM[]>()
  for (const m of pendingKnockoutMatches) {
    if (!pendingByStage.has(m.stage)) pendingByStage.set(m.stage, [])
    pendingByStage.get(m.stage)!.push(m)
  }

  const hasKnockoutSection =
    knockoutMatches.length > 0 || pendingKnockoutMatches.length > 0
  const hasGroupSection = sortedGroupKeys.length > 0
  const isEmpty = filtered.length === 0 && pendingKnockoutMatches.length === 0

  return (
    <div className="space-y-6">
      {/* Header + progress (sticky on mobile) */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 bg-background/95 backdrop-blur-sm border-b sm:static sm:mx-0 sm:px-0 sm:pt-0 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold">Typy meczów</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Typy można zmieniać do momentu startu meczu.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold tabular-nums">
              <span className="text-primary">{filledCount}</span>
              <span className="text-muted-foreground text-base font-normal">
                /{totalCount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">wytypowanych</p>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width:
                totalCount > 0
                  ? `${Math.round((filledCount / totalCount) * 100)}%`
                  : "0%",
            }}
            role="progressbar"
            aria-valuenow={filledCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-label="Postęp typowania"
          />
        </div>
      </div>

      {/* Toolbar */}
      <PredictionsToolbar
        availableGroups={availableGroups}
        filter={filter}
        sortDir={sortDir}
        onFilterChange={setFilter}
        onSortDirChange={setSortDir}
      />

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Search className="size-10 text-muted-foreground/30" aria-hidden />
          <div>
            <p className="font-medium text-muted-foreground">Brak meczów</p>
            <p className="text-sm text-muted-foreground/60 mt-0.5">
              Zmień filtry, aby zobaczyć mecze.
            </p>
          </div>
        </div>
      )}

      {/* Flat date view (sortDir asc/desc) */}
      {!isEmpty && sortDir !== "grouped" && (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id}>
              <MatchPredictionCard match={m} />
              {m.isLocked && m.otherPredictions.length > 0 && (
                <OthersPredictions predictions={m.otherPredictions} />
              )}
            </div>
          ))}
          {pendingKnockoutMatches.map((m) => (
            <KnockoutPendingCard key={m.id} match={m} />
          ))}
        </div>
      )}

      {/* Group stage */}
      {hasGroupSection && sortDir === "grouped" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Faza grupowa</h2>
          {sortedGroupKeys.map((g) => (
            <section key={g} aria-label={`Grupa ${g}`}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Grupa {g}
              </h3>
              <div className="space-y-2">
                {groupsMap.get(g)!.map((m) => (
                  <div key={m.id}>
                    <MatchPredictionCard match={m} />
                    {m.isLocked && m.otherPredictions.length > 0 && (
                      <OthersPredictions predictions={m.otherPredictions} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Knockout stages */}
      {hasKnockoutSection && sortDir === "grouped" && (
        <div className="space-y-6 pt-4 border-t">
          <div>
            <h2 className="text-lg font-semibold">Faza pucharowa</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Typowanie dostępne po ustaleniu par. Mecze rozliczane po 90 min.
            </p>
          </div>
          {KNOCKOUT_STAGES.map((stage) => {
            const stageMatches = knockoutByStage.get(stage) ?? []
            const pendingMatches = pendingByStage.get(stage) ?? []
            if (!stageMatches.length && !pendingMatches.length) return null
            return (
              <section key={stage} aria-label={STAGE_LABELS[stage]}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {STAGE_LABELS[stage]}
                </h3>
                <div className="space-y-2">
                  {stageMatches.map((m) => (
                    <div key={m.id}>
                      <MatchPredictionCard match={m} />
                      {m.isLocked && m.otherPredictions.length > 0 && (
                        <OthersPredictions predictions={m.otherPredictions} />
                      )}
                    </div>
                  ))}
                  {pendingMatches.map((m) => (
                    <KnockoutPendingCard key={m.id} match={m} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function KnockoutPendingCard({ match }: { match: PendingKnockoutVM }) {
  const kickoff = new Date(match.kickoffAt)
  const dateStr = kickoff.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  })
  const timeStr = kickoff.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between opacity-50">
      <span className="text-sm text-muted-foreground italic">
        {match.roundLabel ?? "Para TBD"}
      </span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {dateStr} {timeStr}
      </span>
    </div>
  )
}
