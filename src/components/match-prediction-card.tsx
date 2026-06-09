"use client"

import { useState, useRef, useTransition } from "react"
import { toast } from "sonner"
import { Lock } from "lucide-react"
import { savePrediction } from "@/lib/actions/predictions"
import { TeamFlag } from "@/components/team-flag"
import { cn } from "@/lib/utils"
import type { MatchVM } from "@/lib/predictions/derive"

interface MatchPredictionCardProps {
  match: MatchVM
}

export function MatchPredictionCard({ match }: MatchPredictionCardProps) {
  const { id: matchId, home, away, kickoffAt, prediction, isLocked } = match

  const [homePick, setHomePick] = useState<string>(
    prediction !== null ? String(prediction.homePick) : "",
  )
  const [awayPick, setAwayPick] = useState<string>(
    prediction !== null ? String(prediction.awayPick) : "",
  )
  const [isSaving, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track prediction at mount time to skip unchanged saves
  const initialPredRef = useRef(prediction)

  const kickoff = new Date(kickoffAt)
  const dateStr = kickoff.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  })
  const timeStr = kickoff.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })

  function scheduleAutosave(homeVal: string, awayVal: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const h = parseInt(homeVal, 10)
      const a = parseInt(awayVal, 10)

      // Client-side validation: skip if values are out of range or empty
      if (
        isNaN(h) || isNaN(a) ||
        h < 0 || h > 99 ||
        a < 0 || a > 99
      ) {
        return
      }

      // Skip if unchanged from initial prediction
      const init = initialPredRef.current
      if (init !== null && init.homePick === h && init.awayPick === a) {
        return
      }

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
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3 flex items-center gap-2 sm:gap-3",
        isLocked && "opacity-70",
      )}
    >
      {/* Home team */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-sm font-medium truncate text-right">
          {home.shortName}
        </span>
        <TeamFlag flagUrl={home.flagUrl} name={home.name} size="sm" />
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
          disabled={isLocked}
          className="w-10 text-center rounded-lg border border-input bg-background px-1 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Bramki ${home.name}`}
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
          disabled={isLocked}
          className="w-10 text-center rounded-lg border border-input bg-background px-1 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Bramki ${away.name}`}
        />
      </div>

      {/* Away team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <TeamFlag flagUrl={away.flagUrl} name={away.name} size="sm" />
        <span className="text-sm font-medium truncate">{away.shortName}</span>
      </div>

      {/* Kickoff + status */}
      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[80px]">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {dateStr} {timeStr}
        </span>
        {isLocked ? (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden />
            Zablokowany
          </span>
        ) : isSaving ? (
          <span className="text-xs text-muted-foreground animate-pulse">
            zapisywanie…
          </span>
        ) : null}
      </div>
    </div>
  )
}
