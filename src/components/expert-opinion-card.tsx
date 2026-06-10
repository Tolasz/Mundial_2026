// Karta opinii jednego eksperta AI.
// Wyświetla: nazwę eksperta, intro (komentarz postaci), listę typów per mecz.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
}

export function ExpertOpinionCard({
  displayName,
  intro,
  picks,
}: ExpertOpinionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🎙️</span>
          <span>{displayName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intro — komentarz w stylu postaci */}
        <p className="text-sm text-muted-foreground italic leading-relaxed">
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
                  className="rounded-md border border-border bg-muted/30 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Drużyny + wynik */}
                    <span className="font-medium text-sm">
                      {pick.homeTeamName}{" "}
                      <span className="inline-block min-w-[3.5rem] text-center rounded bg-primary/10 text-primary font-bold px-2 py-0.5 text-xs mx-1">
                        {pick.homeScore}:{pick.awayScore}
                      </span>{" "}
                      {pick.awayTeamName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {kickoff}
                    </span>
                  </div>
                  {/* Uzasadnienie */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
