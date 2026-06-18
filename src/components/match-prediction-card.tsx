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
  const {
    id: matchId,
    home,
    away,
    kickoffAt,
    prediction,
    pointsAwarded,
    isLocked,
    status,
    result,
  } = match

  const isFinished = status === "finished" && result !== null
  const isLive = status === "live" && result !== null

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

  // Color the user's prediction badge based on points awarded
  const pointsColor =
    pointsAwarded === 3
      ? "text-green-600 dark:text-green-400"
      : pointsAwarded === 1
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-muted-foreground"

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3 flex items-center gap-2 sm:gap-3",
        isLocked && !isFinished && "opacity-70",
        isFinished &&
          pointsAwarded === 3 &&
          "border-green-500/40 bg-green-500/5",
        isFinished &&
          pointsAwarded === 1 &&
          "border-yellow-500/40 bg-yellow-500/5",
      )}
    >
      {/* Home team */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-sm font-medium truncate text-right">
          {home.shortName}
        </span>
        <TeamFlag flagUrl={home.flagUrl} name={home.name} size="sm" />
      </div>

      {/* Score: actual result (read-only) when finished/live, otherwise inputs */}
      {isFinished || isLive ? (
        <div
          className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg bg-muted/60"
          aria-label={`Wynik: ${result!.homeScore}:${result!.awayScore}`}
        >
          <span className="w-6 text-center text-base font-bold tabular-nums">
            {result!.homeScore}
          </span>
          <span className="text-muted-foreground font-bold select-none">:</span>
          <span className="w-6 text-center text-base font-bold tabular-nums">
            {result!.awayScore}
          </span>
        </div>
      ) : (
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
      )}

      {/* Away team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <TeamFlag flagUrl={away.flagUrl} name={away.name} size="sm" />
        <span className="text-sm font-medium truncate">{away.shortName}</span>
      </div>

      {/* Right column: kickoff + status / result info */}
      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[80px]">
        {isFinished ? (
          <>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
              Zakończony
            </span>
            {prediction !== null ? (
              <span className="text-xs tabular-nums">
                <span className="text-muted-foreground">Twój typ: </span>
                <span className="font-semibold">
                  {prediction.homePick}:{prediction.awayPick}
                </span>
                {pointsAwarded !== null && (
                  <span className={cn("ml-1 font-semibold", pointsColor)}>
                    +{pointsAwarded} pkt
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">brak typu</span>
            )}
          </>
        ) : isLive ? (
          <>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-red-600 dark:text-red-400">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {dateStr} {timeStr}
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
