"use client"

import { useState, useTransition } from "react"
import { savePrediction } from "@/lib/actions/predictions"

interface TeamInfo {
  id: string
  name: string
  short_name: string
  flag_url: string
}

interface MatchPredictionCardProps {
  matchId: string
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  kickoffAt: string
  prediction: { homePick: number; awayPick: number } | null
  isLocked: boolean
}

function FlagOrPlaceholder({
  flagUrl,
  name,
}: {
  flagUrl: string
  name: string
}) {
  if (flagUrl && (flagUrl.startsWith("http://") || flagUrl.startsWith("https://"))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flagUrl}
        alt={name}
        className="w-6 h-4 object-cover rounded-sm shrink-0"
      />
    )
  }
  // emoji or empty — show 2-letter placeholder
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-4 rounded-sm bg-muted text-[10px] font-bold shrink-0"
      aria-label={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function MatchPredictionCard({
  matchId,
  homeTeam,
  awayTeam,
  kickoffAt,
  prediction,
  isLocked,
}: MatchPredictionCardProps) {
  const [homePick, setHomePick] = useState<string>(
    prediction !== null ? String(prediction.homePick) : "",
  )
  const [awayPick, setAwayPick] = useState<string>(
    prediction !== null ? String(prediction.awayPick) : "",
  )
  const [statusMsg, setStatusMsg] = useState<{
    text: string
    ok: boolean
  } | null>(null)
  const [isPending, startTransition] = useTransition()

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

  const hasPrediction = prediction !== null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked || isPending) return

    const home = parseInt(homePick, 10)
    const away = parseInt(awayPick, 10)

    if (
      isNaN(home) ||
      isNaN(away) ||
      home < 0 ||
      home > 99 ||
      away < 0 ||
      away > 99
    ) {
      setStatusMsg({ text: "Podaj wyniki od 0 do 99.", ok: false })
      return
    }

    setStatusMsg(null)
    startTransition(async () => {
      const result = await savePrediction({
        matchId,
        homePick: home,
        awayPick: away,
      })
      if (result.success) {
        setStatusMsg({ text: "Zapisano!", ok: true })
        setTimeout(() => setStatusMsg(null), 3000)
      } else {
        setStatusMsg({ text: result.error, ok: false })
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg border bg-card p-3 flex items-center gap-2 sm:gap-3 transition-opacity ${
        isLocked ? "opacity-60" : ""
      }`}
    >
      {/* Home team */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-sm font-medium truncate text-right">
          {homeTeam.short_name}
        </span>
        <FlagOrPlaceholder flagUrl={homeTeam.flag_url} name={homeTeam.name} />
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          value={homePick}
          onChange={(e) => setHomePick(e.target.value)}
          disabled={isLocked || isPending}
          className="w-10 text-center rounded border border-input bg-background px-1 py-1 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Bramki ${homeTeam.name}`}
        />
        <span className="text-muted-foreground font-bold select-none">:</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          value={awayPick}
          onChange={(e) => setAwayPick(e.target.value)}
          disabled={isLocked || isPending}
          className="w-10 text-center rounded border border-input bg-background px-1 py-1 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Bramki ${awayTeam.name}`}
        />
      </div>

      {/* Away team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <FlagOrPlaceholder flagUrl={awayTeam.flag_url} name={awayTeam.name} />
        <span className="text-sm font-medium truncate">{awayTeam.short_name}</span>
      </div>

      {/* Kickoff + action */}
      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[90px]">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {dateStr} {timeStr}
        </span>
        {isLocked ? (
          <span className="text-xs text-muted-foreground">🔒 Zablokowany</span>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 transition-colors"
          >
            {isPending ? "…" : hasPrediction ? "Zmień" : "Zapisz"}
          </button>
        )}
        {statusMsg && (
          <span
            className={`text-xs ${
              statusMsg.ok ? "text-green-500" : "text-destructive"
            }`}
          >
            {statusMsg.text}
          </span>
        )}
      </div>
    </form>
  )
}
