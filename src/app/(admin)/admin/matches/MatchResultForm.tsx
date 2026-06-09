"use client"

import { useState, useTransition } from "react"
import { adminUpdateMatchResult, adminRecalcMatchPoints } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import type { MatchStatus } from "@/types/db"

interface MatchResultFormProps {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Zaplanowany",
  live: "Na żywo",
  finished: "Zakończony",
  postponed: "Przełożony",
}

export function MatchResultForm({ matchId, homeScore, awayScore, status }: MatchResultFormProps) {
  const [home, setHome] = useState(homeScore !== null ? String(homeScore) : "")
  const [away, setAway] = useState(awayScore !== null ? String(awayScore) : "")
  const [st, setSt] = useState<MatchStatus>(status)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isRecalcPending, startRecalcTransition] = useTransition()

  function handleSave() {
    setMsg(null)
    startTransition(async () => {
      const result = await adminUpdateMatchResult({
        matchId,
        homeScore: home === "" ? null : home,
        awayScore: away === "" ? null : away,
        status: st,
      })
      setMsg({ text: result.success ? "Zapisano." : result.error, ok: result.success })
    })
  }

  function handleRecalc() {
    setMsg(null)
    startRecalcTransition(async () => {
      const result = await adminRecalcMatchPoints(matchId)
      setMsg({
        text: result.success ? "Punkty przeliczone." : result.error,
        ok: result.success,
      })
    })
  }

  const busy = isPending || isRecalcPending

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        max={99}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        placeholder="–"
        className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-sm text-center"
        disabled={busy}
        aria-label="Gole gospodarzy"
      />
      <span className="text-muted-foreground">:</span>
      <input
        type="number"
        min={0}
        max={99}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        placeholder="–"
        className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-sm text-center"
        disabled={busy}
        aria-label="Gole gości"
      />

      <select
        value={st}
        onChange={(e) => setSt(e.target.value as MatchStatus)}
        disabled={busy}
        className="rounded border border-border bg-background px-1.5 py-0.5 text-sm"
      >
        {(Object.keys(STATUS_LABELS) as MatchStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <Button size="sm" onClick={handleSave} disabled={busy}>
        {isPending ? "…" : "Zapisz"}
      </Button>
      <Button size="sm" variant="outline" onClick={handleRecalc} disabled={busy}>
        {isRecalcPending ? "…" : "Przelicz pkt"}
      </Button>

      {msg && (
        <span className={`text-xs ${msg.ok ? "text-green-500" : "text-destructive"}`}>
          {msg.text}
        </span>
      )}
    </div>
  )
}
