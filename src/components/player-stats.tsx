"use client"

import { BarChart2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PlayerStatsVM } from "@/lib/stats/player"

interface PlayerStatsProps {
  vm: PlayerStatsVM
}

const STAGE_LABELS: Record<string, string> = {
  group: "Faza grupowa",
  r32: "1/32 finału",
  r16: "1/16 finału",
  qf: "Ćwierćfinał",
  sf: "Półfinał",
  final: "Finał",
}

export function PlayerStats({ vm }: PlayerStatsProps) {
  const {
    totalSettled,
    exactHits,
    resultHits,
    missHits,
    accuracyPct,
    avgPointsPerMatch,
    bestStreak,
    championBonus,
    totalPoints,
    pointsByStage,
  } = vm

  // Distribution bar widths
  const exactPct = totalSettled > 0 ? (exactHits / totalSettled) * 100 : 0
  const resultPct = totalSettled > 0 ? (resultHits / totalSettled) * 100 : 0
  const missPct = totalSettled > 0 ? (missHits / totalSettled) * 100 : 0

  const stageEntries = Object.entries(pointsByStage).filter(([, pts]) => pts > 0)

  return (
    <section aria-label="Statystyki gracza" className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Łącznie punktów" value={totalPoints} highlight />
        <StatCard label="Skuteczność" value={`${accuracyPct}%`} />
        <StatCard
          label="Śr. pkt / mecz"
          value={avgPointsPerMatch.toFixed(2)}
          className="col-span-2 sm:col-span-1"
        />
        <StatCard label="Dokładne trafienia" value={exactHits} badge="success" />
        <StatCard label="Trafiony rezultat" value={resultHits} badge="info" />
        <StatCard
          label="Najlepsza seria"
          value={bestStreak === 0 ? "—" : `${bestStreak} meczów`}
        />
      </div>

      {/* Hit distribution bar */}
      {totalSettled > 0 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Rozkład typów ({totalSettled} rozliczonych)
            </p>
            <div
              className="flex rounded-full overflow-hidden h-4 gap-px"
              role="img"
              aria-label={`Rozkład: ${exactHits} dokładnych, ${resultHits} trafiony rezultat, ${missHits} chybionych`}
            >
              {exactPct > 0 && (
                <div
                  className="bg-[var(--points-exact)] transition-all"
                  style={{ width: `${exactPct}%` }}
                  title={`Dokładne: ${exactHits}`}
                />
              )}
              {resultPct > 0 && (
                <div
                  className="bg-[var(--points-result)] transition-all"
                  style={{ width: `${resultPct}%` }}
                  title={`Rezultat: ${resultHits}`}
                />
              )}
              {missPct > 0 && (
                <div
                  className="bg-muted transition-all"
                  style={{ width: `${missPct}%` }}
                  title={`Chybione: ${missHits}`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--points-exact)]"
                  aria-hidden="true"
                />
                <span className="tabular-nums">{exactHits} × 3 pkt</span>
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--points-result)]"
                  aria-hidden="true"
                />
                <span className="tabular-nums">{resultHits} × 1 pkt</span>
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm bg-muted border border-border"
                  aria-hidden="true"
                />
                <span className="tabular-nums">{missHits} × 0 pkt</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {totalSettled === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center rounded-xl border border-dashed border-border">
          <BarChart2 className="size-9 text-muted-foreground/30" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Brak rozliczonych meczów — statystyki pojawią się po pierwszym typowanym meczu.
          </p>
        </div>
      )}

      {/* Points by stage */}
      {stageEntries.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">
              Punkty per etap
            </p>
            <div className="flex flex-wrap gap-2">
              {stageEntries.map(([stage, pts]) => (
                <div
                  key={stage}
                  className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 px-3 py-2 min-w-[70px]"
                >
                  <span className="text-xs text-muted-foreground">
                    {STAGE_LABELS[stage] ?? stage}
                  </span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {pts}
                  </span>
                  <span className="text-xs text-muted-foreground">pkt</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Champion bonus */}
      {championBonus > 0 && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="text-accent-foreground text-base" aria-hidden="true">
                ★
              </span>
              Bonus za mistrza
            </span>
            <Badge variant="warning" className="tabular-nums text-sm px-3 py-1">
              +{championBonus} pkt
            </Badge>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

// ── Helper ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  highlight?: boolean
  badge?: "success" | "info"
  className?: string
}

function StatCard({ label, value, highlight, badge, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-1.5">
          <span
            className={`text-2xl font-bold tabular-nums leading-none ${
              highlight ? "text-primary" : "text-foreground"
            }`}
          >
            {value}
          </span>
          {badge === "success" && (
            <Badge variant="success" className="mb-0.5">
              3 pkt
            </Badge>
          )}
          {badge === "info" && (
            <Badge variant="info" className="mb-0.5">
              1 pkt
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
