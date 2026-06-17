import Link from "next/link"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TeamFlag } from "@/components/team-flag"
import { type LeaderRow } from "@/lib/leaderboard/derive"

export interface HomeTableRow extends LeaderRow {
  /** points_awarded values in chronological match order */
  history: number[]
  /** Champion pick — null if player hasn't picked one yet */
  champion: { name: string; flagUrl: string } | null
}

interface HomePlayersTableProps {
  rows: HomeTableRow[]
}

function HistoryDots({ history }: { history: number[] }) {
  if (history.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <div className="flex flex-wrap gap-0.5 max-w-[160px]">
      {history.map((pts, i) => (
        <span
          key={i}
          className={cn(
            "inline-block size-2 rounded-full",
            pts === 3
              ? "bg-green-500"
              : pts === 1
                ? "bg-yellow-400"
                : "bg-muted-foreground/30",
          )}
          title={pts === 3 ? "3 pkt" : pts === 1 ? "1 pkt" : "0 pkt"}
        />
      ))}
    </div>
  )
}

export function HomePlayersTable({ rows }: HomePlayersTableProps) {
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
            <th className="text-left py-3 px-3 hidden md:table-cell">
              Historia
            </th>
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/leaderboard/${row.userId}`}
                    className="hover:underline font-medium"
                  >
                    {row.nick}
                  </Link>
                  {row.isCurrentUser && (
                    <Badge
                      variant="default"
                      className="text-[10px] py-0 px-1.5 align-middle"
                    >
                      Ty
                    </Badge>
                  )}
                  {row.champion && (
                    <span
                      className="relative inline-flex shrink-0"
                      title={`Typ na mistrza: ${row.champion.name}${row.championBonus > 0 ? " ★" : ""}`}
                    >
                      <TeamFlag
                        flagUrl={row.champion.flagUrl}
                        name={row.champion.name}
                        size="sm"
                      />
                      {row.championBonus > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none text-yellow-400 drop-shadow-sm">
                          ★
                        </span>
                      )}
                    </span>
                  )}
                </div>
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
              <td className="py-3 px-3 hidden md:table-cell">
                <HistoryDots history={row.history} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
