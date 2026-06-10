import { TeamFlag } from "@/components/team-flag"
import { cn } from "@/lib/utils"
import type { GroupStanding } from "@/lib/groups/derive"

interface GroupStandingsTableProps {
  standing: GroupStanding
}

export function GroupStandingsTable({ standing }: GroupStandingsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/50 px-3 py-2">
        <h3 className="text-sm font-semibold">Grupa {standing.group}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="w-7 py-2 pl-3 pr-1 text-left font-medium">#</th>
              <th className="py-2 px-1 text-left font-medium">Drużyna</th>
              <th className="w-8 py-2 px-1 text-center font-medium" title="Mecze">
                M
              </th>
              <th
                className="hidden w-8 py-2 px-1 text-center font-medium sm:table-cell"
                title="Wygrane"
              >
                W
              </th>
              <th
                className="hidden w-8 py-2 px-1 text-center font-medium sm:table-cell"
                title="Remisy"
              >
                R
              </th>
              <th
                className="hidden w-8 py-2 px-1 text-center font-medium sm:table-cell"
                title="Porażki"
              >
                P
              </th>
              <th
                className="hidden py-2 px-1 text-center font-medium sm:table-cell"
                title="Bramki (zdobyte:stracone)"
              >
                BZ:BS
              </th>
              <th
                className="w-9 py-2 px-1 text-center font-medium"
                title="Różnica bramek"
              >
                +/-
              </th>
              <th
                className="w-9 py-2 pl-1 pr-3 text-center font-semibold"
                title="Punkty"
              >
                Pkt
              </th>
            </tr>
          </thead>
          <tbody>
            {standing.rows.map((row) => {
              const isQualifying = row.position <= 2
              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isQualifying && "bg-primary/8",
                  )}
                >
                  <td className="py-2 pl-3 pr-1 text-left tabular-nums">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full text-xs font-medium",
                        isQualifying
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {row.position}
                    </span>
                  </td>
                  <td className="py-2 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamFlag flagUrl={row.flagUrl} name={row.name} size="sm" />
                      <span className="truncate font-medium">
                        {row.shortName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center tabular-nums text-muted-foreground">
                    {row.played}
                  </td>
                  <td className="hidden py-2 px-1 text-center tabular-nums text-muted-foreground sm:table-cell">
                    {row.won}
                  </td>
                  <td className="hidden py-2 px-1 text-center tabular-nums text-muted-foreground sm:table-cell">
                    {row.drawn}
                  </td>
                  <td className="hidden py-2 px-1 text-center tabular-nums text-muted-foreground sm:table-cell">
                    {row.lost}
                  </td>
                  <td className="hidden py-2 px-1 text-center tabular-nums text-muted-foreground sm:table-cell">
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                  <td className="py-2 px-1 text-center tabular-nums text-muted-foreground">
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                  <td className="py-2 pl-1 pr-3 text-center font-bold tabular-nums">
                    {row.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
