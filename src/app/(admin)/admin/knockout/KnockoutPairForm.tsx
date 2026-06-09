"use client"

import { useState, useTransition } from "react"
import { adminUpdateKnockoutTeams } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"

interface Team {
  id: string
  name: string
  short_name: string
}

interface KnockoutPairFormProps {
  matchId: string
  stage: string
  roundLabel: string | null
  kickoffAt: string
  homeTeamId: string | null
  awayTeamId: string | null
  teams: Team[]
}

function toLocalDatetimeString(isoStr: string): string {
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  )
}

export function KnockoutPairForm({
  matchId,
  roundLabel,
  kickoffAt,
  homeTeamId,
  awayTeamId,
  teams,
}: KnockoutPairFormProps) {
  const [home, setHome] = useState(homeTeamId ?? "")
  const [away, setAway] = useState(awayTeamId ?? "")
  const [kickoff, setKickoff] = useState(toLocalDatetimeString(kickoffAt))
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setMsg(null)
    if (!home || !away) {
      setMsg({ text: "Wybierz obie drużyny.", ok: false })
      return
    }
    startTransition(async () => {
      const result = await adminUpdateKnockoutTeams({
        matchId,
        homeTeamId: home,
        awayTeamId: away,
        kickoffAt: new Date(kickoff).toISOString(),
      })
      setMsg({ text: result.success ? "Zapisano." : result.error, ok: result.success })
    })
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <p className="font-medium text-sm">{roundLabel ?? matchId.slice(0, 8)}</p>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Gospodarze</label>
          <select
            value={home}
            onChange={(e) => setHome(e.target.value)}
            disabled={isPending}
            className="rounded border border-border bg-background px-2 py-1 text-sm min-w-[180px]"
          >
            <option value="">– wybierz –</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Goście</label>
          <select
            value={away}
            onChange={(e) => setAway(e.target.value)}
            disabled={isPending}
            className="rounded border border-border bg-background px-2 py-1 text-sm min-w-[180px]"
          >
            <option value="">– wybierz –</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Data / godz.</label>
          <input
            type="datetime-local"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
            disabled={isPending}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Zapisywanie…" : "Zapisz parę"}
        </Button>
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-green-500" : "text-destructive"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
