import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "../AdminNav"
import { MatchResultForm } from "./MatchResultForm"
import type { MatchStage } from "@/types/db"

const STAGE_ORDER: MatchStage[] = ["group", "r32", "r16", "qf", "sf", "third", "final"]
const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Faza grupowa",
  r32: "1/32 finału",
  r16: "1/16 finału",
  qf: "Ćwierćfinał",
  sf: "Półfinał",
  third: "Mecz o 3. miejsce",
  final: "Finał",
}

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function MatchesPage() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from("matches")
    .select(
      `id, stage, "group", kickoff_at, home_score, away_score, status, round_label,
       home_team:teams!matches_home_team_id_fkey(name, short_name),
       away_team:teams!matches_away_team_id_fkey(name, short_name)`,
    )
    .order("kickoff_at", { ascending: true })

  if (!matches || matches.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Mecze</h1>
        <AdminNav />
        <p className="text-muted-foreground">Brak meczów w bazie danych.</p>
      </div>
    )
  }

  // Group by stage
  const grouped = STAGE_ORDER.reduce<
    Record<
      MatchStage,
      typeof matches
    >
  >(
    (acc, stage) => {
      acc[stage] = matches.filter((m) => m.stage === stage)
      return acc
    },
    {} as Record<MatchStage, typeof matches>,
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Zarządzanie meczami</h1>
      <AdminNav />

      <div className="space-y-8">
        {STAGE_ORDER.map((stage) => {
          const stageMatches = grouped[stage]
          if (!stageMatches || stageMatches.length === 0) return null

          return (
            <section key={stage}>
              <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {STAGE_LABELS[stage]}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium whitespace-nowrap">Data</th>
                      {stage === "group" && (
                        <th className="py-2 pr-4 font-medium">Gr.</th>
                      )}
                      <th className="py-2 pr-4 font-medium">Mecz</th>
                      <th className="py-2 font-medium">Wynik / Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageMatches.map((match) => {
                      const home = Array.isArray(match.home_team)
                        ? match.home_team[0]
                        : match.home_team
                      const away = Array.isArray(match.away_team)
                        ? match.away_team[0]
                        : match.away_team

                      return (
                        <tr
                          key={match.id}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                            {formatKickoff(match.kickoff_at)}
                          </td>
                          {stage === "group" && (
                            <td className="py-2 pr-4 font-mono">{match.group ?? "–"}</td>
                          )}
                          <td className="py-2 pr-4 whitespace-nowrap">
                            <span className="font-medium">
                              {home?.short_name ?? home?.name ?? "?"}
                            </span>
                            {" – "}
                            <span className="font-medium">
                              {away?.short_name ?? away?.name ?? "?"}
                            </span>
                            {match.round_label && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({match.round_label})
                              </span>
                            )}
                          </td>
                          <td className="py-2">
                            <MatchResultForm
                              matchId={match.id}
                              homeScore={match.home_score}
                              awayScore={match.away_score}
                              status={match.status}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
