import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "../AdminNav"
import { KnockoutPairForm } from "./KnockoutPairForm"
import type { MatchStage } from "@/types/db"

const STAGE_ORDER: Exclude<MatchStage, "group">[] = ["r32", "r16", "qf", "sf", "third", "final"]
const STAGE_LABELS: Record<string, string> = {
  r32: "1/32 finału",
  r16: "1/16 finału",
  qf: "Ćwierćfinał",
  sf: "Półfinał",
  third: "Mecz o 3. miejsce",
  final: "Finał",
}

export default async function KnockoutPage() {
  const supabase = await createClient()

  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `id, stage, round_label, kickoff_at,
         home_team_id, away_team_id,
         home_team:teams!matches_home_team_id_fkey(name, short_name),
         away_team:teams!matches_away_team_id_fkey(name, short_name)`,
      )
      .neq("stage", "group")
      .order("kickoff_at", { ascending: true }),
    supabase.from("teams").select("id, name, short_name").order("name"),
  ])

  const teamList = teams ?? []

  if (!matches || matches.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Pary pucharowe</h1>
        <AdminNav />
        <p className="text-muted-foreground">Brak meczów pucharowych w bazie.</p>
      </div>
    )
  }

  const grouped = STAGE_ORDER.reduce<Record<string, typeof matches>>((acc, stage) => {
    acc[stage] = matches.filter((m) => m.stage === stage)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pary pucharowe</h1>
      <AdminNav />

      <p className="text-sm text-muted-foreground mb-6">
        Ustaw drużyny i termin dla meczów fazy pucharowej. Typy staną się dostępne dopiero
        gdy obie drużyny są znane.
      </p>

      <div className="space-y-8">
        {STAGE_ORDER.map((stage) => {
          const stageMatches = grouped[stage]
          if (!stageMatches || stageMatches.length === 0) return null

          return (
            <section key={stage}>
              <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {STAGE_LABELS[stage]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {stageMatches.map((match) => {
                  const home = Array.isArray(match.home_team)
                    ? match.home_team[0]
                    : match.home_team
                  const away = Array.isArray(match.away_team)
                    ? match.away_team[0]
                    : match.away_team

                  const label =
                    match.round_label ??
                    (home && away
                      ? `${home.short_name ?? home.name} – ${away.short_name ?? away.name}`
                      : `Mecz (${match.id.slice(0, 8)})`)

                  return (
                    <KnockoutPairForm
                      key={match.id}
                      matchId={match.id}
                      stage={match.stage}
                      roundLabel={label}
                      kickoffAt={match.kickoff_at}
                      homeTeamId={match.home_team_id}
                      awayTeamId={match.away_team_id}
                      teams={teamList}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
