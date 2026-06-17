// Karta podsumowania dnia jednej persony AI.
// Layout wzorowany na ExpertOpinionCard: avatar po lewej, treść po prawej.

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DailySummaryCardProps {
  displayName: string
  summary: string
  generatedAt: string
  colorIndex?: number
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
      </CardContent>
    </Card>
  )
}
