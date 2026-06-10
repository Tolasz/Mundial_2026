// Karta opinii jednego eksperta AI.
// Wyświetla: nazwę eksperta, intro (komentarz postaci), listę typów per mecz.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface ExpertPickDisplay {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  homeTeamShort: string
  awayTeamShort: string
  kickoffAt: string
  homeScore: number
  awayScore: number
  reason: string
}

interface ExpertOpinionCardProps {
  displayName: string
  intro: string
  picks: ExpertPickDisplay[]
  colorIndex?: number
}

const ACCENT_BORDER = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-orange-500",
]

const ACCENT_BADGE_BG = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-orange-500/15 text-orange-600 dark:text-orange-400",
]

const SCORE_BADGE_COLOR = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
  "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30",
]

export function ExpertOpinionCard({
  displayName,
  intro,
  picks,
  colorIndex = 0,
}: ExpertOpinionCardProps) {
  const ci = colorIndex % 3
  return (
    <Card className={cn("border-l-4", ACCENT_BORDER[ci])}>
      <CardHeader className="pb-4 pt-5">
        <CardTitle className="text-xl flex items-center gap-3">
          <span
            className={cn(
              "text-base font-semibold px-2 py-0.5 rounded-md",
              ACCENT_BADGE_BG[ci],
            )}
          >
            🎙️
          </span>
          <span className="font-bold">{displayName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Intro — komentarz w stylu postaci */}
        <p className="text-base text-muted-foreground italic leading-relaxed border-b border-border pb-4">
          {intro}
        </p>

        {picks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak typów.</p>
        ) : (
          <div className="space-y-3">
            {picks.map((pick) => {
              const kickoff = new Date(pick.kickoffAt).toLocaleString("pl-PL", {
                timeZone: "Europe/Warsaw",
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
              return (
                <div
                  key={pick.matchId}
                  className="rounded-md border border-border bg-muted/30 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Drużyny + wynik */}
                    <span className="font-semibold text-base">
                      {pick.homeTeamName}{" "}
                      <span
                        className={cn(
                          "inline-block min-w-[3.5rem] text-center rounded font-bold px-2 py-0.5 text-sm mx-1",
                          SCORE_BADGE_COLOR[ci],
                        )}
                      >
                        {pick.homeScore}:{pick.awayScore}
                      </span>{" "}
                      {pick.awayTeamName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {kickoff}
                    </span>
                  </div>
                  {/* Uzasadnienie */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pick.reason}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
