// Karta podsumowania dnia jednej persony AI.
// Layout wzorowany na ExpertOpinionCard: avatar po lewej, treść po prawej.

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ExpertComment } from "@/components/expert-opinion-card"

interface DailySummaryCardProps {
  displayName: string
  summary: string
  generatedAt: string
  colorIndex?: number
  comments?: ExpertComment[]
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
]

export function DailySummaryCard({
  displayName,
  summary,
  generatedAt,
  colorIndex = 0,
  comments,
}: DailySummaryCardProps) {
  const ci = colorIndex % 3
  const initial = displayName.charAt(0).toUpperCase()

  const formattedDate = new Date(generatedAt).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Podziel tekst na akapity (proza od LLM może zawierać \n\n)
  const paragraphs = summary
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header: avatar + nazwa + data */}
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
            <p className="text-sm text-muted-foreground">
              Ekspert AI · 📝 Podsumowanie dnia · {formattedDate}
            </p>
          </div>
        </div>

        {/* Treść podsumowania — akapity */}
        <div className="space-y-3 text-base text-foreground leading-relaxed">
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

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
