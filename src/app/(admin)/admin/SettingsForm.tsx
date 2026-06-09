"use client"

import { useState, useTransition } from "react"
import { adminUpdateSettings } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"

interface SettingsFormProps {
  tournamentStarted: boolean
  championLockedAt: string | null
}

function toLocalDatetimeString(isoStr: string | null): string {
  if (!isoStr) return ""
  const d = new Date(isoStr)
  // Format: YYYY-MM-DDTHH:mm  (local time for datetime-local input)
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

export function SettingsForm({ tournamentStarted, championLockedAt }: SettingsFormProps) {
  const [started, setStarted] = useState(tournamentStarted)
  const [lockedAt, setLockedAt] = useState(toLocalDatetimeString(championLockedAt))
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setMsg(null)
    startTransition(async () => {
      const result = await adminUpdateSettings({
        tournamentStarted: started,
        championLockedAt: lockedAt ? new Date(lockedAt).toISOString() : null,
      })
      setMsg({
        text: result.success ? "Ustawienia zapisane." : result.error,
        ok: result.success,
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="tournament-started"
          checked={started}
          onChange={(e) => setStarted(e.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        <label htmlFor="tournament-started" className="text-sm font-medium">
          Turniej rozpoczęty (blokuje typ mistrza)
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="champion-locked" className="text-sm font-medium">
          Blokada mistrza (data/godzina)
        </label>
        <input
          id="champion-locked"
          type="datetime-local"
          value={lockedAt}
          onChange={(e) => setLockedAt(e.target.value)}
          className="w-fit rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Zostaw puste aby blokować tylko przez &quot;Turniej rozpoczęty&quot;
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? "Zapisywanie…" : "Zapisz ustawienia"}
        </Button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-green-500" : "text-destructive"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
