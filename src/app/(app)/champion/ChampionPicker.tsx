"use client"

import { useState, useTransition } from "react"
import { saveChampion } from "@/lib/actions/champion"
import { Button } from "@/components/ui/button"

interface TeamInfo {
  id: string
  name: string
  short_name: string
  flag_url: string
  group: string | null
}

interface FinalInfo {
  homeScore: number | null
  awayScore: number | null
  homeTeamId: string | null
  awayTeamId: string | null
}

interface ChampionPickerProps {
  teams: TeamInfo[]
  currentChampionId: string | null
  isLocked: boolean
  bonusPoints: number
  final: FinalInfo | null
  finalFinished: boolean
}

function FlagOrPlaceholder({ flagUrl, name }: { flagUrl: string; name: string }) {
  if (flagUrl && (flagUrl.startsWith("http://") || flagUrl.startsWith("https://"))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flagUrl}
        alt={name}
        className="w-8 h-5 object-cover rounded-sm shrink-0"
      />
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-5 rounded-sm bg-muted text-[10px] font-bold shrink-0"
      aria-label={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

function getWinnerIds(final: FinalInfo): string[] {
  if (final.homeScore === null || final.awayScore === null) return []
  if (final.homeScore > final.awayScore)
    return final.homeTeamId ? [final.homeTeamId] : []
  if (final.awayScore > final.homeScore)
    return final.awayTeamId ? [final.awayTeamId] : []
  // Draw after 90 min — both teams give bonus (consistent with leaderboard view)
  return [final.homeTeamId, final.awayTeamId].filter(Boolean) as string[]
}

export function ChampionPicker({
  teams,
  currentChampionId,
  isLocked,
  bonusPoints,
  final,
  finalFinished,
}: ChampionPickerProps) {
  const [selected, setSelected] = useState<string | null>(currentChampionId)
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  const winnerIds = finalFinished && final ? getWinnerIds(final) : []
  const userHit = selected !== null && winnerIds.includes(selected)

  // Group teams by group letter; ungrouped (null) at the end
  const grouped = teams.reduce<Record<string, TeamInfo[]>>((acc, team) => {
    const key = team.group ?? "?"
    if (!acc[key]) acc[key] = []
    acc[key].push(team)
    return acc
  }, {})
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "?") return 1
    if (b === "?") return -1
    return a.localeCompare(b)
  })

  function handleSave() {
    if (!selected) return
    setStatusMsg(null)
    startTransition(async () => {
      const result = await saveChampion({ teamId: selected })
      if (result.success) {
        setStatusMsg({ text: "Zapisano typ mistrza!", ok: true })
      } else {
        setStatusMsg({ text: result.error, ok: false })
      }
    })
  }

  const isDirty = selected !== currentChampionId

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Typ mistrza turnieju</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Wytypuj zwycięzcę turnieju. Trafiony wybór to{" "}
          <span className="font-semibold text-foreground">+{bonusPoints} pkt</span> w rankingu.
        </p>
      </div>

      {/* Status banners */}
      {isLocked && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          🔒 Wybór mistrza jest zablokowany — turniej już się rozpoczął.
        </div>
      )}

      {finalFinished && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            userHit
              ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
              : "border-muted bg-muted/30 text-muted-foreground"
          }`}
        >
          {userHit
            ? `🏆 Gratulacje! Trafiłeś mistrza turnieju. +${bonusPoints} pkt!`
            : "Finał rozliczony. Nie udało się trafić mistrza."}
        </div>
      )}

      {/* Team grid */}
      {teams.length === 0 ? (
        <p className="text-muted-foreground py-4">Brak drużyn w bazie danych.</p>
      ) : (
        <div className="space-y-4">
          {groupKeys.map((groupKey) => (
            <div key={groupKey}>
              {groupKey !== "?" && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Grupa {groupKey}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {grouped[groupKey].map((team) => {
                  const isSelected = selected === team.id
                  const isWinner = winnerIds.includes(team.id)
                  return (
                    <button
                      key={team.id}
                      type="button"
                      disabled={isLocked || isPending}
                      onClick={() => {
                        if (!isLocked) {
                          setSelected(team.id)
                          setStatusMsg(null)
                        }
                      }}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors
                        ${
                          isSelected
                            ? "border-primary bg-primary/10 font-medium"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                        }
                        ${isLocked ? "cursor-default opacity-75" : "cursor-pointer"}
                        ${isWinner ? "ring-2 ring-yellow-400/60" : ""}
                      `}
                    >
                      <FlagOrPlaceholder flagUrl={team.flag_url} name={team.short_name} />
                      <span className="truncate">{team.name}</span>
                      {isWinner && (
                        <span className="ml-auto shrink-0 text-yellow-500" title="Mistrz turnieju">
                          🏆
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      {!isLocked && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!selected || !isDirty || isPending}
          >
            {isPending ? "Zapisywanie…" : "Zapisz typ mistrza"}
          </Button>
          {currentChampionId && !isDirty && (
            <span className="text-sm text-muted-foreground">Typ zapisany</span>
          )}
        </div>
      )}

      {statusMsg && (
        <p
          className={`text-sm ${statusMsg.ok ? "text-green-500" : "text-destructive"}`}
        >
          {statusMsg.text}
        </p>
      )}
    </div>
  )
}
