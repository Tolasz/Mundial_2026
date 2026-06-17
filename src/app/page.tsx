import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"
import { WelcomeHero } from "@/components/dashboard/WelcomeHero"
import { UpcomingMatches } from "@/components/dashboard/UpcomingMatches"
import { MissingPredictionsAlert } from "@/components/dashboard/MissingPredictionsAlert"
import { GroupStandings } from "@/components/dashboard/GroupStandings"
import { upcomingMatches, missingPredictions, next24hMatches } from "@/lib/dashboard/derive"
import type { DashboardMatchVM, DashboardTeamVM } from "@/lib/dashboard/derive"
import { rankRows } from "@/lib/leaderboard/derive"
import { HomePlayersTable } from "@/components/home-players-table"
import type { HomeTableRow } from "@/components/home-players-table"
import { computeGroupStandings } from "@/lib/groups/derive"
import type { GroupTeamVM, GroupMatchVM } from "@/lib/groups/derive"

interface TeamRow {
  id: string
  name: string
  short_name: string
  flag_url: string
}

interface RawMatch {
  id: string
  kickoff_at: string
  stage: string
  group: string | null
  round_label: string | null
  home_score: number | null
  away_score: number | null
  status: string
  home_team: TeamRow | null
  away_team: TeamRow | null
}

interface RawGroupTeam {
  id: string
  name: string
  short_name: string
  flag_url: string
  group: string | null
}

function toTeamVM(row: TeamRow): DashboardTeamVM {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    flagUrl: row.flag_url,
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const now = new Date()

  const [
    matchesResult,
    predictionsResult,
    profileResult,
    leaderboardResult,
    teamsResult,
    historyResult,
    championsResult,
  ] = await Promise.all([
      supabase
        .from("matches")
        .select(
          `id, kickoff_at, stage, group, round_label, home_score, away_score, status,
           home_team:teams!matches_home_team_id_fkey(id, name, short_name, flag_url),
           away_team:teams!matches_away_team_id_fkey(id, name, short_name, flag_url)`,
        )
        .order("kickoff_at", { ascending: true }),

      supabase
        .from("predictions")
        .select("match_id, home_pick, away_pick")
        .eq("user_id", user.id),

      supabase
        .from("profiles")
        .select("nick")
        .eq("id", user.id)
        .single(),

      supabase
        .from("leaderboard")
        .select(
          "user_id, nick, total_points, match_points, champion_bonus, exact_hits, result_hits, predicted_count",
        )
        .order("total_points", { ascending: false })
        .order("exact_hits", { ascending: false }),

      supabase
        .from("teams")
        .select("id, name, short_name, flag_url, group")
        .not("group", "is", null),

      // All settled predictions for history dots (RLS allows reading others' after kickoff)
      supabase
        .from("predictions")
        .select("user_id, match_id, points_awarded")
        .not("points_awarded", "is", null),

      // Champion picks with team details
      supabase
        .from("profiles")
        .select("id, champion_team_id, teams:teams!profiles_champion_team_id_fkey(id, name, flag_url)")
        .not("champion_team_id", "is", null),
    ])

  const nick =
    profileResult.data?.nick ?? user.email?.split("@")[0] ?? "Graczu"

  const predictionsByMatchId = new Map(
    (predictionsResult.data ?? []).map((p) => [
      p.match_id,
      { homePick: p.home_pick as number, awayPick: p.away_pick as number },
    ]),
  )

  const allMatches: DashboardMatchVM[] = (
    (matchesResult.data as RawMatch[] | null) ?? []
  ).map((m) => ({
    id: m.id,
    kickoffAt: m.kickoff_at,
    stage: m.stage,
    group: m.group,
    roundLabel: m.round_label,
    home: m.home_team ? toTeamVM(m.home_team) : null,
    away: m.away_team ? toTeamVM(m.away_team) : null,
    prediction: predictionsByMatchId.get(m.id) ?? null,
  }))

  const userPredictions = (predictionsResult.data ?? []).map((p) => ({
    matchId: p.match_id,
  }))

  const upcoming = next24hMatches(allMatches, now)
  const missing = missingPredictions(allMatches, userPredictions, now)

  // Group standings derived from finished group-stage matches.
  const groupTeams: GroupTeamVM[] = (
    (teamsResult.data as RawGroupTeam[] | null) ?? []
  ).map((t) => ({
    id: t.id,
    name: t.name,
    shortName: t.short_name,
    flagUrl: t.flag_url,
    group: t.group,
  }))

  const groupMatches: GroupMatchVM[] = (
    (matchesResult.data as RawMatch[] | null) ?? []
  )
    .filter((m) => m.stage === "group")
    .map((m) => ({
      group: m.group,
      status: m.status,
      homeTeamId: m.home_team?.id ?? null,
      awayTeamId: m.away_team?.id ?? null,
      homeScore: m.home_score,
      awayScore: m.away_score,
    }))

  const groupStandings = computeGroupStandings(groupTeams, groupMatches)

  // Derive rank + points from leaderboard rows
  const { podium, rest } = rankRows(leaderboardResult.data ?? [], user.id)
  const allRanked = [...podium, ...rest]
  const myEntry = allRanked.find((r) => r.isCurrentUser)
  const rank = myEntry?.rank ?? null
  const totalPoints = myEntry?.totalPoints ?? null

  // Build match kickoff lookup for sorting history chronologically
  const matchKickoffMap = new Map(
    (matchesResult.data ?? []).map((m) => [m.id, m.kickoff_at]),
  )

  // Group settled predictions by user — only matches from last 24h
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const historyByUser = new Map<string, { matchId: string; points: number; kickoffAt: string }[]>()
  for (const pred of historyResult.data ?? []) {
    const kickoffAt = matchKickoffMap.get(pred.match_id as string) ?? ""
    if (kickoffAt < cutoff) continue
    const uid = pred.user_id as string
    if (!historyByUser.has(uid)) historyByUser.set(uid, [])
    historyByUser.get(uid)!.push({
      matchId: pred.match_id as string,
      points: pred.points_awarded as number,
      kickoffAt,
    })
  }
  for (const entries of historyByUser.values()) {
    entries.sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
  }

  // Build champion info map
  type RawChampionRow = { id: string; champion_team_id: string | null; teams: { id: string; name: string; flag_url: string } | null }
  const championByUser = new Map<string, { name: string; flagUrl: string }>()
  for (const row of (championsResult.data ?? []) as RawChampionRow[]) {
    if (row.teams) {
      championByUser.set(row.id, { name: row.teams.name, flagUrl: row.teams.flag_url })
    }
  }

  // Merge into HomeTableRow[]
  const homeTableRows: HomeTableRow[] = allRanked.map((r) => ({
    ...r,
    history: (historyByUser.get(r.userId) ?? []).map((e) => e.points),
    champion: championByUser.get(r.userId) ?? null,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
        <WelcomeHero nick={nick} rank={rank} totalPoints={totalPoints} />
        <HomePlayersTable rows={homeTableRows} />
        <MissingPredictionsAlert count={missing.length} />
        <UpcomingMatches matches={upcoming} now={now} />
        <GroupStandings standings={groupStandings} />
      </main>
    </div>
  )
}

