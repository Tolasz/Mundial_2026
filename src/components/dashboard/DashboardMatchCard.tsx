"use client"

import { useState, useRef, useTransition } from "react"
import { toast } from "sonner"
import { TeamFlag } from "@/components/team-flag"
import { savePrediction } from "@/lib/actions/predictions"
import { countdownLabel } from "@/lib/dashboard/derive"
import { cn } from "@/lib/utils"
import type { DashboardMatchVM } from "@/lib/dashboard/derive"

interface DashboardMatchCardProps {
  match: DashboardMatchVM
  now: Date
}

export function DashboardMatchCard({ match, now }: DashboardMatchCardProps) {
  const { id: matchId, home, away, kickoffAt, prediction } = match

  const [homePick, setHomePick] = useState<string>(
    prediction !== null ? String(prediction.homePick) : "",
  )
  const [awayPick, setAwayPick] = useState<string>(
    prediction !== null ? String(prediction.awayPick) : "",
  )
  const [isSaving, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialPredRef = useRef(prediction)

  const countdown = countdownLabel(kickoffAt, now)
  const label =
    match.stage === "group" && match.group
      ? `Grupa ${match.group}`
      : (match.roundLabel ?? match.stage)

  const hasPrediction = homePick !== "" && awayPick !== ""

  function scheduleAutosave(homeVal: string, awayVal: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const h = parseInt(homeVal, 10)
      const a = parseInt(awayVal, 10)

      if (isNaN(h) || isNaN(a) || h < 0 || h > 99 || a < 0 || a > 99) return

      const init = initialPredRef.current
      if (init !== null && init.homePick === h && init.awayPick === a) return

      startTransition(async () => {
        const result = await savePrediction({ matchId, homePick: h, awayPick: a })
        if (result.success) {
          initialPredRef.current = { homePick: h, awayPick: a }
          toast.success("Zapisano typ")
        } else {
          toast.error(result.error)
        }
      })
    }, 600)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      {/* Header: label + countdown */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-primary">{countdown}</span>
      </div>

      {/* Teams + score inputs */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {home && (
            <TeamFlag flagUrl={home.flagUrl} name={home.name} size="md" />
          )}
          <span className="text-sm font-medium truncate">
            {home?.shortName ?? "?"}
          </span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={homePick}
            onChange={(e) => {
              setHomePick(e.target.value)
              scheduleAutosave(e.target.value, awayPick)
            }}
            placeholder="–"
            className="w-10 text-center rounded-lg border border-input bg-background px-1 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label={`Bramki ${home?.name}`}
          />
          <span className="text-muted-foreground font-bold select-none">:</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={awayPick}
            onChange={(e) => {
              setAwayPick(e.target.value)
              scheduleAutosave(homePick, e.target.value)
            }}
            placeholder="–"
            className="w-10 text-center rounded-lg border border-input bg-background px-1 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label={`Bramki ${away?.name}`}
          />
        </div>

        {/* Away */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <span className="text-sm font-medium truncate text-right">
            {away?.shortName ?? "?"}
          </span>
          {away && (
            <TeamFlag flagUrl={away.flagUrl} name={away.name} size="md" />
          )}
        </div>
      </div>

      {/* Status row */}
      <div className="mt-2 flex justify-center">
        {isSaving ? (
          <span className="text-xs text-muted-foreground animate-pulse">
            zapisywanie…
          </span>
        ) : hasPrediction ? (
          <span className={cn("text-xs font-medium text-green-600 dark:text-green-400")}>
            Obstawiono: {homePick}:{awayPick}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Wpisz wynik, aby obstawić
          </span>
        )}
      </div>
    </div>
  )
}
