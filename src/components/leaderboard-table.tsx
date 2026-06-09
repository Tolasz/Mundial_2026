import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { type LeaderRow } from "@/lib/leaderboard/derive"

interface LeaderboardTableProps {
  rows: LeaderRow[]
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Brak graczy poza podium.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-muted-foreground text-xs">
            <th className="text-left py-3 px-3 w-10">#</th>
            <th className="text-left py-3 px-3">Gracz</th>
            <th className="text-right py-3 px-3">Punkty</th>
            <th
              className="text-right py-3 px-3 hidden sm:table-cell"
              title="Dokładne trafienia (3 pkt)"
            >
              3 pkt
            </th>
            <th
              className="text-right py-3 px-3 hidden sm:table-cell"
              title="Trafione rezultaty (1 pkt)"
            >
              1 pkt
            </th>
            <th className="text-right py-3 px-3 hidden md:table-cell">Typy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className={cn(
                "border-b last:border-0 transition-colors hover:bg-muted/30",
                row.isCurrentUser && "bg-primary/8 hover:bg-primary/12",
              )}
            >
              <td className="py-3 px-3 text-muted-foreground font-medium tabular-nums">
                {row.rank}.
              </td>
              <td className="py-3 px-3">
                <Link
                  href={`/leaderboard/${row.userId}`}
                  className="hover:underline font-medium"
                >
                  {row.nick}
                </Link>
                {row.isCurrentUser && (
                  <Badge variant="default" className="ml-2 text-[10px] py-0 px-1.5 align-middle">
                    Ty
                  </Badge>
                )}
                {row.championBonus > 0 && (
                  <span
                    className="ml-2 text-accent-foreground"
                    title={`Bonus za trafionego mistrza (+${row.championBonus} pkt)`}
                    aria-label="Bonus za mistrza"
                  >
                    ★
                  </span>
                )}
              </td>
              <td className="text-right py-3 px-3 tabular-nums font-bold">
                {row.totalPoints}
              </td>
              <td className="text-right py-3 px-3 tabular-nums hidden sm:table-cell">
                {row.exactHits}
              </td>
              <td className="text-right py-3 px-3 tabular-nums hidden sm:table-cell">
                {row.resultHits}
              </td>
              <td className="text-right py-3 px-3 tabular-nums hidden md:table-cell">
                {row.predictedCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
