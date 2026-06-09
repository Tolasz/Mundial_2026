import Link from "next/link"

interface WelcomeHeroProps {
  nick: string
  rank: number | null
  totalPoints: number | null
}

export function WelcomeHero({ nick, rank, totalPoints }: WelcomeHeroProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">
        Cześć, <span className="text-primary">{nick}</span>!
      </h1>
      <p className="mt-1 text-muted-foreground">
        Witaj w Typerze Mistrzostw Świata 2026
      </p>

      {(rank !== null || totalPoints !== null) && (
        <div className="mt-4 flex flex-wrap gap-4">
          {rank !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
              <span className="text-lg font-bold text-foreground">#{rank}</span>
              <span className="text-sm text-muted-foreground">miejsce w rankingu</span>
            </div>
          )}
          {totalPoints !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
              <span className="text-lg font-bold text-primary">{totalPoints}</span>
              <span className="text-sm text-muted-foreground">pkt łącznie</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
