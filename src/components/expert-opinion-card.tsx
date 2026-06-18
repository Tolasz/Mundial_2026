// Karta opinii jednego eksperta AI.
// Layout wzorowany na Google Reviews: avatar po lewej, treść po prawej.

import { Card, CardContent } from "@/components/ui/card"
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

export interface ExpertComment {
  commenterPersona: string
  commenterDisplayName: string
  stance?: string | null
  body: string
}

interface ExpertOpinionCardProps {
  displayName: string
  intro: string
  picks: ExpertPickDisplay[]
  colorIndex?: number
  comments?: ExpertComment[]
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
]

const SCORE_BADGE_COLOR = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
  "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30",
]

export function ExpertOpinionCard({
  displayName,
  intro,
  picks,
  colorIndex = 0,
  comments,
}: ExpertOpinionCardProps) {
  const ci = colorIndex % 3
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header: avatar + nazwa */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 select-none",
              AVATAR_COLORS[ci],
            )}
          >
            {initial}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{displayName}</h3>
            <p className="text-sm text-muted-foreground">Ekspert AI · 🎙️</p>
          </div>
        </div>

        {/* Intro — komentarz postaci, czytelny kolor */}
        <p className="text-base text-foreground leading-relaxed">
          {intro}
        </p>

        {/* Typy meczów */}
        {picks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak typów.</p>
        ) : (
          <div className="space-y-3 pt-3 border-t border-border">
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
                  {/* Uzasadnienie — czytelny kolor */}
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {pick.reason}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Komentarze innych ekspertów */}
        {comments && comments.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Komentarze ekspertów
            </p>
            {comments.map((c, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 select-none">
                  {c.commenterDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold">{c.commenterDisplayName}</span>
                    {c.stance === "agree" && <span className="text-xs" title="Zgadza się">👍</span>}
                    {c.stance === "disagree" && <span className="text-xs" title="Nie zgadza się">👎</span>}
                    {c.stance === "roast" && <span className="text-xs" title="Roast">🔥</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
