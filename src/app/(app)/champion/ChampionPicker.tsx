"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Lock, Trophy } from "lucide-react"
import { saveChampion } from "@/lib/actions/champion"
import { Button } from "@/components/ui/button"
import { TeamFlag } from "@/components/team-flag"

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

function getWinnerIds(final: FinalInfo): string[] {
  if (final.homeScore === null || final.awayScore === null) return []
  if (final.homeScore > final.awayScore)
    return final.homeTeamId ? [final.homeTeamId] : []
  if (final.awayScore > final.homeScore)
    return final.awayTeamId ? [final.awayTeamId] : []
  // Draw after 90 min — both teams give bonus
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
    startTransition(async () => {
      const result = await saveChampion({ teamId: selected })
      if (result.success) {
        toast.success("Typ mistrza zapisany!")
      } else {
        toast.error(result.error)
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

      {/* Locked banner */}
      {isLocked && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
        >
          <Lock className="size-4 shrink-0" aria-hidden />
          <span>Wybór mistrza jest zablokowany — turniej już się rozpoczął.</span>
        </div>
      )}

      {/* Final result banner */}
      {finalFinished && (
        <div
          role="status"
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
            userHit
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-muted bg-muted/30 text-muted-foreground"
          }`}
        >
          <Trophy className={`size-4 shrink-0 ${userHit ? "text-yellow-500" : ""}`} aria-hidden />
          <span>
            {userHit
              ? `Gratulacje! Trafiłeś mistrza turnieju. +${bonusPoints} pkt!`
              : "Finał rozliczony. Nie udało się trafić mistrza."}
          </span>
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
                      aria-pressed={isSelected}
                      onClick={() => {
                        if (!isLocked) {
                          setSelected(team.id)
                        }
                      }}
                      className={[
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1",
                        isSelected
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border hover:border-muted-foreground/40 hover:bg-muted/40",
                        isLocked ? "cursor-default opacity-75" : "cursor-pointer",
                        isWinner ? "ring-2 ring-yellow-400/60" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <TeamFlag
                        flagUrl={team.flag_url}
                        name={team.short_name}
                        size="sm"
                      />
                      <span className="truncate">{team.name}</span>
                      {isWinner && (
                        <Trophy
                          className="ml-auto size-3.5 shrink-0 text-yellow-500"
                          aria-label="Mistrz turnieju"
                        />
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
            aria-busy={isPending}
          >
            {isPending ? "Zapisywanie…" : "Zapisz typ mistrza"}
          </Button>
          {currentChampionId && !isDirty && (
            <span className="text-sm text-muted-foreground">Typ zapisany ✓</span>
          )}
        </div>
      )}
    </div>
  )
}
