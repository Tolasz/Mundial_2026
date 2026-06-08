import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MatchPredictionCard } from "@/components/match-prediction-card"

interface TeamRow {
  id: string
  name: string
  short_name: string
  flag_url: string
}

interface MatchWithTeams {
  id: string
  group: string
  kickoff_at: string
  home_team: TeamRow
  away_team: TeamRow
}

interface PredictionRow {
  match_id: string
  home_pick: number
  away_pick: number
}

export default async function PredictionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const now = new Date()

  // Fetch all group stage matches with team info
  const { data: matchesRaw, error: matchesError } = await supabase
    .from("matches")
    .select(
      `id, group, kickoff_at,
       home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
       away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)`,
    )
    .eq("stage", "group")
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null)
    .order("kickoff_at", { ascending: true })

  if (matchesError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Typy — faza grupowa</h1>
        <p className="text-destructive">
          Błąd ładowania meczów. Spróbuj odświeżyć stronę.
        </p>
      </div>
    )
  }

  const matches = (matchesRaw ?? []) as unknown as MatchWithTeams[]

  // Fetch user predictions for group stage matches
  const matchIds = matches.map((m) => m.id)
  let predictions: PredictionRow[] = []
  if (matchIds.length > 0) {
    const { data: predsData } = await supabase
      .from("predictions")
      .select("match_id, home_pick, away_pick")
      .eq("user_id", user.id)
      .in("match_id", matchIds)

    predictions = predsData ?? []
  }

  const predictionMap = new Map<
    string,
    { homePick: number; awayPick: number }
  >(predictions.map((p) => [p.match_id, { homePick: p.home_pick, awayPick: p.away_pick }]))

  const filledCount = predictions.length
  const totalCount = matches.length

  // Group matches by group letter (A–L)
  const groupsMap = new Map<string, MatchWithTeams[]>()
  for (const match of matches) {
    const g = match.group ?? "?"
    if (!groupsMap.has(g)) groupsMap.set(g, [])
    groupsMap.get(g)!.push(match)
  }

  // Sort group keys alphabetically
  const sortedGroups = [...groupsMap.keys()].sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Typy — faza grupowa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Typy można zmieniać do momentu startu meczu.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Postęp typowania</span>
          <span className="tabular-nums font-semibold">
            {filledCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width:
                totalCount > 0
                  ? `${Math.round((filledCount / totalCount) * 100)}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-muted-foreground">
          Mecze fazy grupowej nie zostały jeszcze załadowane.
        </p>
      ) : (
        sortedGroups.map((groupLetter) => {
          const groupMatches = groupsMap.get(groupLetter)!
          return (
            <section key={groupLetter}>
              <h2 className="text-lg font-semibold mb-2">
                Grupa {groupLetter}
              </h2>
              <div className="space-y-2">
                {groupMatches.map((match) => (
                  <MatchPredictionCard
                    key={match.id}
                    matchId={match.id}
                    homeTeam={match.home_team}
                    awayTeam={match.away_team}
                    kickoffAt={match.kickoff_at}
                    prediction={predictionMap.get(match.id) ?? null}
                    isLocked={now >= new Date(match.kickoff_at)}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
