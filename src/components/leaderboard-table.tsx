import Link from "next/link"
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { type LeaderRow } from "@/lib/leaderboard/derive"

interface LeaderboardTableProps {
  rows: LeaderRow[]
}

function RankChange({ change }: { change: number | null }) {
  if (change === null) {
    return <span className="text-[10px] text-muted-foreground/50 font-medium">NEW</span>
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500">
        <TrendingUp className="size-3" aria-hidden />
        {change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-destructive">
        <TrendingDown className="size-3" aria-hidden />
        {Math.abs(change)}
      </span>
    )
  }
  return <Minus className="size-3 text-muted-foreground/40 mx-auto" aria-hidden />
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Users className="size-9 text-muted-foreground/30" aria-hidden />
        <p className="text-sm text-muted-foreground">Brak graczy w rankingu.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-muted-foreground text-xs">
            <th className="text-left py-3 px-3 w-10">#</th>
            <th className="py-3 px-2 w-8" title="Zmiana pozycji vs poprzedni dzień"></th>
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
              <td className="py-3 px-2 text-center">
                <RankChange change={row.rankChange} />
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
