import Link from "next/link"
import { cn } from "@/lib/utils"
import { type LeaderRow } from "@/lib/leaderboard/derive"

interface LeaderboardPodiumProps {
  podium: LeaderRow[]
}

const MEDAL_CONFIG = {
  1: {
    label: "🥇",
    cardClass:
      "border-accent bg-accent/10 dark:bg-accent/15 shadow-md order-1 sm:order-2 sm:-translate-y-4 z-10",
    rankClass: "text-accent-foreground font-black text-2xl",
    pointsClass: "text-accent-foreground font-extrabold text-xl",
  },
  2: {
    label: "🥈",
    cardClass: "border-border bg-card order-2 sm:order-1",
    rankClass: "text-muted-foreground font-bold text-lg",
    pointsClass: "text-foreground font-bold text-lg",
  },
  3: {
    label: "🥉",
    cardClass: "border-border bg-card order-3",
    rankClass: "text-muted-foreground font-bold text-lg",
    pointsClass: "text-foreground font-bold text-lg",
  },
} as const

export function LeaderboardPodium({ podium }: LeaderboardPodiumProps) {
  if (podium.length === 0) return null

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-end justify-center gap-3 sm:gap-4"
      aria-label="Podium top 3"
    >
      {podium.map((player) => {
        const rank = Math.min(player.rank, 3) as 1 | 2 | 3
        const cfg = MEDAL_CONFIG[rank]

        return (
          <Link
            key={player.userId}
            href={`/leaderboard/${player.userId}`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-4 sm:p-5 transition-all",
              "hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "min-w-0 flex-1 sm:max-w-[200px]",
              cfg.cardClass,
            )}
            aria-label={`${player.rank}. miejsce: ${player.nick}, ${player.totalPoints} punktów`}
          >
            <span className="text-2xl sm:text-3xl" aria-hidden>
              {cfg.label}
            </span>
            <span className={cn("text-sm font-semibold truncate max-w-full", cfg.rankClass)}>
              #{player.rank}
            </span>
            <span className="font-semibold text-center truncate max-w-full text-sm">
              {player.nick}
              {player.isCurrentUser && (
                <span className="ml-1 text-xs text-muted-foreground">(Ty)</span>
              )}
            </span>
            <span className={cn("tabular-nums", cfg.pointsClass)}>
              {player.totalPoints} pkt
            </span>
            {player.championBonus > 0 && (
              <span
                className="text-accent-foreground text-xs font-medium"
                title={`Bonus za trafionego mistrza (+${player.championBonus} pkt)`}
                aria-label={`Bonus za mistrza: ${player.championBonus} punktów`}
              >
                ★ +{player.championBonus}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
