import { LayoutGrid } from "lucide-react"
import { GroupStandingsTable } from "@/components/dashboard/GroupStandingsTable"
import type { GroupStanding } from "@/lib/groups/derive"

interface GroupStandingsProps {
  standings: GroupStanding[]
}

export function GroupStandings({ standings }: GroupStandingsProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Tabele grup</h2>

      {standings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 rounded-xl border border-dashed border-border text-center">
          <LayoutGrid className="size-9 text-muted-foreground/30" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Tabele grup pojawią się po losowaniu drużyn.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {standings.map((standing) => (
            <GroupStandingsTable key={standing.group} standing={standing} />
          ))}
        </div>
      )}
    </section>
  )
}
