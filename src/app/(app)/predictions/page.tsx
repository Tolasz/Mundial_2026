import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MatchPredictionCard } from "@/components/match-prediction-card"
import { OthersPredictions } from "@/components/others-predictions"

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

interface KnockoutMatch {
  id: string
  stage: string
  round_label: string | null
  kickoff_at: string
  home_team: TeamRow | null
  away_team: TeamRow | null
}

interface PredictionRow {
  match_id: string
  home_pick: number
  away_pick: number
}

const KNOCKOUT_STAGES = ["r32", "r16", "qf", "sf", "final"] as const

const STAGE_LABELS: Record<string, string> = {
  r32: "1/16 finału",
  r16: "1/8 finału",
  qf: "Ćwierćfinały",
  sf: "Półfinały",
  final: "Finał",
}

export default async function PredictionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const now = new Date()

  // Fetch all group stage matches with team info
  const [groupResult, knockoutResult] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `id, group, kickoff_at,
         home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
         away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)`,
      )
      .eq("stage", "group")
      .not("home_team_id", "is", null)
      .not("away_team_id", "is", null)
      .order("kickoff_at", { ascending: true }),

    supabase
      .from("matches")
      .select(
        `id, stage, round_label, kickoff_at,
         home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
         away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)`,
      )
      .in("stage", ["r32", "r16", "qf", "sf", "final"])
      .order("kickoff_at", { ascending: true }),
  ])

  if (groupResult.error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Typy — faza grupowa</h1>
        <p className="text-destructive">
          Błąd ładowania meczów. Spróbuj odświeżyć stronę.
        </p>
      </div>
    )
  }

  const matches = (groupResult.data ?? []) as unknown as MatchWithTeams[]
  const knockoutMatches = (knockoutResult.data ?? []) as unknown as KnockoutMatch[]

  // IDs of knockout matches where both teams are known (typeable)
  const knockoutPlayableIds = knockoutMatches
    .filter((m) => m.home_team && m.away_team)
    .map((m) => m.id)

  // Fetch user predictions for all typeable matches in one query
  const groupMatchIds = matches.map((m) => m.id)
  const allTypedIds = [...groupMatchIds, ...knockoutPlayableIds]
  let predictions: PredictionRow[] = []
  if (allTypedIds.length > 0) {
    const { data: predsData } = await supabase
      .from("predictions")
      .select("match_id, home_pick, away_pick")
      .eq("user_id", user.id)
      .in("match_id", allTypedIds)

    predictions = predsData ?? []
  }

  const predictionMap = new Map<string, { homePick: number; awayPick: number }>(
    predictions.map((p) => [p.match_id, { homePick: p.home_pick, awayPick: p.away_pick }]),
  )

  const groupFilledCount = groupMatchIds.filter((id) => predictionMap.has(id)).length
  const knockoutFilledCount = knockoutPlayableIds.filter((id) => predictionMap.has(id)).length
  const filledCount = groupFilledCount + knockoutFilledCount
  const totalCount = matches.length + knockoutPlayableIds.length

  // Locked matches for others' predictions visibility (RLS enforces post-kickoff)
  const lockedGroupIds = matches
    .filter((m) => now >= new Date(m.kickoff_at))
    .map((m) => m.id)
  const lockedKnockoutIds = knockoutMatches
    .filter((m) => m.home_team && m.away_team && now >= new Date(m.kickoff_at))
    .map((m) => m.id)
  const allLockedIds = [...lockedGroupIds, ...lockedKnockoutIds]

  type OtherPredRow = {
    match_id: string
    home_pick: number
    away_pick: number
    points_awarded: number | null
    profiles: { nick: string } | null
  }
  const otherPredsMap = new Map<
    string,
    { nick: string; homePick: number; awayPick: number; pointsAwarded: number | null }[]
  >()

  if (allLockedIds.length > 0) {
    const { data: otherPreds } = await supabase
      .from("predictions")
      .select("match_id, home_pick, away_pick, points_awarded, profiles(nick)")
      .in("match_id", allLockedIds)
      .neq("user_id", user.id)
      .order("match_id")

    for (const row of (otherPreds ?? []) as unknown as OtherPredRow[]) {
      const nick = row.profiles?.nick ?? "—"
      const entry = {
        nick,
        homePick: row.home_pick,
        awayPick: row.away_pick,
        pointsAwarded: row.points_awarded,
      }
      if (!otherPredsMap.has(row.match_id)) otherPredsMap.set(row.match_id, [])
      otherPredsMap.get(row.match_id)!.push(entry)
    }
  }

  // Group matches by group letter (A–L)
  const groupsMap = new Map<string, MatchWithTeams[]>()
  for (const match of matches) {
    const g = match.group ?? "?"
    if (!groupsMap.has(g)) groupsMap.set(g, [])
    groupsMap.get(g)!.push(match)
  }
  const sortedGroups = [...groupsMap.keys()].sort()

  // Group knockout matches by stage
  const knockoutByStage = new Map<string, KnockoutMatch[]>()
  for (const match of knockoutMatches) {
    if (!knockoutByStage.has(match.stage)) knockoutByStage.set(match.stage, [])
    knockoutByStage.get(match.stage)!.push(match)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Typy meczów</h1>
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
              width: totalCount > 0 ? `${Math.round((filledCount / totalCount) * 100)}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* Group stage */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Faza grupowa</h2>
        {matches.length === 0 ? (
          <p className="text-muted-foreground">
            Mecze fazy grupowej nie zostały jeszcze załadowane.
          </p>
        ) : (
          sortedGroups.map((groupLetter) => {
            const groupMatches = groupsMap.get(groupLetter)!
            return (
              <section key={groupLetter}>
                <h3 className="text-base font-semibold mb-2 text-muted-foreground">
                  Grupa {groupLetter}
                </h3>
                <div className="space-y-2">
                  {groupMatches.map((match) => {
                    const isLocked = now >= new Date(match.kickoff_at)
                    return (
                      <div key={match.id}>
                        <MatchPredictionCard
                          matchId={match.id}
                          homeTeam={match.home_team}
                          awayTeam={match.away_team}
                          kickoffAt={match.kickoff_at}
                          prediction={predictionMap.get(match.id) ?? null}
                          isLocked={isLocked}
                        />
                        {isLocked && (
                          <OthersPredictions
                            predictions={otherPredsMap.get(match.id) ?? []}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </div>

      {/* Knockout stages */}
      {knockoutMatches.length > 0 && (
        <div className="space-y-6 pt-4 border-t">
          <div>
            <h2 className="text-xl font-semibold">Faza pucharowa</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Typowanie dostępne po ustaleniu par. Mecze rozliczane po 90 min.
            </p>
          </div>
          {KNOCKOUT_STAGES.map((stage) => {
            const stageMatches = knockoutByStage.get(stage)
            if (!stageMatches?.length) return null
            return (
              <section key={stage}>
                <h3 className="text-base font-semibold mb-2 text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </h3>
                <div className="space-y-2">
                  {stageMatches.map((match) => {
                    const isPending = !match.home_team || !match.away_team
                    const isLocked = !isPending && now >= new Date(match.kickoff_at)

                    if (isPending) {
                      return (
                        <KnockoutPendingCard
                          key={match.id}
                          kickoffAt={match.kickoff_at}
                          roundLabel={match.round_label}
                        />
                      )
                    }

                    return (
                      <div key={match.id}>
                        <MatchPredictionCard
                          matchId={match.id}
                          homeTeam={match.home_team!}
                          awayTeam={match.away_team!}
                          kickoffAt={match.kickoff_at}
                          prediction={predictionMap.get(match.id) ?? null}
                          isLocked={isLocked}
                        />
                        {isLocked && (
                          <OthersPredictions
                            predictions={otherPredsMap.get(match.id) ?? []}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function KnockoutPendingCard({
  kickoffAt,
  roundLabel,
}: {
  kickoffAt: string
  roundLabel: string | null
}) {
  const kickoff = new Date(kickoffAt)
  const dateStr = kickoff.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  })
  const timeStr = kickoff.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="rounded-lg border bg-card/50 p-3 flex items-center justify-between opacity-60">
      <span className="text-sm text-muted-foreground">
        {roundLabel ?? "Mecz pucharowy"}
      </span>
      <span className="text-xs italic text-muted-foreground">Oczekuje na pary</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {dateStr} {timeStr}
      </span>
    </div>
  )
}
